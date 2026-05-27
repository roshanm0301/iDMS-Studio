import type { RuleEffect } from '../../../types/ui-studio/index'

export function pruneByRole<T extends { id: string; visibilityRuleId?: string }>(
  items: T[],
  roleRules: Map<string, RuleEffect>
): T[] {
  return items.filter(item => {
    // Check if this item's id is directly targeted by a hide rule
    const directEffect = roleRules.get(item.id)
    if (directEffect?.type === 'hide') return false

    // Also check via visibilityRuleId if present (rule-based visibility link)
    if (item.visibilityRuleId) {
      // visibilityRuleId links to a rule; if that rule fired a hide for this item's id, already caught above
      // No additional action needed
    }
    return true
  })
}
