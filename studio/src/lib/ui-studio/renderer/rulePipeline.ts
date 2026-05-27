import type { BehaviorRuleDefinition, RuleEffect, PreviewContext } from '../../../types/ui-studio/index'
import { evaluateRules } from '../mockRuleEvaluator'

export function buildRuleMap(
  rules: BehaviorRuleDefinition[],
  ctx: PreviewContext
): Map<string, RuleEffect> {
  return evaluateRules(rules, {
    role: ctx.role,
    fieldValues: {},
    workflowState: ctx.workflowState,
    device: ctx.device,
    recordMode: 'edit',
  })
}
