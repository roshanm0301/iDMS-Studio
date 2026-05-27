// UI Studio — Core Type Definitions
// All metadata types for view artifacts, entity metadata, and repository interfaces.

export type ViewSurfaceType =
  | 'list'
  | 'record_detail'
  | 'create_edit'
  | 'related_records'
  | 'transaction_workspace'
  | 'dashboard_summary'

export type ViewStatus = 'draft' | 'published' | 'needs_attention'

export interface ViewSummary {
  id: string
  viewKey: string
  label: string
  description?: string
  surfaceType: ViewSurfaceType
  primaryEntityId?: string
  status: ViewStatus
  version: number
  updatedAt: string
  createdAt: string
}

export interface LayoutContainer {
  id: string
  type: 'section' | 'tabs' | 'columns' | 'accordion' | 'panel'
  label?: string
  children: LayoutContainer[]
  fieldIds: string[]
}

export interface LayoutDefinition {
  containers: LayoutContainer[]
}

export interface ComponentDefinition {
  id: string
  componentType: string
  fieldId?: string
  label?: string
  config: Record<string, unknown>
}

export interface FilterExpression {
  field: string
  operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'in'
  value: unknown
}

export interface DataSourceDefinition {
  id: string
  sourceType: 'primary_entity' | 'related_entity' | 'static_options' | 'mock_api'
  entityId?: string
  filters: FilterExpression[]
}

export interface BindingDefinition {
  id: string
  componentId: string
  dataSourceId: string
  fieldPath: string
}

export interface ActionDefinition {
  id: string
  label: string
  placement: 'toolbar' | 'row' | 'form_footer' | 'section' | 'grid' | 'quick_action'
  actionType: 'navigate' | 'save_draft' | 'submit' | 'open_modal' | 'show_confirmation' | 'mock_command'
  visibilityRuleId?: string
  config: Record<string, unknown>
}

export interface RuleCondition {
  type: 'role' | 'field_value' | 'workflow_state' | 'record_mode' | 'device'
  field?: string
  operator?: string
  value?: unknown
}

export interface RuleEffect {
  type: 'show' | 'hide' | 'enable' | 'disable' | 'required' | 'optional' | 'readonly' | 'editable'
}

export interface BehaviorRuleDefinition {
  id: string
  label: string
  conditions: RuleCondition[]
  effect: RuleEffect
  targetIds: string[]
}

export interface ValidationIssue {
  code: string
  message: string
  severity: 'error' | 'warning' | 'suggestion'
  targetId?: string
  targetType?: string
}

export interface ViewValidationSummary {
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  suggestions: ValidationIssue[]
}

export interface ViewArtifact extends ViewSummary {
  viewCode?: string
  layout: LayoutDefinition
  components: ComponentDefinition[]
  dataSources: DataSourceDefinition[]
  bindings: BindingDefinition[]
  actions: ActionDefinition[]
  behaviorRules: BehaviorRuleDefinition[]
  validationState?: ViewValidationSummary
  contextContract?: ViewContextContract
  transactionConfig?: TransactionConfig
  scaffoldApplied?: boolean
  fieldChangeEvents?: FieldChangeEvent[]
  gridCellEvents?: GridCellEvent[]
  workflowConfig?: WorkflowConfig
}

export interface CreateViewInput {
  viewKey: string
  label: string
  surfaceType: ViewSurfaceType
  primaryEntityId?: string
  description?: string
}

export interface ViewVersionSummary {
  versionId: string
  version: number
  publishedAt: string
  publishedBy: string
  label: string
  snapshot: ViewArtifact
}

export interface PublishResult {
  success: boolean
  version: number
  versionId: string
  errors: ValidationIssue[]
}

// Entity metadata types consumed from mock Entity Designer metadata
export type FieldTypeCode =
  | 'text'
  | 'number'
  | 'decimal'
  | 'currency'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multi_select'
  | 'entity_ref'
  | 'computed'
  | 'status'

export interface MockEntityField {
  id: string
  fieldCode: string
  label: string
  fieldType: FieldTypeCode
  isRequired: boolean
  isReadOnly: boolean
  isSystem: boolean
  isComputed: boolean
  referenceEntityId?: string
  description?: string
}

export interface MockEntityRelationship {
  id: string
  label: string
  relatedEntityId: string
  type: 'has_many' | 'belongs_to' | 'has_one'
}

export interface MockEntityDefinition {
  id: string
  entityCode: string
  label: string
  pluralLabel: string
  description?: string
  fields: MockEntityField[]
  relationships: MockEntityRelationship[]
  capabilityFlags: {
    isHeaderEntity: boolean
    isLineEntity: boolean
    supportsWorkflow: boolean
    supportsAudit: boolean
  }
}

export interface ViewContextContract {
  routeKey?: string
  recordIdSource?: string
  parentEntityId?: string
  parentRecordIdSource?: string
  relationshipName?: string
  lineEntityId?: string
  lineRelationshipId?: string
  dateRangeContext?: boolean
}

export interface TransactionLineColumn {
  fieldId: string
  label?: string
  editable: boolean
  required?: boolean
  width?: number
}

export interface TransactionConfig {
  headerEntityId: string
  lineEntityId: string
  lineRelationshipId: string
  headerFieldIds: string[]
  lineColumns: TransactionLineColumn[]
  totalsEnabled: boolean
  totalFieldIds: string[]
  allowAddRow?: boolean
  allowDeleteRow?: boolean
}

// M10 — Lookup config stored inside ComponentDefinition.config
export interface LookupConfig {
  targetEntityId: string
  displayFieldId: string
  valueFieldId: string
  pickerColumnIds: string[]
  searchFieldIds: string[]
  defaultFilter?: string
}

// M13 — Field change events
export type FieldChangeActionType = 'clear' | 'set' | 'refresh_lookup' | 'recalculate' | 'warn' | 'confirm' | 'revalidate'

export interface FieldChangeAction {
  type: FieldChangeActionType
  targetFieldId?: string
  value?: unknown
  message?: string
}

export interface FieldChangeEvent {
  id: string
  triggerFieldId: string
  actions: FieldChangeAction[]
}

// M14 — Grid cell change events
export type GridCellActionType = 'set_cell_value' | 'recalculate_row' | 'refresh_lookup' | 'warn' | 'confirm' | 'flag_approval'

export interface GridCellAction {
  type: GridCellActionType
  targetColumnFieldId?: string
  formula?: string
  value?: unknown
  message?: string
  threshold?: number
}

export interface GridCellEvent {
  id: string
  triggerColumnFieldId: string
  actions: GridCellAction[]
}

// M16 — Workflow config
export interface WorkflowStateConfig {
  id: string
  label: string
  color: string
  availableActionIds: string[]
  requiresComment: boolean
}

export interface WorkflowConfig {
  states: WorkflowStateConfig[]
  initialStateId: string
}

// M18 — Preview context
export interface PreviewContext {
  role: 'Admin' | 'Sales' | 'Finance' | 'Viewer'
  device: 'desktop' | 'tablet' | 'mobile'
  workflowState: string
  sampleRecordId: string
}

// Repository interface — backend-agnostic contract
export interface UIStudioViewRepository {
  listViews(): Promise<ViewSummary[]>
  getView(viewId: string): Promise<ViewArtifact | null>
  createDraft(input: CreateViewInput): Promise<ViewArtifact>
  saveDraft(viewId: string, artifact: ViewArtifact): Promise<ViewArtifact>
  publish(viewId: string): Promise<PublishResult>
  rollback(viewId: string, versionId: string): Promise<ViewArtifact>
  listVersions(viewId: string): Promise<ViewVersionSummary[]>
}
