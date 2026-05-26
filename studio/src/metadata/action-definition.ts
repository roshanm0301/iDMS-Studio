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

// ── Handler Types ─────────────────────────────────────────────
export const ACTION_HANDLER_TYPES = [
  'workflow_trigger',
  'navigation',
  'api_call',
  'print',
  'export',
  'clone_record',
  'send_notification',
  'approval_action',
  'mass_update',
  'external_service',
] as const;
export type ActionHandlerType = (typeof ACTION_HANDLER_TYPES)[number];

// ── Placement ─────────────────────────────────────────────────
export const ACTION_PLACEMENTS = ['toolbar', 'context_menu', 'action_panel', 'form_footer'] as const;
export type ActionPlacement = (typeof ACTION_PLACEMENTS)[number];

// ── Handler Config (discriminated union) ─────────────────────
export interface WorkflowTriggerHandlerConfig {
  type: 'workflow_trigger';
  workflowCode: string;
  transitionCode?: string;
}

export interface NavigationHandlerConfig {
  type: 'navigation';
  targetEntityId?: string;
  targetViewId?: string;
  openMode: 'same_page' | 'new_tab' | 'modal';
}

export interface ApiCallHandlerConfig {
  type: 'api_call';
  endpointCode: string;
  successMessage?: string;
  failureMessage?: string;
}

export interface PrintHandlerConfig {
  type: 'print';
  templateCode: string;
}

export interface ExportHandlerConfig {
  type: 'export';
  format: 'csv' | 'pdf' | 'excel';
  viewId?: string;
}

export interface CloneRecordHandlerConfig {
  type: 'clone_record';
  excludeFieldIds?: string[];
}

export interface SendNotificationHandlerConfig {
  type: 'send_notification';
  templateCode: string;
  channel: 'email' | 'sms' | 'in_app';
}

export interface ApprovalHandlerConfig {
  type: 'approval_action';
  approvalProcessCode: string;
}

export interface MassUpdateHandlerConfig {
  type: 'mass_update';
  targetFieldId: string;
  targetValue: string;
}

export interface ExternalServiceHandlerConfig {
  type: 'external_service';
  serviceCode: string;
  endpointPath?: string;
}

export type ActionHandlerConfig =
  | WorkflowTriggerHandlerConfig
  | NavigationHandlerConfig
  | ApiCallHandlerConfig
  | PrintHandlerConfig
  | ExportHandlerConfig
  | CloneRecordHandlerConfig
  | SendNotificationHandlerConfig
  | ApprovalHandlerConfig
  | MassUpdateHandlerConfig
  | ExternalServiceHandlerConfig;

// ── Result / Feedback Config ──────────────────────────────────
export interface ActionResultConfig {
  successMessage?: string;
  failureMessage?: string;
  redirectAfter?: 'same_page' | 'list_view' | 'target_record';
  refreshView?: boolean;
}

// ── Audit Config ──────────────────────────────────────────────
export interface ActionAuditConfig {
  auditExecution: boolean;
  logPayload: boolean;
  logResult: boolean;
}

// ── Visibility Condition (structural) ─────────────────────────
export interface ActionVisibilityCondition {
  logic: 'AND' | 'OR';
  conditions: Array<{
    fieldId: string;
    operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'is_null' | 'is_not_null';
    value?: unknown;
  }>;
}

// ── Full ActionDefinitionMetadata ─────────────────────────────
export interface ActionDefinitionMetadata {
  actionId: string;
  entityId: string;
  apiName: string;
  label: string;
  description?: string;
  icon?: string;
  placement: ActionPlacement;
  handlerType: ActionHandlerType;
  handlerConfig: ActionHandlerConfig;
  confirmationRequired: boolean;
  confirmationMessage?: string;
  visibilityCondition?: ActionVisibilityCondition;
  bulkEnabled?: boolean;
  bulkLimit?: number;
  resultConfig?: ActionResultConfig;
  auditConfig?: ActionAuditConfig;
  ownership: OwnershipScope;
  lifecycle: {
    metadataStatus: MetadataStatus;
  };
  version?: MetadataVersionRef;
  audit?: MetadataAudit;
}

// ── Validator ─────────────────────────────────────────────────
export function validateActionDefinition(input: unknown): ValidationResult<ActionDefinitionMetadata> {
  if (!isPlainObject(input)) {
    return fail([{ code: 'ACT_INVALID_SHAPE', message: 'ActionDefinition must be an object.', severity: 'error' }]);
  }

  const issues: ValidationIssue[] = [];

  // Identity
  requireString(input.actionId, 'actionId', 'ACT_ID_REQUIRED', 'Action ID', issues);
  requireString(input.entityId, 'entityId', 'ACT_ENTITY_REQUIRED', 'Entity ID', issues);
  requireApiName(input.apiName, 'apiName', issues);
  requireString(input.label, 'label', 'ACT_LABEL_REQUIRED', 'Action label', issues);

  // Placement
  requireOneOf(input.placement, ACTION_PLACEMENTS, 'placement', 'ACT_PLACEMENT_INVALID', 'Action placement', issues);

  // Handler type
  const handlerTypeValid = requireOneOf(
    input.handlerType,
    ACTION_HANDLER_TYPES,
    'handlerType',
    'ACT_HANDLER_TYPE_INVALID',
    'Handler type',
    issues,
  );

  // Handler config
  if (!isPlainObject(input.handlerConfig)) {
    issues.push({ code: 'ACT_HANDLER_CONFIG_REQUIRED', message: 'Action handler config is required.', path: 'handlerConfig', severity: 'error' });
  } else if (handlerTypeValid) {
    validateHandlerConfig(input.handlerType as ActionHandlerType, input.handlerConfig, issues);
  }

  // Ownership
  if (!isPlainObject(input.ownership)) {
    issues.push({ code: 'ACT_OWNERSHIP_REQUIRED', message: 'Action ownership is required.', path: 'ownership', severity: 'error' });
  } else {
    if (input.ownership.owningLayer === 'role') {
      issues.push({ code: 'ACT_ROLE_LAYER_FORBIDDEN', message: 'Role cannot own action schema.', path: 'ownership.owningLayer', severity: 'blocking_error' });
    }
    requireOneOf(input.ownership.owningLayer, STRUCTURAL_LAYERS, 'ownership.owningLayer', 'ACT_OWNING_LAYER_INVALID', 'Owning layer', issues);
  }

  // Lifecycle
  if (!isPlainObject(input.lifecycle)) {
    issues.push({ code: 'ACT_LIFECYCLE_REQUIRED', message: 'Action lifecycle is required.', path: 'lifecycle', severity: 'error' });
  } else {
    requireOneOf(input.lifecycle.metadataStatus, METADATA_STATUSES, 'lifecycle.metadataStatus', 'ACT_STATUS_INVALID', 'Metadata status', issues);
  }

  // Bulk limit sanity
  if (input.bulkEnabled === true && typeof input.bulkLimit === 'number' && input.bulkLimit <= 0) {
    issues.push({ code: 'ACT_BULK_LIMIT_INVALID', message: 'Bulk limit must be a positive number.', path: 'bulkLimit', severity: 'error' });
  }

  if (issues.some(item => item.severity !== 'warning')) return fail(issues);
  return ok(input as unknown as ActionDefinitionMetadata, issues);
}

function validateHandlerConfig(
  handlerType: ActionHandlerType,
  config: Record<string, unknown>,
  issues: ValidationIssue[],
): void {
  if (config.type !== handlerType) {
    issues.push({
      code: 'ACT_HANDLER_CONFIG_TYPE_MISMATCH',
      message: `Handler config type '${String(config.type)}' must match handlerType '${handlerType}'.`,
      path: 'handlerConfig.type',
      severity: 'error',
    });
    return;
  }

  switch (handlerType) {
    case 'workflow_trigger':
      requireString(config.workflowCode, 'handlerConfig.workflowCode', 'ACT_WORKFLOW_CODE_REQUIRED', 'Workflow code', issues);
      break;
    case 'api_call':
      requireString(config.endpointCode, 'handlerConfig.endpointCode', 'ACT_ENDPOINT_CODE_REQUIRED', 'Endpoint code', issues);
      break;
    case 'print':
      requireString(config.templateCode, 'handlerConfig.templateCode', 'ACT_PRINT_TEMPLATE_REQUIRED', 'Print template code', issues);
      break;
    case 'export':
      requireOneOf(config.format, ['csv', 'pdf', 'excel'] as const, 'handlerConfig.format', 'ACT_EXPORT_FORMAT_INVALID', 'Export format', issues);
      break;
    case 'send_notification':
      requireString(config.templateCode, 'handlerConfig.templateCode', 'ACT_NOTIFICATION_TEMPLATE_REQUIRED', 'Notification template code', issues);
      requireOneOf(config.channel, ['email', 'sms', 'in_app'] as const, 'handlerConfig.channel', 'ACT_NOTIFICATION_CHANNEL_INVALID', 'Notification channel', issues);
      break;
    case 'approval_action':
      requireString(config.approvalProcessCode, 'handlerConfig.approvalProcessCode', 'ACT_APPROVAL_PROCESS_REQUIRED', 'Approval process code', issues);
      break;
    case 'mass_update':
      requireString(config.targetFieldId, 'handlerConfig.targetFieldId', 'ACT_MASS_UPDATE_FIELD_REQUIRED', 'Target field ID', issues);
      break;
    case 'external_service':
      requireString(config.serviceCode, 'handlerConfig.serviceCode', 'ACT_EXTERNAL_SERVICE_CODE_REQUIRED', 'External service code', issues);
      break;
    // navigation and clone_record have no required fields beyond type
  }
}
