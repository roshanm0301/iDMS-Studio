import type { BehaviorRuleDefinition, RuleEffect } from '../../types/ui-studio/index'

export interface SimulationContext {
  role: string
  fieldValues: Record<string, unknown>
  workflowState: string
  device: string
  recordMode: string
}

export function evaluateRules(
  rules: BehaviorRuleDefinition[],
  context: SimulationContext,
): Map<string, RuleEffect> {
  const result = new Map<string, RuleEffect>()

  for (const rule of rules) {
    const condition = rule.conditions[0]
    if (!condition) continue

    let matches = false

    switch (condition.type) {
      case 'role':
        matches = context.role === condition.value
        break
      case 'field_value':
        matches = context.fieldValues[condition.field!] === condition.value
        break
      case 'workflow_state':
        matches = context.workflowState === condition.value
        break
      case 'record_mode':
        matches = context.recordMode === condition.value
        break
      case 'device':
        matches = context.device === condition.value
        break
      default:
        matches = false
    }

    if (matches) {
      for (const targetId of rule.targetIds) {
        result.set(targetId, rule.effect)
      }
    }
  }

  return result
}
