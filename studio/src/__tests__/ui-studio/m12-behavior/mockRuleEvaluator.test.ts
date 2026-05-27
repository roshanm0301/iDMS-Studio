import { evaluateRules } from '../../../lib/ui-studio/mockRuleEvaluator'
import type { BehaviorRuleDefinition } from '../../../types/ui-studio/index'

const roleRule: BehaviorRuleDefinition = {
  id: 'r1', label: 'Admin sees delete',
  conditions: [{ type: 'role', value: 'Admin' }],
  effect: { type: 'show' },
  targetIds: ['action-delete'],
}

const fieldRule: BehaviorRuleDefinition = {
  id: 'r2', label: 'Show financer when Finance payment',
  conditions: [{ type: 'field_value', field: 'paymentType', operator: 'eq', value: 'Finance' }],
  effect: { type: 'show' },
  targetIds: ['f-so-financer'],
}

const context = { role: 'Admin', fieldValues: { paymentType: 'Finance' }, workflowState: 'Draft', device: 'desktop', recordMode: 'edit' }

describe('mockRuleEvaluator (M12)', () => {
  it('matches role condition correctly', () => {
    const result = evaluateRules([roleRule], context)
    expect(result.get('action-delete')).toEqual({ type: 'show' })
  })
  it('does not match when role is different', () => {
    const result = evaluateRules([roleRule], { ...context, role: 'Viewer' })
    expect(result.has('action-delete')).toBe(false)
  })
  it('matches field_value condition', () => {
    const result = evaluateRules([fieldRule], context)
    expect(result.get('f-so-financer')).toEqual({ type: 'show' })
  })
  it('does not match when field value differs', () => {
    const result = evaluateRules([fieldRule], { ...context, fieldValues: { paymentType: 'Cash' } })
    expect(result.has('f-so-financer')).toBe(false)
  })
  it('handles multiple rules', () => {
    const result = evaluateRules([roleRule, fieldRule], context)
    expect(result.size).toBe(2)
  })
  it('returns empty map for no rules', () => {
    expect(evaluateRules([], context).size).toBe(0)
  })
})
