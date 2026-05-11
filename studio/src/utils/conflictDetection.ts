// ============================================================
// Unified conflict detection for Entity Designer
// Separates compile errors from governance conflicts so that:
//   - ConflictSummary (Fields tab) shows compile errors only
//   - GovernancePolicyHints (Governance tab) shows governance conflicts only
// ============================================================
import type { EntityDefinition } from '../types/entityDesigner';

export interface ConflictItem {
  severity: 'error' | 'warning';
  message: string;
  fieldId?: string;
  fieldLabel?: string;
}

export function detectAllConflicts(entity: EntityDefinition): {
  compileErrors: ConflictItem[];
  governanceConflicts: ConflictItem[];
} {
  const compileErrors: ConflictItem[] = [];
  const governanceConflicts: ConflictItem[] = [];

  entity.fields.forEach(field => {
    // ── Compile errors (schema / technical violations) ────────
    // Protected field cannot allow import — breaks schema integrity
    if (field.protected && field.governance.allowImport) {
      compileErrors.push({
        severity: 'error',
        message: `Protected field "${field.label}" cannot allow import`,
        fieldId: field.fieldId, fieldLabel: field.label,
      });
    }
    // Computed field cannot allow import — logically impossible
    if (field.fieldType === 'computed' && field.governance.allowImport) {
      compileErrors.push({
        severity: 'error',
        message: `Computed field "${field.label}" cannot allow import`,
        fieldId: field.fieldId, fieldLabel: field.label,
      });
    }
    // System-only editability + apiInputAllowed = silent data loss
    if (field.behaviors.editability === 'system_only' && field.governance.apiInputAllowed) {
      compileErrors.push({
        severity: 'warning',
        message: `System-only field "${field.label}" has API input enabled — inputs will be silently ignored`,
        fieldId: field.fieldId, fieldLabel: field.label,
      });
    }
    // Disabled field with live dependencies — usage risk
    if (field.lifecycle === 'disabled' && (field.dependencies?.length ?? 0) > 0) {
      compileErrors.push({
        severity: 'warning',
        message: `Disabled field "${field.label}" still has ${field.dependencies!.length} active dependency(-ies)`,
        fieldId: field.fieldId, fieldLabel: field.label,
      });
    }

    // ── Governance conflicts (policy / compliance violations) ─
    // Sensitive or Regulated exported without masking
    if (
      (field.classification === 'sensitive' || field.classification === 'regulated') &&
      field.governance.includeInExport &&
      !field.governance.maskInExport
    ) {
      governanceConflicts.push({
        severity: 'warning',
        message: `${field.classification === 'regulated' ? 'Regulated' : 'Sensitive'} field "${field.label}" is exported without masking`,
        fieldId: field.fieldId, fieldLabel: field.label,
      });
    }
    // Disabled field still included in export
    if (field.lifecycle === 'disabled' && field.governance.includeInExport) {
      governanceConflicts.push({
        severity: 'warning',
        message: `Disabled field "${field.label}" is still marked for export`,
        fieldId: field.fieldId, fieldLabel: field.label,
      });
    }
  });

  return { compileErrors, governanceConflicts };
}
