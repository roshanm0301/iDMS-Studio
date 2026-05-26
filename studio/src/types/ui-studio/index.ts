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
