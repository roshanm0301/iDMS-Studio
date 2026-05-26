import {
  METADATA_STATUSES,
  STRUCTURAL_LAYERS,
  type MetadataAudit,
  type MetadataStatus,
  type MetadataVersionRef,
  type OwnershipScope,
} from './shared';
import {
  fail,
  isPlainObject,
  ok,
  requireApiName,
  requireOneOf,
  requireString,
  type ValidationIssue,
  type ValidationResult,
} from './validation';

// ── View Types ────────────────────────────────────────────────
export const VIEW_TYPES = ['list_view', 'form_view', 'quick_view', 'print_view'] as const;
export type ViewType = (typeof VIEW_TYPES)[number];

// ── Aggregation / Layout helpers ──────────────────────────────
export const SUMMARY_TYPES = ['none', 'sum', 'count', 'avg', 'min', 'max'] as const;
export type SummaryType = (typeof SUMMARY_TYPES)[number];

export const GROUP_INTERVALS = ['none', 'day', 'week', 'month', 'quarter', 'year'] as const;
export type GroupInterval = (typeof GROUP_INTERVALS)[number];

export const FREEZE_POSITIONS = ['none', 'left', 'right'] as const;
export type FreezePosition = (typeof FREEZE_POSITIONS)[number];

export const TEXT_ALIGNMENTS = ['auto', 'left', 'right', 'center'] as const;
export type TextAlignment = (typeof TEXT_ALIGNMENTS)[number];

// ── Per-field config within a view ────────────────────────────
export interface ViewFieldConfigMetadata {
  fieldId: string;
  visible: boolean;
  columnWidth?: number;
  summaryType?: SummaryType;
  groupInterval?: GroupInterval;
  freezePosition?: FreezePosition;
  textAlign?: TextAlignment;
  showInColumnChooser?: boolean;
  sectionId?: string;
  readonly?: boolean;
}

// ── Section (form_view) ───────────────────────────────────────
export interface ViewSectionMetadata {
  sectionId: string;
  label: string;
  columns: 1 | 2 | 3;
  collapsible: boolean;
  defaultCollapsed: boolean;
}

// ── Filter condition (structural) ─────────────────────────────
export interface ViewFilterCondition {
  fieldId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in' | 'gt' | 'lt' | 'gte' | 'lte' | 'is_null' | 'is_not_null' | 'between';
  value?: unknown;
}

export interface ViewFilterGroup {
  logic: 'AND' | 'OR';
  conditions: ViewFilterCondition[];
}

// ── Sort / Default ordering ───────────────────────────────────
export interface ViewSortSpec {
  fieldId: string;
  direction: 'asc' | 'desc';
}

// ── Full ViewDefinitionMetadata ───────────────────────────────
export interface ViewDefinitionMetadata {
  viewId: string;
  entityId: string;
  apiName: string;
  label: string;
  description?: string;
  viewType: ViewType;
  isDefault: boolean;
  fieldConfig: ViewFieldConfigMetadata[];
  sections?: ViewSectionMetadata[];
  filterConditions?: ViewFilterGroup;
  defaultSort?: ViewSortSpec[];
  pageSize?: number;
  ownership: OwnershipScope;
  lifecycle: {
    metadataStatus: MetadataStatus;
  };
  version?: MetadataVersionRef;
  audit?: MetadataAudit;
}

// ── Validator ─────────────────────────────────────────────────
export function validateViewDefinition(input: unknown): ValidationResult<ViewDefinitionMetadata> {
  if (!isPlainObject(input)) {
    return fail([{ code: 'VIEW_INVALID_SHAPE', message: 'ViewDefinition must be an object.', severity: 'error' }]);
  }

  const issues: ValidationIssue[] = [];

  // Identity
  requireString(input.viewId, 'viewId', 'VIEW_ID_REQUIRED', 'View ID', issues);
  requireString(input.entityId, 'entityId', 'VIEW_ENTITY_REQUIRED', 'Entity ID', issues);
  requireApiName(input.apiName, 'apiName', issues);
  requireString(input.label, 'label', 'VIEW_LABEL_REQUIRED', 'View label', issues);

  // View type
  requireOneOf(input.viewType, VIEW_TYPES, 'viewType', 'VIEW_TYPE_INVALID', 'View type', issues);

  // isDefault must be boolean
  if (typeof input.isDefault !== 'boolean') {
    issues.push({ code: 'VIEW_IS_DEFAULT_REQUIRED', message: 'isDefault must be a boolean.', path: 'isDefault', severity: 'error' });
  }

  // fieldConfig array
  if (!Array.isArray(input.fieldConfig)) {
    issues.push({ code: 'VIEW_FIELD_CONFIG_REQUIRED', message: 'fieldConfig must be an array.', path: 'fieldConfig', severity: 'error' });
  } else {
    validateFieldConfigs(input.fieldConfig as unknown[], issues);
  }

  // Sections (form_view only but not enforced — may be empty for list_view)
  if (input.sections !== undefined && input.sections !== null) {
    if (!Array.isArray(input.sections)) {
      issues.push({ code: 'VIEW_SECTIONS_INVALID', message: 'sections must be an array.', path: 'sections', severity: 'error' });
    } else {
      validateSections(input.sections as unknown[], issues);
    }
  }

  // pageSize sanity
  if (input.pageSize !== undefined && input.pageSize !== null) {
    if (typeof input.pageSize !== 'number' || input.pageSize <= 0) {
      issues.push({ code: 'VIEW_PAGE_SIZE_INVALID', message: 'pageSize must be a positive number.', path: 'pageSize', severity: 'error' });
    }
  }

  // Ownership
  if (!isPlainObject(input.ownership)) {
    issues.push({ code: 'VIEW_OWNERSHIP_REQUIRED', message: 'View ownership is required.', path: 'ownership', severity: 'error' });
  } else {
    if (input.ownership.owningLayer === 'role') {
      issues.push({ code: 'VIEW_ROLE_LAYER_FORBIDDEN', message: 'Role cannot own view schema.', path: 'ownership.owningLayer', severity: 'blocking_error' });
    }
    requireOneOf(input.ownership.owningLayer, STRUCTURAL_LAYERS, 'ownership.owningLayer', 'VIEW_OWNING_LAYER_INVALID', 'Owning layer', issues);
  }

  // Lifecycle
  if (!isPlainObject(input.lifecycle)) {
    issues.push({ code: 'VIEW_LIFECYCLE_REQUIRED', message: 'View lifecycle is required.', path: 'lifecycle', severity: 'error' });
  } else {
    requireOneOf(input.lifecycle.metadataStatus, METADATA_STATUSES, 'lifecycle.metadataStatus', 'VIEW_STATUS_INVALID', 'Metadata status', issues);
  }

  if (issues.some(item => item.severity !== 'warning')) return fail(issues);
  return ok(input as unknown as ViewDefinitionMetadata, issues);
}

// ── Helpers ───────────────────────────────────────────────────
function validateFieldConfigs(configs: unknown[], issues: ValidationIssue[]): void {
  const seenIds = new Set<string>();
  for (let i = 0; i < configs.length; i++) {
    const fc = configs[i];
    if (!isPlainObject(fc)) {
      issues.push({ code: 'VIEW_FC_INVALID', message: `fieldConfig[${i}] must be an object.`, path: `fieldConfig[${i}]`, severity: 'error' });
      continue;
    }
    if (typeof fc.fieldId !== 'string' || fc.fieldId.trim() === '') {
      issues.push({ code: 'VIEW_FC_FIELD_ID_REQUIRED', message: `fieldConfig[${i}].fieldId is required.`, path: `fieldConfig[${i}].fieldId`, severity: 'error' });
    } else if (seenIds.has(fc.fieldId as string)) {
      issues.push({ code: 'VIEW_FC_DUPLICATE_FIELD', message: `Duplicate fieldId '${fc.fieldId as string}' in fieldConfig.`, path: `fieldConfig[${i}].fieldId`, severity: 'error' });
    } else {
      seenIds.add(fc.fieldId as string);
    }
    if (typeof fc.visible !== 'boolean') {
      issues.push({ code: 'VIEW_FC_VISIBLE_REQUIRED', message: `fieldConfig[${i}].visible must be a boolean.`, path: `fieldConfig[${i}].visible`, severity: 'error' });
    }
  }
}

function validateSections(sections: unknown[], issues: ValidationIssue[]): void {
  const seenIds = new Set<string>();
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (!isPlainObject(s)) {
      issues.push({ code: 'VIEW_SECTION_INVALID', message: `sections[${i}] must be an object.`, path: `sections[${i}]`, severity: 'error' });
      continue;
    }
    if (typeof s.sectionId !== 'string' || s.sectionId.trim() === '') {
      issues.push({ code: 'VIEW_SECTION_ID_REQUIRED', message: `sections[${i}].sectionId is required.`, path: `sections[${i}].sectionId`, severity: 'error' });
    } else if (seenIds.has(s.sectionId as string)) {
      issues.push({ code: 'VIEW_SECTION_DUPLICATE', message: `Duplicate sectionId '${s.sectionId as string}'.`, path: `sections[${i}].sectionId`, severity: 'error' });
    } else {
      seenIds.add(s.sectionId as string);
    }
    if (typeof s.label !== 'string' || s.label.trim() === '') {
      issues.push({ code: 'VIEW_SECTION_LABEL_REQUIRED', message: `sections[${i}].label is required.`, path: `sections[${i}].label`, severity: 'error' });
    }
    if (s.columns !== 1 && s.columns !== 2 && s.columns !== 3) {
      issues.push({ code: 'VIEW_SECTION_COLUMNS_INVALID', message: `sections[${i}].columns must be 1, 2, or 3.`, path: `sections[${i}].columns`, severity: 'error' });
    }
  }
}
