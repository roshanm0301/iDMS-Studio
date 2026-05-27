import type { ViewArtifact, ViewValidationSummary, ValidationIssue } from '../../types/ui-studio/index'
import { getMockEntityById } from '../../mocks/ui-studio/mockEntityMetadata'

export function validateArtifact(artifact: ViewArtifact): ViewValidationSummary {
  const errors: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []
  const suggestions: ValidationIssue[] = []

  // VAL-001: Missing viewKey
  if (!artifact.viewKey || artifact.viewKey.trim() === '') {
    errors.push({ code: 'VAL-001', message: 'View key is required', severity: 'error' })
  }

  // VAL-002: Missing label
  if (!artifact.label || artifact.label.trim() === '') {
    errors.push({ code: 'VAL-002', message: 'Label is required', severity: 'error' })
  }

  // VAL-003: Missing primaryEntityId
  if (!artifact.primaryEntityId) {
    warnings.push({ code: 'VAL-003', message: 'No primary entity selected', severity: 'warning' })
  }

  // VAL-004/005: transaction_workspace checks
  if (artifact.surfaceType === 'transaction_workspace') {
    if (!artifact.transactionConfig?.headerEntityId) {
      errors.push({ code: 'VAL-004', message: 'Header entity required for transaction', severity: 'error' })
    }
    if (!artifact.transactionConfig?.lineEntityId) {
      errors.push({ code: 'VAL-005', message: 'Line entity required for transaction', severity: 'error' })
    }
    // VAL-010: No line columns
    if ((artifact.transactionConfig?.lineColumns?.length ?? 0) === 0) {
      suggestions.push({ code: 'VAL-010', message: 'Configure line grid columns', severity: 'suggestion' })
    }
  }

  // VAL-006: list with no columns
  if (artifact.surfaceType === 'list' && artifact.components.length === 0) {
    warnings.push({ code: 'VAL-006', message: 'No columns configured for list view', severity: 'warning' })
  }

  // VAL-007: create_edit with no fields
  if (artifact.surfaceType === 'create_edit' && artifact.components.length === 0) {
    warnings.push({ code: 'VAL-007', message: 'No form fields configured', severity: 'warning' })
  }

  // VAL-008: Invalid field references
  if (artifact.primaryEntityId) {
    const entity = getMockEntityById(artifact.primaryEntityId)
    if (entity) {
      const fieldIds = new Set(entity.fields.map(f => f.id))
      for (const comp of artifact.components) {
        if (comp.fieldId && !fieldIds.has(comp.fieldId)) {
          warnings.push({
            code: 'VAL-008',
            message: `Field '${comp.fieldId}' not found in entity schema`,
            severity: 'warning',
            targetId: comp.id,
          })
        }
      }
    }
  }

  // VAL-009: Orphaned bindings
  const componentIds = new Set(artifact.components.map(c => c.id))
  for (const binding of artifact.bindings) {
    if (!componentIds.has(binding.componentId)) {
      warnings.push({
        code: 'VAL-009',
        message: 'Binding references deleted component',
        severity: 'warning',
        targetId: binding.id,
      })
    }
  }

  // VAL-011: No actions
  if (!artifact.actions || artifact.actions.length === 0) {
    suggestions.push({ code: 'VAL-011', message: 'Consider adding toolbar actions', severity: 'suggestion' })
  }

  return { errors, warnings, suggestions }
}
