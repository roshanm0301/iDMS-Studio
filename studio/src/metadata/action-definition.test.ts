import { describe, it, expect } from 'vitest';
import { validateActionDefinition } from './action-definition';
import type { ActionDefinitionMetadata } from './action-definition';

function validAction(overrides?: Partial<ActionDefinitionMetadata>): Record<string, unknown> {
  return {
    actionId: 'act_print_invoice',
    entityId: 'ent_sales_invoice',
    apiName: 'print_invoice',
    label: 'Print Invoice',
    placement: 'toolbar',
    handlerType: 'print',
    handlerConfig: { type: 'print', templateCode: 'invoice_standard' },
    confirmationRequired: false,
    ownership: { owningLayer: 'platform', namespace: 'idms_core' },
    lifecycle: { metadataStatus: 'draft' },
    ...overrides,
  };
}

describe('validateActionDefinition', () => {
  // ── Positive tests ──────────────────────────────────────────

  it('accepts a valid print action', () => {
    const result = validateActionDefinition(validAction());
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('accepts a valid workflow_trigger action', () => {
    const result = validateActionDefinition(validAction({
      actionId: 'act_submit',
      apiName: 'submit_for_approval',
      label: 'Submit for Approval',
      handlerType: 'workflow_trigger',
      handlerConfig: { type: 'workflow_trigger', workflowCode: 'wf_approval' },
    } as any));
    expect(result.valid).toBe(true);
  });

  it('accepts a valid api_call action', () => {
    const result = validateActionDefinition(validAction({
      handlerType: 'api_call',
      handlerConfig: { type: 'api_call', endpointCode: 'sync_erp' },
    } as any));
    expect(result.valid).toBe(true);
  });

  it('accepts a valid navigation action', () => {
    const result = validateActionDefinition(validAction({
      handlerType: 'navigation',
      handlerConfig: { type: 'navigation', openMode: 'new_tab' },
    } as any));
    expect(result.valid).toBe(true);
  });

  it('accepts a valid export action', () => {
    const result = validateActionDefinition(validAction({
      handlerType: 'export',
      handlerConfig: { type: 'export', format: 'csv' },
    } as any));
    expect(result.valid).toBe(true);
  });

  it('accepts a valid clone_record action', () => {
    const result = validateActionDefinition(validAction({
      handlerType: 'clone_record',
      handlerConfig: { type: 'clone_record' },
    } as any));
    expect(result.valid).toBe(true);
  });

  it('accepts a valid send_notification action', () => {
    const result = validateActionDefinition(validAction({
      handlerType: 'send_notification',
      handlerConfig: { type: 'send_notification', templateCode: 'tpl_notify', channel: 'email' },
    } as any));
    expect(result.valid).toBe(true);
  });

  it('accepts a valid approval_action', () => {
    const result = validateActionDefinition(validAction({
      handlerType: 'approval_action',
      handlerConfig: { type: 'approval_action', approvalProcessCode: 'ap_standard' },
    } as any));
    expect(result.valid).toBe(true);
  });

  it('accepts a valid mass_update action', () => {
    const result = validateActionDefinition(validAction({
      handlerType: 'mass_update',
      handlerConfig: { type: 'mass_update', targetFieldId: 'status', targetValue: 'closed' },
    } as any));
    expect(result.valid).toBe(true);
  });

  it('accepts a valid external_service action', () => {
    const result = validateActionDefinition(validAction({
      handlerType: 'external_service',
      handlerConfig: { type: 'external_service', serviceCode: 'oem_api' },
    } as any));
    expect(result.valid).toBe(true);
  });

  it('accepts action with bulk enabled', () => {
    const result = validateActionDefinition(validAction({
      bulkEnabled: true,
      bulkLimit: 200,
    } as any));
    expect(result.valid).toBe(true);
  });

  it('accepts action with result config', () => {
    const result = validateActionDefinition(validAction({
      resultConfig: { successMessage: 'Done', redirectAfter: 'list_view', refreshView: true },
    } as any));
    expect(result.valid).toBe(true);
  });

  it('accepts action with audit config', () => {
    const result = validateActionDefinition(validAction({
      auditConfig: { auditExecution: true, logPayload: false, logResult: true },
    } as any));
    expect(result.valid).toBe(true);
  });

  // ── Negative tests ──────────────────────────────────────────

  it('rejects non-object input', () => {
    const result = validateActionDefinition('not an object');
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ACT_INVALID_SHAPE' }));
  });

  it('rejects missing actionId', () => {
    const input = validAction();
    delete input.actionId;
    const result = validateActionDefinition(input);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ACT_ID_REQUIRED' }));
  });

  it('rejects missing entityId', () => {
    const input = validAction();
    delete input.entityId;
    const result = validateActionDefinition(input);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ACT_ENTITY_REQUIRED' }));
  });

  it('rejects missing apiName', () => {
    const input = validAction();
    delete input.apiName;
    const result = validateActionDefinition(input);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'API_NAME_REQUIRED' }));
  });

  it('rejects invalid apiName format', () => {
    const result = validateActionDefinition(validAction({ apiName: 'Not-Snake-Case' } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'API_NAME_INVALID' }));
  });

  it('rejects missing label', () => {
    const input = validAction();
    delete input.label;
    const result = validateActionDefinition(input);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ACT_LABEL_REQUIRED' }));
  });

  it('rejects invalid placement', () => {
    const result = validateActionDefinition(validAction({ placement: 'invalid_place' } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ACT_PLACEMENT_INVALID' }));
  });

  it('rejects invalid handler type', () => {
    const result = validateActionDefinition(validAction({ handlerType: 'unknown_handler' } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ACT_HANDLER_TYPE_INVALID' }));
  });

  it('rejects missing handler config', () => {
    const input = validAction();
    delete input.handlerConfig;
    const result = validateActionDefinition(input);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ACT_HANDLER_CONFIG_REQUIRED' }));
  });

  it('rejects handler config type mismatch', () => {
    const result = validateActionDefinition(validAction({
      handlerType: 'print',
      handlerConfig: { type: 'export', format: 'csv' },
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ACT_HANDLER_CONFIG_TYPE_MISMATCH' }));
  });

  it('rejects workflow_trigger without workflowCode', () => {
    const result = validateActionDefinition(validAction({
      handlerType: 'workflow_trigger',
      handlerConfig: { type: 'workflow_trigger' },
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ACT_WORKFLOW_CODE_REQUIRED' }));
  });

  it('rejects api_call without endpointCode', () => {
    const result = validateActionDefinition(validAction({
      handlerType: 'api_call',
      handlerConfig: { type: 'api_call' },
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ACT_ENDPOINT_CODE_REQUIRED' }));
  });

  it('rejects print without templateCode', () => {
    const result = validateActionDefinition(validAction({
      handlerConfig: { type: 'print' },
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ACT_PRINT_TEMPLATE_REQUIRED' }));
  });

  it('rejects export without format', () => {
    const result = validateActionDefinition(validAction({
      handlerType: 'export',
      handlerConfig: { type: 'export' },
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ACT_EXPORT_FORMAT_INVALID' }));
  });

  it('rejects send_notification without templateCode', () => {
    const result = validateActionDefinition(validAction({
      handlerType: 'send_notification',
      handlerConfig: { type: 'send_notification', channel: 'email' },
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ACT_NOTIFICATION_TEMPLATE_REQUIRED' }));
  });

  it('rejects send_notification without channel', () => {
    const result = validateActionDefinition(validAction({
      handlerType: 'send_notification',
      handlerConfig: { type: 'send_notification', templateCode: 'tpl' },
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ACT_NOTIFICATION_CHANNEL_INVALID' }));
  });

  it('rejects approval_action without approvalProcessCode', () => {
    const result = validateActionDefinition(validAction({
      handlerType: 'approval_action',
      handlerConfig: { type: 'approval_action' },
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ACT_APPROVAL_PROCESS_REQUIRED' }));
  });

  it('rejects mass_update without targetFieldId', () => {
    const result = validateActionDefinition(validAction({
      handlerType: 'mass_update',
      handlerConfig: { type: 'mass_update', targetValue: 'x' },
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ACT_MASS_UPDATE_FIELD_REQUIRED' }));
  });

  it('rejects external_service without serviceCode', () => {
    const result = validateActionDefinition(validAction({
      handlerType: 'external_service',
      handlerConfig: { type: 'external_service' },
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ACT_EXTERNAL_SERVICE_CODE_REQUIRED' }));
  });

  it('rejects missing ownership', () => {
    const input = validAction();
    delete input.ownership;
    const result = validateActionDefinition(input);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ACT_OWNERSHIP_REQUIRED' }));
  });

  it('rejects role as owning layer', () => {
    const result = validateActionDefinition(validAction({
      ownership: { owningLayer: 'role', namespace: 'x' },
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ACT_ROLE_LAYER_FORBIDDEN' }));
  });

  it('rejects missing lifecycle', () => {
    const input = validAction();
    delete input.lifecycle;
    const result = validateActionDefinition(input);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ACT_LIFECYCLE_REQUIRED' }));
  });

  it('rejects invalid metadata status', () => {
    const result = validateActionDefinition(validAction({
      lifecycle: { metadataStatus: 'invalid_status' },
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ACT_STATUS_INVALID' }));
  });

  it('rejects bulk with zero limit', () => {
    const result = validateActionDefinition(validAction({
      bulkEnabled: true,
      bulkLimit: 0,
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ACT_BULK_LIMIT_INVALID' }));
  });

  it('rejects bulk with negative limit', () => {
    const result = validateActionDefinition(validAction({
      bulkEnabled: true,
      bulkLimit: -5,
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ACT_BULK_LIMIT_INVALID' }));
  });

  it('collects multiple issues', () => {
    const result = validateActionDefinition({});
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(3);
  });
});
