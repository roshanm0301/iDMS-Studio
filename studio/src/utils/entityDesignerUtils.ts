// ============================================================
// Shared utilities for Entity Designer
// ============================================================
import type { FieldInstance, FieldTypeCode, SummaryType, EntityDefinition, FieldDisplayFormat } from '../types/entityDesigner';
import type { LayerCode } from '../types';

// ── Slug conversion ───────────────────────────────────────────
/**
 * Converts a human-readable label to a snake_case slug identifier.
 * "Vehicle Order" → "vehicle_order"
 * "GST Invoice #" → "gst_invoice_"  → then capped/trimmed
 */
export function toSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 50);
}

// ── Infrastructure field IDs (never auto-added to views) ─────
/**
 * System-level fields that should not appear in user-facing views.
 * They are infrastructure concerns (tenant routing, audit trail) not
 * visible to end users by default.
 */
export const INFRA_FIELD_IDS = new Set([
  'record_id', 'tenant_id', 'node_id',
  'created_by', 'created_at', 'updated_at',
  'deleted_at', 'deleted_by',
]);

/**
 * Returns the effective viewParticipation for a field, taking infra fields
 * into account (they always behave as 'explicit' regardless of the stored value).
 */
export function effectiveViewParticipation(
  field: FieldInstance
): 'list_and_form' | 'form_only' | 'explicit' {
  if (INFRA_FIELD_IDS.has(field.fieldId)) return 'explicit';
  if (field.behaviors?.visibility === 'hidden') return 'explicit';
  if (field.behaviors?.editability === 'system_only') return 'explicit';
  return field.viewParticipation ?? 'list_and_form';
}

// ── Default summary type for list_view column footers ─────────
/**
 * Returns a sensible default footer aggregation for a field type.
 * Used when auto-populating a new list_view's column config.
 */
export function defaultSummaryType(fieldType: FieldTypeCode): SummaryType {
  if (['currency', 'number', 'decimal'].includes(fieldType)) return 'sum';
  if (fieldType === 'percentage') return 'avg';
  return 'none';
}

// ── Standard action auto-provisioning ─────────────────────────
export interface StandardAction {
  actionId: string;
  label: string;
  icon: string;          // lucide icon name
  placement: 'toolbar' | 'context_menu' | 'action_panel' | 'form_footer';
  auto: true;
  reason: string;        // why this action exists
}

/**
 * Returns the list of standard actions that are automatically available
 * for an entity based on its category and behaviors.
 * These do NOT need to be configured — they are implicit.
 */
export function computeStandardActions(entity: EntityDefinition): StandardAction[] {
  const actions: StandardAction[] = [
    { actionId: 'new',     label: 'New',     icon: 'Plus',      placement: 'toolbar',      auto: true, reason: 'Always available' },
    { actionId: 'edit',    label: 'Edit',    icon: 'Edit',      placement: 'toolbar',      auto: true, reason: 'Always available' },
    { actionId: 'refresh', label: 'Refresh', icon: 'RefreshCw', placement: 'toolbar',      auto: true, reason: 'Always available' },
  ];
  if (entity.category !== 'ledger_like') {
    actions.push({
      actionId: 'delete', label: 'Delete', icon: 'Trash2',
      placement: 'context_menu', auto: true,
      reason: 'Blocked for ledger_like entities — use counter-entry instead',
    });
  }
  if (entity.behaviors.workflowEnabled) {
    actions.push(
      { actionId: 'submit',  label: 'Submit',  icon: 'Send',        placement: 'action_panel', auto: true, reason: 'When workflowEnabled = true' },
      { actionId: 'approve', label: 'Approve', icon: 'CheckCircle', placement: 'action_panel', auto: true, reason: 'When workflowEnabled = true' },
      { actionId: 'reject',  label: 'Reject',  icon: 'XCircle',     placement: 'action_panel', auto: true, reason: 'When workflowEnabled = true' },
    );
  }
  if (entity.category === 'ledger_like') {
    actions.push({
      actionId: 'counter_entry', label: 'Counter Entry', icon: 'ArrowLeftRight',
      placement: 'toolbar', auto: true,
      reason: 'Ledger entities use counter-entries instead of delete',
    });
  }
  if (entity.category === 'master' && entity.behaviors.softDelete !== false) {
    actions.push(
      { actionId: 'activate',   label: 'Activate',   icon: 'CheckCircle2', placement: 'context_menu', auto: true, reason: 'Master data activation' },
      { actionId: 'deactivate', label: 'Deactivate', icon: 'MinusCircle',  placement: 'context_menu', auto: true, reason: 'Master data deactivation' },
    );
  }
  return actions;
}

// ── Default display format by field type ─────────────────────
/**
 * Returns sensible default display format settings for a given field type.
 * Applied when a field is first created to give it a good starting format
 * without the user needing to manually configure it.
 */
export function defaultDisplayFormat(fieldType: FieldTypeCode): FieldDisplayFormat {
  switch (fieldType) {
    case 'currency':
      return { decimalPlaces: 2, thousandSeparator: 'indian', currencySymbolPosition: 'prefix', negativeDisplay: 'parentheses' };
    case 'percentage':
      return { decimalPlaces: 2, thousandSeparator: 'none', multiplyBy100: false };
    case 'number':
    case 'decimal':
      return { decimalPlaces: 2, thousandSeparator: 'international' };
    case 'date':
      return { dateFormat: 'dd/MM/yyyy' };
    case 'datetime':
      return { dateFormat: 'dd/MM/yyyy', timeFormat: '24h', showSeconds: false };
    case 'time':
      return { timeFormat: '24h', showSeconds: false };
    default:
      return {};
  }
}

// ── Lookup eligibility auto-inference ────────────────────────
/**
 * Returns whether an entity should be lookup-eligible by default,
 * inferred from its category. The user can override this in CreateEntityPage.
 */
export function defaultLookupEligible(category: string): boolean {
  return category === 'master';
}

// ── Layer-aware editing context ───────────────────────────────
/**
 * Returns whether the current editing layer can modify a given field.
 * Platform-owned fields cannot be edited by tenant/node layers.
 */
export function canEditFieldAtLayer(field: FieldInstance, editingLayer: LayerCode): boolean {
  if (field.protected) return false;
  const layerRank: Record<LayerCode, number> = { platform: 0, vertical: 1, tenant: 2, node: 3, role: 4 };
  return layerRank[editingLayer] >= layerRank[field.sourceLayer];
}
