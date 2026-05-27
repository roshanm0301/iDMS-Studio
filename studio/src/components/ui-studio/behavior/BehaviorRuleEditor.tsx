import { ConditionBuilder } from './ConditionBuilder'
import { EffectSelector } from './EffectSelector'
import { TargetSelector } from './TargetSelector'
import type { BehaviorRuleDefinition, RuleCondition, RuleEffect } from '../../../types/ui-studio/index'

interface Target {
  id: string
  label: string
  type: string
}

interface BehaviorRuleEditorProps {
  rule: BehaviorRuleDefinition
  allTargets: Target[]
  entityId: string | undefined
  onChange: (rule: BehaviorRuleDefinition) => void
}

const DEFAULT_CONDITION: RuleCondition = { type: 'role', value: '' }

export function BehaviorRuleEditor({ rule, allTargets, entityId, onChange }: BehaviorRuleEditorProps) {
  function patch(updates: Partial<BehaviorRuleDefinition>) {
    onChange({ ...rule, ...updates })
  }

  const condition = rule.conditions[0] ?? DEFAULT_CONDITION

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: '3px',
    display: 'block',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px' }}>

      {/* Label */}
      <div>
        <label style={labelStyle}>Rule Label</label>
        <input
          type="text"
          className="input"
          style={{ fontSize: '12px', width: '100%' }}
          value={rule.label}
          onChange={e => patch({ label: e.target.value })}
          placeholder="Rule label…"
        />
      </div>

      {/* Condition */}
      <div>
        <label style={labelStyle}>Condition</label>
        <ConditionBuilder
          condition={condition}
          entityId={entityId}
          onChange={updated => patch({ conditions: [updated] })}
        />
      </div>

      {/* Effect */}
      <div>
        <label style={labelStyle}>Effect</label>
        <EffectSelector
          effect={rule.effect}
          onChange={(effect: RuleEffect) => patch({ effect })}
        />
      </div>

      {/* Targets */}
      <div>
        <label style={labelStyle}>Target Fields / Actions</label>
        <TargetSelector
          targetIds={rule.targetIds}
          allTargets={allTargets}
          onChange={ids => patch({ targetIds: ids })}
        />
      </div>
    </div>
  )
}
