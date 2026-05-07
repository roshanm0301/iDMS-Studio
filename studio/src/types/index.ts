// ============================================================
// iDMS Admin Studio — TypeScript Types
// ============================================================

// ===== Core Layer System =====
export type LayerCode = 'platform' | 'vertical' | 'tenant' | 'node' | 'role';

export interface Layer {
  code: LayerCode;
  label: string;
  priority: number;
  color_token: string;
}

// ===== Artifact =====
export type ArtifactType =
  | 'entity_schema'
  | 'workflow_definition'
  | 'rule_definition'
  | 'permission_matrix'
  | 'ui_form_schema'
  | 'ui_list_schema';

export type ArtifactStatus = 'active' | 'active_with_draft' | 'draft' | 'deprecated' | 'compile_error';

export interface ArtifactRegistryItem {
  artifact_key: string;
  artifact_type: ArtifactType;
  label: string;
  status: ArtifactStatus;
  module: string;
  warnings: number;
  layers: LayerCode[];
  last_modified?: string;
}

// ===== Entity Schema =====
export type FieldType =
  | 'text' | 'number' | 'boolean' | 'date' | 'datetime'
  | 'select' | 'multiselect' | 'reference' | 'textarea'
  | 'currency' | 'grid' | 'file';

export type VisibilityRule = 'visible' | 'hidden' | 'readonly';

export interface FieldDefinition {
  field_id: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  source_layer: LayerCode;
  override_status: 'added' | 'inherited' | 'overridden' | 'constrained';
  protected: boolean;
  visibility: VisibilityRule;
  visibility_by_role?: Record<string, VisibilityRule>;
  used_by_rules?: string[];
  used_by_workflows?: string[];
  max_value?: number;
  options?: string[];
  placeholder?: string;
  help_text?: string;
  section?: string;
}

export interface FormSection {
  section_id: string;
  label: string;
  fields: string[];
  order: number;
}

export interface EntitySchema {
  artifact_key: string;
  label: string;
  description: string;
  fields: FieldDefinition[];
  form_layout: { sections: FormSection[] };
  dependencies: {
    rules: string[];
    workflows: string[];
    permissions: string[];
  };
}

// ===== Overlay / Delta =====
export type DeltaOperation =
  | 'extend' | 'replace' | 'disable' | 'remove'
  | 'constrain' | 'decorate' | 'append' | 'prepend';

export type DeltaStatus = 'draft' | 'active' | 'compile_error';

export interface OverlayDelta {
  delta_id: string;
  artifact_key: string;
  layer: LayerCode;
  scope_label: string;
  operation: DeltaOperation;
  target_path: string;
  value: unknown;
  reason?: string;
  risk: 'low' | 'medium' | 'high';
  status: DeltaStatus;
  author?: string;
  created_at?: string;
}

export interface LayerStack {
  layer: LayerCode;
  label: string;
  scope: string;
  delta_count: number;
  last_changed?: string;
  status: DeltaStatus;
  author?: string;
  deltas: OverlayDelta[];
}

export interface TraceEntry {
  layer: LayerCode;
  operation?: string;
  value?: unknown;
  note: string;
}

export interface ExplainTrace {
  field_path: string;
  layers: TraceEntry[];
  result: string;
}

// ===== Rules =====
export type RuleAction = 'BLOCK' | 'WARN' | 'SET_FIELD' | 'ROUTE' | 'START_WORKFLOW' | 'NOTIFY';
export type RuleTrigger =
  | 'BEFORE_CREATE' | 'BEFORE_UPDATE' | 'BEFORE_SUBMIT'
  | 'BEFORE_APPROVE' | 'BEFORE_CANCEL' | 'BEFORE_DELETE'
  | 'AFTER_CREATE' | 'AFTER_SUBMIT' | 'AFTER_APPROVE' | 'ON_FIELD_CHANGE';

export type RuleStatus = 'active' | 'draft' | 'paused' | 'archived';
export type RulePriority = 'critical' | 'high' | 'medium' | 'low';

export interface RuleCondition {
  id: string;
  field: string;
  op: string;
  value: unknown;
  group?: 'AND' | 'OR';
}

export interface RuleDefinition {
  rule_id: string;
  rule_name: string;
  description: string;
  entity_type: string;
  trigger: RuleTrigger;
  layer: LayerCode;
  priority_order: number;
  priority: RulePriority;
  status: RuleStatus;
  combinator: 'AND' | 'OR';
  conditions: RuleCondition[];
  action_type: RuleAction;
  action_config: Record<string, unknown>;
  message?: string;
  business_intent?: string;
  risk_mitigated?: string;
  tags?: string[];
  folder?: string;
  version?: number;
  last_edited?: string;
  editor?: string;
  runs?: number;
  match_rate?: number;
}

// ===== Workflow =====
export type StateType = 'initial' | 'normal' | 'terminal' | 'exception';

export interface WorkflowState {
  state_id: string;
  label: string;
  state_type: StateType;
  source_layer: LayerCode;
  description?: string;
}

export interface WorkflowTransition {
  transition_id: string;
  from_state: string;
  to_state: string;
  command: string;
  label: string;
  allowed_roles: string[];
  guard_rules: string[];
  before_hooks: string[];
  after_hooks: string[];
  source_layer: LayerCode;
  protected?: boolean;
  description?: string;
}

export interface WorkflowDefinition {
  artifact_key: string;
  label: string;
  entity_type: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
}

// ===== Permissions =====
export type PermEffect = 'ALLOW' | 'DENY' | 'CONDITIONAL';

export interface PermissionRule {
  rule_id: string;
  role_code: string;
  resource_ref: string;
  action_ref: string;
  effect: PermEffect;
  condition?: string;
  source_layer: LayerCode;
}

// ===== Simulation =====
export interface SimulationCase {
  case_id: string;
  label: string;
  entity_type: string;
  trigger: string;
  payload: Record<string, unknown>;
  session: {
    role: string;
    tenant: string;
    node: string;
  };
  expected_result: 'PASS' | 'BLOCK' | 'WARN';
  expected_message?: string;
  status: 'pass' | 'fail' | 'not_run';
}

export interface SimulationStep {
  step: string;
  status: 'pass' | 'fail' | 'info';
  detail: string;
}

// ===== Release Package =====
export type ReleaseStatus =
  | 'draft' | 'validating' | 'validation_failed' | 'ready_for_approval'
  | 'approved' | 'promoted_uat' | 'promoted_production' | 'active' | 'rolled_back';

export type ValidationResultType = 'pass' | 'warn' | 'error';

export interface ValidationResult {
  step: string;
  result: ValidationResultType;
  message?: string;
}

export interface ReleaseItem {
  item_id: string;
  artifact_key: string;
  artifact_label: string;
  layer: LayerCode;
  change_type: string;
  risk: 'low' | 'medium' | 'high';
  status: 'validated' | 'simulated' | 'needs_simulation' | 'error';
}

export interface ReleasePackage {
  release_id: string;
  name: string;
  description?: string;
  environment: string;
  target_environment: string;
  status: ReleaseStatus;
  owner?: string;
  risk: 'low' | 'medium' | 'high';
  items: ReleaseItem[];
  validation_results: ValidationResult[];
  simulation_cases: SimulationCase[];
  created_at?: string;
}

// ===== Scope Context =====
export interface ScopeContext {
  environment: string;
  tenant_id: string;
  tenant_name: string;
  node_id: string;
  node_label: string;
  role_code: string;
  role_name: string;
  layer: LayerCode;
  mode: 'draft' | 'resolved' | 'compiled';
}

// ===== Impact =====
export interface ImpactFinding {
  finding_id: string;
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  artifact_key?: string;
  suggested_action?: string;
}

// ===== Attribute Catalog =====
export interface CatalogAttribute {
  attribute_code: string;
  label: string;
  field_type: FieldType;
  domain: string;
  protected: boolean;
  reusable: boolean;
  used_in: string[];
  owner_layer: LayerCode;
  description?: string;
}

// ===== Tenant =====
export interface TenantTheme {
  primaryColor: string;
  primaryHoverColor: string;
  primaryLightColor: string;
  secondaryColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  fontFamily?: string;
  borderRadius?: string;
}

export interface Tenant {
  tenant_id: string;
  tenant_name: string;
  vertical: string;
  theme: TenantTheme;
}

export interface Node {
  node_id: string;
  label: string;
  node_type: string;
  tenant_id: string;
}

export interface Role {
  role_code: string;
  role_name: string;
  studio_access: 'full' | 'tenant_admin' | 'read_and_approve' | 'none' | 'module_read';
}
