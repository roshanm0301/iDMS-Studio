// ============================================================
// iDMS Admin Studio — Entity Designer Types
// ============================================================

import type { LayerCode } from './index';

// ===== Field Types =====
export type FieldTypeCode =
  // MVP 14 types
  | 'text' | 'textarea' | 'number' | 'decimal' | 'currency' | 'percentage'
  | 'date' | 'datetime' | 'time' | 'boolean' | 'select' | 'multi_select'
  | 'entity_ref' | 'file' | 'collection'
  // Next Scope types (address removed — use entity_ref to Area master instead)
  | 'email' | 'phone' | 'url' | 'auto_number' | 'computed' | 'rollup'
  | 'json' | 'rich_text' | 'geo_point' | 'signature' | 'barcode' | 'rating';

// ===== Entity Category =====
export type EntityCategory = 'transaction' | 'master' | 'configuration' | 'ledger_like';

// ===== Entity Status =====
export type EntityStatus = 'draft' | 'active' | 'deprecated';

// ===== Field Lifecycle =====
export type FieldLifecycleState = 'draft' | 'active' | 'disabled';

// ===== Field Behaviors =====
export type PresenceBehavior = 'optional' | 'on_create' | 'on_update' | 'before_submit' | 'before_approve' | 'conditional';
export type EditabilityBehavior = 'always' | 'create_only' | 'until_submit' | 'readonly' | 'system_only' | 'integration_only';
export type VisibilityBehavior = 'default' | 'hidden' | 'masked';
export type AuditBehavior = 'none' | 'audit_change' | 'audit_masked';
export type DefaultSource = 'none' | 'static' | 'today' | 'now' | 'session_tenant' | 'session_node' | 'session_user' | 'tenant_default_currency';

export interface FieldBehaviors {
  presence: PresenceBehavior;
  editability: EditabilityBehavior;
  visibility: VisibilityBehavior;
  defaultSource: DefaultSource;
  defaultValue?: unknown;
  searchable: boolean;
  filterable: boolean;
  sortable: boolean;
  includeInDefaultList: boolean;
  includeInLookupDisplay: boolean;
  auditBehavior: AuditBehavior;
}

// ===== Data Classification =====
// open     — safe to share externally (customer portals, public APIs, exports)
// internal — business use only, not for external audiences (DEFAULT)
// sensitive — personal or commercially confidential; harm from exposure
// regulated — subject to external legal/regulatory obligation (GSTIN, PAN, bank accounts)
export type DataClassification = 'open' | 'internal' | 'sensitive' | 'regulated';

// ===== Overlay Operation =====
export type OverlayOperation = 'extend' | 'replace' | 'constrain' | 'decorate' | 'disable';

// ===== Field Governance =====
export interface FieldGovernance {
  classification: DataClassification;
  canDownstreamConstrain: boolean;
  canDownstreamRelax: boolean;
  canDownstreamDisable: boolean;
  includeInExport: boolean;
  allowImport: boolean;
  allowBulkUpdate: boolean;
  maskInExport: boolean;
  apiInputAllowed: boolean;
  apiOutputAllowed: boolean;
  apiOutputMasked: boolean;
  isExternalId?: boolean;  // marks this field as the external system matching key for integration upsert
}

// ===== Field Dependency =====
export type DependencyType = 'rule' | 'workflow' | 'permission' | 'layout' | 'view' | 'import_export' | 'report' | 'api';
export type DependencySeverity = 'info' | 'warning' | 'breaking';

export interface FieldDependency {
  dependencyType: DependencyType;
  name: string;
  artifactKey: string;
  fieldPath: string;
  severity: DependencySeverity;
  recommendedAction: string;
}

// ===== Lifecycle Transition Metadata =====
export interface LifecycleTransitionMeta {
  reason?: string;
  replacementFieldId?: string;
  effectiveDate?: string;
}

// ===== Field Instance =====
export interface FieldInstance {
  fieldId: string;
  label: string;
  description?: string;
  fieldType: FieldTypeCode;
  sourceLayer: LayerCode;
  overlayOperation: OverlayOperation;
  protected: boolean;
  classification: DataClassification;
  behaviors: FieldBehaviors;
  typeConfig: Record<string, any>;
  governance: FieldGovernance;
  lifecycle: FieldLifecycleState;
  lifecycleMeta?: LifecycleTransitionMeta;
  dependencies?: FieldDependency[];
  attributeRef?: string; // reference to catalog attribute_code if sourced from catalog
  inheritedFrom?: string; // parent entityType this field was inherited from (read-only in child)
  order?: number;
}

// ===== Entity Behaviors =====
export interface EntityBehaviors {
  workflowEnabled: boolean;
  auditable: boolean;
  softDelete: boolean;
  allowAttachments: boolean;
  allowBulkImport: boolean;
  allowDownstreamExtension: boolean;
  allowDownstreamRequirednessRelaxation: boolean;
}

// ===== Entity Definition =====
export interface EntityDefinition {
  entityType: string;   // e.g. "vehicle_order"
  label: string;        // e.g. "Vehicle Order"
  description: string;
  category: EntityCategory;
  domain: string;       // e.g. "Sales", "Service"
  owningLayer: LayerCode;
  behaviors: EntityBehaviors;
  status: EntityStatus;
  fields: FieldInstance[];
  templateId?: string;
  parentEntityType?: string; // set when this entity extends another (Overlay: Option A)
  createdAt?: string;
  lastModified?: string;
}

// ===== Entity Template =====
export interface EntityTemplate {
  templateId: string;
  label: string;
  category: EntityCategory;
  domain: string;
  description: string;
  systemFields: string[]; // field labels
  suggestedGroups: string[];
  workflowRecommendation: string;
  icon?: string;
}

// ===== Compile Readiness =====
export type CompileStatus = 'pass' | 'warn' | 'error';

export interface CompileIssue {
  fieldId?: string;
  severity: 'error' | 'warning';
  code: string;
  message: string;
}

export interface CompileReadiness {
  status: CompileStatus;
  errors: CompileIssue[];
  warnings: CompileIssue[];
  fieldIssues: Record<string, CompileIssue[]>; // keyed by fieldId
}

// ===== Schema Diff =====
export type DiffSeverity = 'safe' | 'stricter' | 'risky' | 'breaking';

export interface DiffEntry {
  fieldId: string;
  label: string;
  severity: DiffSeverity;
  description: string;
  before?: string;
  after?: string;
}

export interface SchemaDiff {
  mode: 'draft_vs_active' | 'layer_delta' | 'resolved_scope';
  added: DiffEntry[];
  changed: DiffEntry[];
  deprecated: DiffEntry[];
  disabled: DiffEntry[];
  validationChanges: DiffEntry[];
  overlayChanges: DiffEntry[];
}

// ===== Conflict Rule =====
export interface ConflictRule {
  ruleId: string;
  severity: 'error' | 'warning';
  message: string;
  check: (field: FieldInstance, entity: EntityDefinition) => boolean;
}

// ===== Overlay History Entry =====
export interface OverlayHistoryEntry {
  layer: LayerCode;
  operation: OverlayOperation;
  author: string;
  timestamp: string;
  reason?: string;
}

// ===== Creation Pattern =====
export type CreationPattern = 'template' | 'extend' | 'blank' | 'clone' | 'package';

// ===== Schema Sub-tab =====
export type SchemaSubTab = 'fields' | 'diff' | 'imports' | 'governance';

// ===== Add Field Mode =====
export type AddFieldMode = 'catalog' | 'local' | null;

// ===== Advanced Catalog Attribute (extends base CatalogAttribute) =====
export interface AdvancedCatalogAttribute {
  attribute_code: string;
  label: string;
  field_type: FieldTypeCode;
  domain: string;
  protected: boolean;
  reusable: boolean;
  used_in: string[];
  owner_layer: LayerCode;
  description?: string;
  classification: DataClassification;
  defaultBehaviors?: Partial<FieldBehaviors>;
  defaultGovernance?: Partial<FieldGovernance>;
}

// ===== Code Setting References (for auto_number type) =====
export interface DocumentCodeSetting {
  id: string;
  label: string;             // e.g. "Vehicle Order"
  prefix: string;            // e.g. "VO"
  sequenceScope: 'tenant' | 'node' | 'financial_year';
  paddingLength: number;
  resetPolicy: 'never' | 'financial_year' | 'calendar_year';
  manualOverrideAllowed: boolean;
  previewExample: string;    // e.g. "VO-PUN-2026-000123"
}

export interface MasterCodeSetting {
  id: string;
  label: string;
  prefix: string;
  sequenceScope: 'platform' | 'tenant';
  paddingLength: number;
  manualOverrideAllowed: boolean;
  previewExample: string;
}

// ===== Entity Ref Filter Conditions (for entity_ref Condition Builder) =====
export type ConditionOperator = 'equals' | 'not_equals' | 'in' | 'not_in' | 'is_null' | 'is_not_null';
export type ConditionValueSource = 'static' | 'current_record_field' | 'session';
export type SessionContextKey = 'current_user_id' | 'current_tenant_id' | 'current_node_id' | 'current_role_code';

export interface FilterCondition {
  id: string;                        // uuid for React key
  targetField: string;               // field on the referenced entity to filter on
  operator: ConditionOperator;
  valueSource: ConditionValueSource;
  staticValue?: string;              // when valueSource = 'static'
  recordFieldRef?: string;           // when valueSource = 'current_record_field'
  sessionKey?: SessionContextKey;    // when valueSource = 'session'
}

export interface FilterConditionGroup {
  logic: 'AND' | 'OR';
  conditions: FilterCondition[];
}

// ===== Collection Item Field Definition =====
export interface SimpleFieldDef {
  fieldId: string;
  label: string;
  fieldType: 'text' | 'number' | 'decimal' | 'boolean' | 'select' | 'date' | 'currency' | 'percentage';
  required: boolean;
  typeConfig?: Record<string, any>;  // for select: optionItems, etc.
}
