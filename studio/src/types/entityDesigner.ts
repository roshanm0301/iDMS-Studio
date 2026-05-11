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
  // Phase 1 additions
  viewParticipation?: 'list_and_form' | 'form_only' | 'explicit'; // default: 'list_and_form'
  // Phase 3 additions
  displayFormat?: FieldDisplayFormat; // structured display format (Indian locale, date masks, etc.)
}

// ===== Entity Behaviors =====
export interface EntityBehaviors {
  workflowEnabled: boolean;
  auditable: boolean;
  softDelete: boolean;
  allowDownstreamExtension: boolean;
  allowDownstreamRequirednessRelaxation: boolean;
  reportingEnabled?: boolean;     // Include entity in reporting and analytics
  searchIndexEnabled?: boolean;   // Include records in global search
}

// ===== Entity Definition =====
export interface EntityDefinition {
  entityType: string;   // e.g. "vehicle_order"
  label: string;        // e.g. "Vehicle Order"
  pluralLabel?: string; // e.g. "Vehicle Orders" — used in list pages, API collection names, count badges
  displayNameFieldId?: string; // fieldId of the canonical record name field (shown in dropdowns, search, notifications)
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
  // Phase 1 additions
  views?: EntityView[];                  // named screen definitions (list_view, form_view, etc.)
  lookupEligible?: boolean;              // can entity_ref fields target this entity? (auto-inferred from category)
  lookupSearchFields?: string[];         // default fields searched in entity_ref pickers
  lookupDisplayTemplate?: string;        // e.g. '{{full_name}} — {{customer_code}}'
  // Phase 2 additions
  actions?: EntityAction[];              // custom entity-level actions (standard actions are auto-provisioned)
}

// ===== Entity Template =====
export interface EntityTemplate {
  templateId: string;
  label: string;
  category: EntityCategory;
  domain: string;
  description: string;
  systemFields: SimpleFieldDef[]; // typed field definitions — injected on entity creation
  displayNameFieldId: string;      // fieldId of the field that is the canonical record name
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
export type SchemaSubTab = 'fields' | 'diff' | 'imports' | 'governance' | 'views' | 'actions';

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
// Also used as the typed field definition inside EntityTemplate.systemFields
export interface SimpleFieldDef {
  fieldId: string;
  label: string;
  fieldType: 'text' | 'number' | 'decimal' | 'boolean' | 'select' | 'date' | 'currency' | 'percentage'
           | 'auto_number' | 'entity_ref' | 'datetime' | 'time';  // extended for template system fields
  required: boolean;
  typeConfig?: Record<string, any>;
  protected?: boolean;    // true → FieldInstance.protected = true (cannot be removed or structurally changed)
  systemOwned?: boolean;  // true → sourceLayer: 'platform', editability: 'system_only', visibility: 'hidden' for infra fields
}

// ============================================================
// PHASE 1 — Views, Field Scoping, Lookup Eligibility
// ============================================================

// ===== View Types =====
export type ViewType = 'list_view' | 'form_view' | 'quick_view' | 'print_view';
export type SummaryType = 'none' | 'sum' | 'count' | 'avg' | 'min' | 'max';
export type GroupInterval = 'none' | 'day' | 'week' | 'month' | 'quarter' | 'year';
export type FreezePosition = 'none' | 'left' | 'right';

// Per-field config within a single view (not global — belongs to the view, not the field)
export interface ViewFieldConfig {
  fieldId: string;
  visible: boolean;
  columnWidth?: number;            // list_view: suggested column width in px
  summaryType?: SummaryType;       // list_view: footer aggregation (auto-defaulted from field type)
  groupInterval?: GroupInterval;   // list_view: date/datetime grouping interval
  freezePosition?: FreezePosition; // list_view: column pin position
  textAlign?: 'auto' | 'left' | 'right' | 'center';
  showInColumnChooser?: boolean;   // user can show/hide this column at runtime
  sectionId?: string;              // form_view: which section this field belongs to
  readonly?: boolean;              // override editability for this view only
}

// Named section grouping within a form view
export interface ViewSection {
  sectionId: string;
  label: string;
  columns: 1 | 2 | 3;
  collapsible: boolean;
  defaultCollapsed: boolean;
}

// Full view definition stored on EntityDefinition
export interface EntityView {
  viewId: string;
  label: string;
  viewType: ViewType;
  isDefault: boolean;              // one default per viewType allowed
  owningLayer: LayerCode;          // which layer defined this view (governance)
  filterConditions?: FilterConditionGroup; // reuses existing Condition Builder type
  fieldConfig: ViewFieldConfig[];          // ordered list of field visibility + layout
  sections?: ViewSection[];                // form_view only
}

// ============================================================
// PHASE 2 — Entity Actions (discriminated union)
// ============================================================

export type ActionPlacement = 'toolbar' | 'context_menu' | 'action_panel' | 'form_footer';
export type ActionHandlerType = 'workflow_trigger' | 'navigation' | 'api_call' | 'print' | 'export';

// Discriminated union — each config has a `type` literal field for safe TS narrowing
export interface WorkflowTriggerConfig {
  type: 'workflow_trigger';
  workflowCode: string;
  transitionCode?: string;
}
export interface NavigationConfig {
  type: 'navigation';
  targetEntity?: string;
  targetViewId?: string;
  openMode: 'same_page' | 'new_tab' | 'modal';
}
export interface ApiCallConfig {
  type: 'api_call';
  endpointCode: string;
  successMessage?: string;
  failureMessage?: string;
}
export interface PrintConfig {
  type: 'print';
  templateCode: string;
}
export interface ExportConfig {
  type: 'export';
  format: 'csv' | 'pdf' | 'excel';
  viewId?: string;
}

export type ActionHandlerConfig =
  | WorkflowTriggerConfig
  | NavigationConfig
  | ApiCallConfig
  | PrintConfig
  | ExportConfig;

export interface EntityAction {
  actionId: string;
  label: string;
  icon?: string;                          // lucide icon name string
  placement: ActionPlacement;
  owningLayer: LayerCode;
  handlerType: ActionHandlerType;
  handlerConfig: ActionHandlerConfig;     // discriminated union — type-safe
  visibilityCondition?: FilterConditionGroup;
  confirmationRequired: boolean;
  confirmationMessage?: string;
}

// Reverse relation (computed — not stored on entity, computed from entity graph)
export interface ReverseRelation {
  sourceEntity: string;       // entity that HAS the entity_ref pointing here
  sourceEntityLabel: string;
  sourceField: string;        // the entity_ref fieldId
  sourceFieldLabel: string;
  showInPanel: boolean;       // default: true for transaction→master
}

// ============================================================
// PHASE 3 — Display Format, Field Copy Rules, Storage Type
// ============================================================

// Structured display format config (replaces opaque FW5 mask strings)
export type ThousandSeparatorStyle = 'indian' | 'international' | 'none';
// indian: 1,23,456.78  |  international: 123,456.78  |  none: 123456.78

export type DateFormatOption =
  | 'dd/MM/yyyy'    // 31/12/2026 — Indian standard
  | 'dd-MMM-yyyy'   // 31-Dec-2026
  | 'dd-MM-yyyy'    // 31-12-2026
  | 'yyyy-MM-dd'    // 2026-12-31 — ISO
  | 'MMMM d, yyyy'; // December 31, 2026

export interface FieldDisplayFormat {
  // Numbers (number, decimal, currency, percentage):
  decimalPlaces?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  thousandSeparator?: ThousandSeparatorStyle;
  negativeDisplay?: 'minus_prefix' | 'parentheses' | 'red_text';
  currencySymbolPosition?: 'prefix' | 'suffix';
  // Dates:
  dateFormat?: DateFormatOption;
  // Time / datetime:
  timeFormat?: '12h' | '24h';
  showSeconds?: boolean;
  // Percentage:
  multiplyBy100?: boolean;  // stored 0.25 → display 25%
}

// On-select field copy rules (stored in entity_ref typeConfig.copyRules[])
export type CopyTrigger = 'on_select' | 'on_save';

export interface FieldCopyRule {
  ruleId: string;             // crypto.randomUUID() for React key
  sourceField: string;        // field on the TARGET entity to read from
  destinationField: string;   // field on the CURRENT entity to write to
  copyTrigger: CopyTrigger;
  overwriteIfFilled: boolean; // overwrite destination if it already has a value
}

// Storage type — computed, not stored on FieldInstance
export type StorageType = 'physical' | 'extension' | 'virtual' | 'persisted_computed';
