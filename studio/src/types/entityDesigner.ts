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
  | 'email' | 'phone' | 'url' | 'address' | 'auto_number' | 'computed' | 'rollup'
  | 'json' | 'rich_text' | 'geo_point' | 'signature' | 'barcode' | 'rating';

// ===== Entity Category =====
export type EntityCategory = 'transaction' | 'master' | 'configuration' | 'ledger_like';

// ============================================================
// v2 — ENTITY CLASSIFICATION DIMENSIONS
// ============================================================

// v2 — Entity Archetype (what runtime shape is this entity?)
export type EntityArchetype =
  | 'native_persistent'       // canonical iDMS-owned table — full CRUD, workflow, governance
  | 'virtual_computed'        // query/view-backed, no own physical table; cannot be saved
  | 'external_federated'      // owned by external system (OEM portal, ERP, CRM); provider-backed
  | 'materialized_projection' // derived, stored for search/reporting speed; refresh-only
  | 'junction_association'    // M:N link table with optional payload attributes
  | 'owned_child'             // child entity whose lifecycle is governed by a parent
  | 'append_only_record'      // immutable ledger/event record; corrections via counter-entries
  | 'system_technical'        // platform-managed internal entity; hidden from business configurators
  // v3 additions
  | 'activity_interaction'    // tasks, calls, appointments, follow-ups, service reminders
  | 'staging_import'          // temporary hold for imported/integrated data before validation & promotion
  | 'high_volume_event_log'   // large-volume, append-heavy, time-series or telemetry-like data
  | 'integration_outbox'      // reliable event publishing, retry handling, outbound integration delivery
  | 'posting_document'        // business document: editable in draft, immutable after posting
  | 'reference_code';         // stable lookup/code data with localization and effective-date behavior

// v2 — Persistence Mode (how is it stored?)
export type PersistenceMode =
  | 'physical_table'           // standard relational table
  | 'extension_backed'         // overlay extension table ({entity}_ext)
  | 'view_backed'              // database view — no own table
  | 'materialized_view_backed' // materialized view — persisted snapshot
  | 'foreign_table_backed'     // FDW / foreign table from external DB
  | 'provider_backed'          // provider/connector-backed (external system)
  | 'stream_backed'            // event stream / append-only log
  | 'none'                     // no persistence (virtual/in-memory only)
  // v3 additions — more precise storage modes
  | 'owned_child_table'        // child table with parent FK
  | 'junction_table'           // M:N association table
  | 'append_log_table'         // append-only log/event table
  | 'outbox_table'             // integration outbox table
  | 'sql_view'                 // SQL view (virtual computed)
  | 'system_table';            // platform/system internal table

// v2 — Mutability Mode (how can records change?)
export type MutabilityMode =
  | 'read_write'               // full create/update/delete via iDMS
  | 'read_only'                // no mutations via iDMS (computed or external)
  | 'append_only'              // insert-only; corrections via counter-entries
  | 'system_managed'           // only platform internals can write
  | 'integration_write_only'   // only integration layer can write; UI cannot
  | 'provider_capability_driven' // write capability determined by external provider
  | 'derived_refresh_only'     // updated only via scheduled/triggered refresh
  // v3 additions
  | 'draft_edit_posted_immutable' // editable in draft, immutable after posting
  | 'staging_promote_only';      // staging data: validate → promote to target entity

// v2 — Scope Policy (data isolation boundary)
export type ScopePolicy =
  | 'global'              // shared across all tenants and nodes
  | 'tenant_scoped'       // isolated per tenant (company group)
  | 'company_scoped'      // isolated per company within a tenant
  | 'node_scoped'         // isolated per branch/location
  | 'hierarchical_scope'  // node-first, rolls up through hierarchy
  | 'external_scope'      // governed by external system's scope rules
  | 'not_applicable';     // scope concept does not apply (e.g. system_technical)

// v2 — Source of Truth (who owns the canonical record?)
export type SourceOfTruthType =
  | 'idms'            // iDMS is the system of record
  | 'external_system' // external system (OEM portal, ERP, CRM) is canonical
  | 'derived'         // computed/projected from other entities; no single owner
  | 'platform';       // platform-level data owned by the iDMS platform itself

// v2 — Expanded Business Category (superset of existing EntityCategory)
export type BusinessCategory =
  | 'master_data'   // core reference data (customers, products, locations)
  | 'transaction'   // event/process records (orders, invoices, jobs)
  | 'configuration' // system settings and configuration records
  | 'ledger_like'   // immutable financial/audit records
  | 'reference'     // shared lookup/code data (currencies, tax codes, UOM)
  | 'technical';    // platform-internal or technical entities

// v2 — Primary Key Strategy
export type PrimaryKeyStrategy = 'uuid' | 'natural' | 'composite' | 'external';

// v3 — Business Key Type (alternate key; physical PK is always UUID for iDMS-owned entities)
export type BusinessKeyType = 'none' | 'natural' | 'composite' | 'external_id' | 'provider_key';

// v3 — Capability Source (who set this capability value?)
export type CapabilitySource = 'archetype_default' | 'user' | 'provider' | 'compiler' | 'package';

// v3 — Provider Auth Mode
export type ProviderAuthMode = 'system' | 'user_delegated' | 'oauth' | 'api_key';

// v3 — Provider Security Mode
export type ProviderSecurityMode = 'local_only' | 'provider_only' | 'hybrid' | 'user_context_propagated';

// v3 — Record Ownership Model (who owns each record; drives row-level security and sharing rules)
export type RecordOwnershipModel =
  | 'user_owned'   // each record has a single owning user; row-level security is per-user
  | 'team_owned'   // record belongs to a team; all team members share access
  | 'org_owned'    // all users in the tenant can access; no per-record owner concept
  | 'none';        // ownership concept does not apply (virtual, derived, system, child, ledger)

// v3 — Storage Mode (more precise than PersistenceMode; describes physical storage shape)
export type StorageMode =
  | 'physical_table'
  | 'owned_child_table'
  | 'junction_table'
  | 'append_log_table'
  | 'outbox_table'
  | 'sql_view'
  | 'materialized_view_or_table'
  | 'external_provider'
  | 'system_table';

// ===== Entity Status =====
export type EntityStatus = 'draft' | 'active' | 'deprecated';

// ===== Field Lifecycle =====
export type FieldLifecycleState = 'draft' | 'active' | 'disabled' | 'deprecated';

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

  // ── Field Definition v2 — 6 Classification Dimensions (all optional, backward compat) ──
  semanticRole?: FieldSemanticRole;             // business meaning / identity role
  fieldArchetype?: FieldArchetypeCode;          // how the field's value comes into existence
  logicalShape?: LogicalShape;                  // structural shape of the value
  fieldPersistenceMode?: FieldPersistenceMode;  // field-level physical storage mode
  fieldMutabilityMode?: FieldMutabilityMode;    // field-level mutability contract
  valueSourceBindingMode?: ValueSourceBindingMode; // mechanism producing the value
  storageRiskClass?: StorageRiskClass;          // data integrity / compliance criticality

  // ── Field Definition v2 — Advanced Metadata Objects ───────────────────────
  queryCapabilities?: FieldQueryCapabilities;   // explicit, independently governable query flags
  valueSourceDef?: FieldValueSourceDefinition;  // governs value sourcing / lookup / binding
  derivationDef?: FieldDerivationDefinition;    // for computed, rollup, snapshot, projection fields
  snapshotPolicy?: FieldSnapshotPolicy;         // dedicated freeze-semantics for snapshot_copy fields
  protectionPolicy?: FieldProtectionPolicy;     // fine-grained masking/encryption/retention

  // ── Field Definition v2 — Presentation Hints ──────────────────────────────
  isDisplayCandidate?: boolean;  // candidate for entity's canonical display name (dropdowns, search)
  businessPurpose?: string;      // governance rationale for why this field exists
  pluralLabel?: string;          // plural form (for collection field headers)
}

// ===== Entity Behaviors =====
export interface EntityBehaviors {
  workflowEnabled: boolean;
  auditable: boolean;
  softDelete: boolean;
  allowAttachments?: boolean;
  allowBulkImport?: boolean;
  allowDownstreamExtension: boolean;
  allowDownstreamRequirednessRelaxation: boolean;
  reportingEnabled?: boolean;     // Include entity in reporting and analytics
  searchIndexEnabled?: boolean;   // Include records in global search
}

// ============================================================
// v3 — CAPABILITY DEFINITION (structured capability object)
// ============================================================

export interface CapabilityDefinition {
  capabilityCode: string;       // e.g. 'canSave', 'apiExposed', 'timelineEligible'
  requestedValue: boolean;      // what the user/template requested
  effectiveValue: boolean;      // what the system computed (after locks, provider constraints)
  locked: boolean;              // true if this capability cannot be changed by the user
  source: CapabilitySource;     // who set this value
  lockedReason?: string;        // human-readable reason for lock (shown in UI tooltip)
}

// ============================================================
// v3 — PROVIDER CAPABILITY CONTRACT
// ============================================================

export interface ProviderCapabilityContract {
  externalSystemCode: string;        // e.g. 'SAP_PROD', 'OEM_PORTAL'
  providerAdapterCode: string;       // e.g. 'sap_odata_v2', 'rest_json'
  providerEntityName: string;        // e.g. 'LedgerEntry', 'VehicleModel'
  authMode: ProviderAuthMode;
  sourceOfTruth: SourceOfTruthType;
  readSupported: boolean;
  createSupported: boolean;
  updateSupported: boolean;
  deleteSupported: boolean;
  actionSupported: boolean;
  filterSupported: boolean;
  sortSupported: boolean;
  searchSupported: boolean;
  paginationSupported: boolean;
  expandSupported: boolean;
  userContextPropagation: boolean;
  timeoutMs: number;
  retryPolicyId?: string;
  cachePolicyId?: string;
  errorMappingPolicyId?: string;
}

// ============================================================
// v3 — STORAGE CONFIGURATION
// ============================================================

export interface StorageConfig {
  storageMode: StorageMode;
  tableName?: string;            // auto-generated if not provided
  schemaName?: string;           // defaults to 'public'
  partitionPolicyId?: string;    // required for high-volume/event-log entities
  retentionPolicyId?: string;    // required for staging and high-volume entities
  archivePolicyId?: string;
  extensionTableName?: string;   // for extension_backed persistence
  softDeleteEnabled?: boolean;
  auditPolicyId?: string;
}

// ============================================================
// v3 — SECURITY DEFAULTS
// ============================================================

export interface SecurityDefaults {
  entityAdminRole?: string;            // role that administers this entity metadata
  recordCreateDefault: 'allow' | 'deny';
  recordReadDefault: 'allow' | 'deny';
  recordUpdateDefault: 'allow' | 'deny';
  recordDeleteDefault: 'allow' | 'deny';
  exportDefault: 'allow' | 'deny';
  apiAccessDefault: 'allow' | 'deny';
  fieldProtectionDefault: 'open' | 'internal';
  providerSecurityMode?: ProviderSecurityMode; // required for external/federated entities
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
  // Relationship Definition v2
  relationshipIds?: string[];            // IDs of RelationshipDefinitions where this entity participates (as source or target)

  // ── v2 Classification Dimensions (all optional for backward compat) ────────
  entityArchetype?: EntityArchetype;
  businessCategory?: BusinessCategory;    // v2 replacement for category — more granular
  persistenceMode?: PersistenceMode;
  mutabilityMode?: MutabilityMode;
  scopePolicy?: ScopePolicy;
  sourceOfTruthType?: SourceOfTruthType;

  // ── v2 Source Binding ─────────────────────────────────────────────────────
  sourceEntityIds?: string[];     // for derived/projection: source entity types
  externalSystemCode?: string;    // for external_federated: e.g. 'OEM_PORTAL', 'SAP_PROD'
  providerBindingId?: string;     // for provider_backed persistence

  // ── v2 Key & Display ──────────────────────────────────────────────────────
  primaryKeyStrategy?: PrimaryKeyStrategy;

  // ── v3 Key & Numbering ────────────────────────────────────────────────────
  businessKeyType?: BusinessKeyType;  // alternate/business key model; physical PK always UUID

  // ── v2 Capability Profile (12 independent flags) ──────────────────────────
  // These replace implicit inference from category/behaviors
  canSave?: boolean;          // records can be created/updated through iDMS
  importable?: boolean;       // CSV/bulk import contracts are allowed
  exportable?: boolean;       // export operations are allowed
  printable?: boolean;        // print/PDF output is supported
  reportable?: boolean;       // entity feeds analytics and report builders
  apiExposed?: boolean;       // a runtime API endpoint is generated
  offlineEnabled?: boolean;   // offline synchronisation is supported
  cacheable?: boolean;        // runtime caching is allowed for query results
  extendable?: boolean;       // downstream layers may add fields and behaviors
  searchable?: boolean;       // entity records appear in global and entity search
  // v3 capability flags
  timelineEligible?: boolean;       // activity/interactions appear in timeline
  notificationEligible?: boolean;   // can produce reminders/notifications
  packageInstallable?: boolean;     // can be installed/updated through package
  eventPublishable?: boolean;       // can publish domain events
  reversible?: boolean;             // supports reversal/counter-entry/cancellation
  retentionManaged?: boolean;       // has retention/TTL/archive policy
  partitioned?: boolean;            // uses partitioning strategy
  providerBacked?: boolean;         // uses external provider
  stagingPromotable?: boolean;      // can promote to target entity
  hierarchyRollupEnabled?: boolean; // supports roll-up aggregation/access

  // ── v3 Structured Metadata ────────────────────────────────────────────────
  namespace?: string;                              // e.g. 'auto_service' — required for package/platform entities
  shortCode?: string;                              // e.g. 'SJC', 'INV' — optional short identifier
  owningModule?: string;                           // e.g. 'Sales', 'Service', 'Finance'
  origin?: CreationPattern;                        // how was this entity created
  storageConfig?: StorageConfig;                   // physical storage configuration
  providerCapability?: ProviderCapabilityContract; // required for external/federated entities
  capabilityDefinitions?: CapabilityDefinition[];  // structured capability objects (v3)
  securityDefaults?: SecurityDefaults;             // default security posture
  recordOwnershipModel?: RecordOwnershipModel;     // who owns each record (user/team/org/none)
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
export type CreationPattern = 'extend' | 'blank' | 'clone' | 'package';

// ===== Schema Sub-tab =====
export type SchemaSubTab = 'fields' | 'diff' | 'imports' | 'governance' | 'views' | 'actions' | 'relations' | 'validation';

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
// Typed field definition used in entity creation flows
export interface SimpleFieldDef {
  fieldId: string;
  label: string;
  fieldType: 'text' | 'number' | 'decimal' | 'boolean' | 'select' | 'date' | 'currency' | 'percentage'
           | 'auto_number' | 'entity_ref' | 'datetime' | 'time' | 'json';  // extended for template system fields
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

// ============================================================
// FIELD DEFINITION v2 — 6 CLASSIFICATION DIMENSIONS
// ============================================================

// ── Dimension 1: Semantic Role ────────────────────────────────────────────
// What is this field's business meaning / role within the entity's identity?
export type FieldSemanticRole =
  | 'primary_key'           // physical/logical record identity (record_id, uuid)
  | 'business_key'          // human-facing identifier (order_number, invoice_number)
  | 'alternate_key'         // additional unique identifier (vehicle_reg_no, vin)
  | 'external_id'           // integration upsert/matching key (erp_customer_id, oem_ref)
  | 'display_name'          // canonical label for search results, dropdowns, notifications
  | 'status'                // workflow/lifecycle state carrier
  | 'scope_key'             // tenant/company/node partition key (tenant_id, node_id)
  | 'audit'                 // system-managed change-tracking (created_at, created_by)
  | 'business_attribute'    // core business fact (customer_name, amount, gst_rate)
  | 'measure'               // quantitative metric suitable for aggregation (quantity, amount)
  | 'dimension'             // categorical attribute used for grouping/filtering (region, product_category)
  | 'derived_indicator'     // computed flag or indicator (is_overdue, is_gst_registered)
  | 'snapshot_attribute';   // point-in-time copy of a master field (frozen name, frozen price)

// ── Dimension 2: Field Archetype / Value Origin ───────────────────────────
// How does this field's value come into existence?
export type FieldArchetypeCode =
  | 'stored_business'       // user-entered or imported value stored in own column
  | 'stored_extension'      // user-entered value stored in extension/overlay table
  | 'system_generated'      // platform auto-generates value (UUID, auto_number, created_at)
  | 'relationship_reference'// FK to another entity (entity_ref field)
  | 'value_set'             // value chosen from a governed picklist or inline list
  | 'computed_virtual'      // calculated at query time, never persisted
  | 'computed_persisted'    // calculated on save, stored for query performance
  | 'rollup'                // aggregate of related child record values (SUM, COUNT, etc.)
  | 'snapshot_copy'         // point-in-time copy that freezes at a lifecycle event
  | 'external_mapped'       // synced from / mapped to an external system field
  | 'projection_field'      // re-exposed from a source entity in a projection entity
  | 'compound_parent'       // virtual parent grouping constituent sub-fields (phone = {country_code, number})
  | 'compound_constituent'  // scalar sub-field belonging to a compound parent
  | 'media_reference'       // file/image/signature attachment reference
  | 'technical_shadow';     // platform-internal technical field (tenant_id, row_version)

// ── Dimension 3: Logical Shape ────────────────────────────────────────────
// What is the structural shape of the field's value?
export type LogicalShape =
  | 'scalar'        // single atomic value (text, number, date, boolean)
  | 'reference'     // foreign-key reference to another entity record
  | 'value_set'     // a value from a closed/governed list
  | 'multi_value'   // array / set of scalar values (multi_select, tags)
  | 'compound'      // structured composite with named sub-fields (address, name parts)
  | 'structured'    // free-structure JSON / rich object (json type)
  | 'media'         // binary/attachment reference (file, signature, barcode)
  | 'derived'       // computed from other fields or entities
  | 'collection';   // embedded list of sub-records (line items, labour entries)

// ── Dimension 4: Field-Level Persistence Mode ─────────────────────────────
// How is THIS field's data physically stored? (field-level, distinct from entity PersistenceMode)
export type FieldPersistenceMode =
  | 'physical_column'         // standard column in the entity's primary table
  | 'extension_column'        // column in the tenant extension table ({entity}_ext)
  | 'jsonb_extension'         // stored inside a JSONB column (flexible, less queryable)
  | 'generated_virtual'       // GENERATED ALWAYS AS (virtual) — computed at read, no storage
  | 'generated_stored'        // GENERATED ALWAYS AS (stored) — computed on write, physical column
  | 'query_projected'         // not stored; projected from a view or sub-query at read time
  | 'provider_backed'         // value lives in an external provider's system
  | 'snapshot_column'         // physical column holding a point-in-time frozen copy
  | 'relation_backed'         // value is derived from a foreign relation (e.g. rollup)
  | 'none';                   // no persistence (virtual UI-only field)

// ── Dimension 5: Field-Level Mutability Mode ──────────────────────────────
// How can this field's value change over its lifetime? (field-level, more granular than entity MutabilityMode)
export type FieldMutabilityMode =
  | 'user_editable'                   // user can edit freely within business rules
  | 'create_only'                     // set on create, immutable thereafter
  | 'editable_until_state'            // editable until a specific workflow state is reached
  | 'system_only'                     // only platform/system can write (record_id, created_at)
  | 'integration_only'                // only integration/sync process can write
  | 'provider_capability_driven'      // mutability governed by external provider's capabilities
  | 'derived_read_only'               // computed from formula/rollup; cannot be directly set
  | 'refresh_only'                    // updated only via a scheduled/triggered refresh cycle
  | 'append_immutable'                // once a value is appended/recorded it cannot be changed
  | 'snapshot_refreshable_until_freeze'; // editable/refreshable until freeze event fires; then immutable

// ── Dimension 6: Value Source / Binding Mode ─────────────────────────────
// What is the mechanism that produces or provides this field's value?
export type ValueSourceBindingMode =
  | 'direct_entry'          // user types value directly
  | 'static_value_set'      // inline list of values defined in typeConfig
  | 'governed_picklist'     // values from a governed master picklist (code setting)
  | 'lifecycle_state_set'   // values tied to workflow lifecycle states
  | 'entity_lookup'         // value chosen from another entity's records (entity_ref)
  | 'external_lookup'       // value fetched from an external API/provider at runtime
  | 'dependent_value_set'   // values filtered by parent field selection (cascading picklist)
  | 'query_binding'         // value derived from a configured query/view expression
  | 'provider_binding'      // value provided by an external system connector
  | 'formula_binding'       // value computed from a formula over sibling fields
  | 'rollup_binding'        // value aggregated from child entity records
  | 'copy_binding'          // value copied from a related record field (snapshot/fetch)
  | 'projection_binding'    // value re-exposed from a source entity in a projection
  | 'none';                 // no value source (system-managed or always null)

// ── Storage Risk Class ────────────────────────────────────────────────────
// How critical is the integrity / compliance of this field's stored value?
export type StorageRiskClass =
  | 'normal'               // standard business data — no special storage requirements
  | 'compliance_critical'  // regulatory obligation (GSTIN, PAN, Aadhaar, bank account)
  | 'financial_critical'   // financial amount or rate that affects ledger accuracy
  | 'integration_key'      // upsert/matching key used by integrations — must be unique + stable
  | 'report_critical';     // field feeds financial/compliance reports — must be accurate

// ── Query Capability Source ───────────────────────────────────────────────
// How was this field's query capability determined?
export type QueryCapabilitySource =
  | 'explicit'                  // designer explicitly enabled/disabled this capability
  | 'derived_from_type'         // auto-inferred from field type (e.g. text → searchable)
  | 'provider_capability'       // determined by external provider's advertised capabilities
  | 'inherited_from_projection';// inherited from the source field in a projection entity

// ── Field Query Capabilities ──────────────────────────────────────────────
// Explicit, independently governable query participation flags
export interface FieldQueryCapabilities {
  searchable: boolean;          // included in full-text / keyword search
  filterable: boolean;          // can be used as a filter/WHERE condition
  sortable: boolean;            // can be used as an ORDER BY column
  groupable: boolean;           // can be used as a GROUP BY dimension
  aggregatable: boolean;        // can be used with SUM/COUNT/AVG/MIN/MAX
  lookupDisplayEligible: boolean; // can appear in entity_ref lookup display/search results
  fullTextEligible: boolean;    // eligible for full-text index (tsvector / search engine)
  capabilitySource: QueryCapabilitySource; // how these caps were determined
  indexPolicyId?: string;       // reference to an index configuration policy (future)
}

// ── Field Value Source Definition ────────────────────────────────────────
// Governs how values are sourced, stored, and displayed for governed value-set / lookup fields
export interface FieldValueSourceDefinition {
  bindingMode: ValueSourceBindingMode;

  // For static_value_set / governed_picklist / lifecycle_state_set
  storedValueMode?: 'code' | 'label' | 'integer_id' | 'uuid';  // what is physically stored
  displayValueMode?: 'label' | 'code' | 'label_and_code';        // what is shown in UI

  // For entity_lookup
  targetEntityType?: string;
  targetKeyField?: string;
  targetDisplayField?: string;
  targetSearchFields?: string[];
  filterConditions?: FilterConditionGroup;

  // For external_lookup
  externalEndpointCode?: string;
  externalDisplayField?: string;
  externalKeyField?: string;

  // For dependent_value_set (cascading picklist)
  dependsOnFieldId?: string;
  dependentOptions?: Record<string, Array<{ label: string; value: string }>>;

  // For provider_binding
  providerBindingCode?: string;

  // For formula_binding / query_binding
  expressionText?: string;     // human-readable expression or SQL fragment
  referencedFieldIds?: string[]; // fields referenced in the expression

  // For rollup_binding
  sourceEntityType?: string;
  aggregateFunction?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'LATEST';
  sourceFieldId?: string;

  // For copy_binding (field-copy on event)
  copySourceEntityType?: string;
  copySourceFieldId?: string;
  copyTriggerEvent?: 'on_select' | 'on_create' | 'on_save' | 'on_state_change';
}

// ── Field Derivation Definition ───────────────────────────────────────────
// For computed, rollup, snapshot, and projection fields — describes how the value is derived
export interface FieldDerivationDefinition {
  derivationType: 'formula' | 'rollup' | 'copy_snapshot' | 'projection';

  // Refresh & Staleness
  refreshPolicy?: 'realtime' | 'on_save' | 'scheduled' | 'manual' | 'on_state_change';
  stalenessTolerance?: 'realtime' | 'minutes' | 'hours' | 'daily' | 'not_applicable';
  lastRefreshedAt?: string;         // ISO timestamp (runtime — not design-time)

  // For formula / computed_virtual
  formulaExpression?: string;       // the expression text
  referencedFieldIds?: string[];    // field IDs used in the formula

  // For rollup
  rollupSourceEntity?: string;
  rollupAggregateFunction?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'LATEST';
  rollupSourceFieldId?: string;

  // For copy_snapshot — the freeze / staleness semantics
  snapshotSourceEntityType?: string;
  snapshotSourceFieldId?: string;
  snapshotCopyTrigger?: 'on_select' | 'on_create' | 'on_save' | 'on_state_change';
  snapshotRefreshUntilState?: string;   // workflow state name, e.g. 'submitted'
  snapshotFreezeAtState?: string;       // workflow state at which snapshot becomes immutable
  snapshotOverwriteRule?: 'always_overwrite' | 'only_if_empty' | 'never_after_freeze';

  // For projection
  projectionSourceEntityType?: string;
  projectionSourceFieldId?: string;
}

// ── Field Snapshot Policy (dedicated helper for snapshot_copy archetype) ──
// Provides the complete business contract for a snapshot/frozen-copy field
export interface FieldSnapshotPolicy {
  sourceEntityType: string;     // entity whose field is being snapshotted
  sourceFieldId: string;        // the source field to copy from
  copyTrigger: 'on_select' | 'on_create' | 'on_save' | 'on_state_change';
  refreshUntilState?: string;   // keep refreshing (re-copying) until this workflow state
  freezeAtState?: string;       // become permanently immutable at this workflow state
  overwriteRule: 'always_overwrite' | 'only_if_empty' | 'never_after_freeze';
  // Governance note: once frozen, source-master edits MUST NOT mutate historical values
  // (e.g. customer name on a posted invoice, GSTIN on a filed return)
}

// ── Field Protection Policy ───────────────────────────────────────────────
// Fine-grained data protection beyond FieldGovernance (masking, encryption, export)
export interface FieldProtectionPolicy {
  maskingStrategy?: 'none' | 'partial_mask' | 'full_mask' | 'hash' | 'tokenize';
  partialMaskPattern?: string;       // e.g. '****{last4}' for card numbers
  encryptionRequired?: boolean;      // field value must be encrypted at rest
  apiResponseMaskingRule?: 'none' | 'always' | 'when_not_owner' | 'by_role';
  exportMaskingRule?: 'none' | 'always' | 'by_classification';
  retentionPolicyDays?: number;      // data retention duration
  deletionStrategy?: 'physical' | 'nullify' | 'tokenize_on_delete';
}

// ============================================================
// FIELD DEFINITION v2 — EXTENDED FieldInstance
// All new fields are optional for backward compatibility
// ============================================================

// Extend FieldInstance type to carry v2 metadata.
// This is done by declaration merging on the export below.
// The base interface is at line ~159; we extend it via module augmentation pattern
// by re-exporting an extended version here under a new name, then updating FieldInstance directly.

// NOTE: All v2 fields below are added to FieldInstance as optional — backward compat guaranteed.
// Existing mock entities without these fields will continue to type-check correctly.

// We add these fields to the FieldInstance interface by editing it at line 158.
// The declarations here serve as the canonical reference for the new field types.

// v2 additions to FieldInstance (all optional):
// semanticRole?: FieldSemanticRole
// fieldArchetype?: FieldArchetypeCode
// logicalShape?: LogicalShape
// fieldPersistenceMode?: FieldPersistenceMode
// fieldMutabilityMode?: FieldMutabilityMode
// valueSourceBindingMode?: ValueSourceBindingMode
// storageRiskClass?: StorageRiskClass
// queryCapabilities?: FieldQueryCapabilities
// valueSourceDef?: FieldValueSourceDefinition
// derivationDef?: FieldDerivationDefinition
// snapshotPolicy?: FieldSnapshotPolicy
// protectionPolicy?: FieldProtectionPolicy
// isDisplayCandidate?: boolean   — this field is a candidate for the entity's display name
// pluralLabel?: string           — plural form of field label (for collection display)
// businessPurpose?: string       — governance rationale for why this field exists
