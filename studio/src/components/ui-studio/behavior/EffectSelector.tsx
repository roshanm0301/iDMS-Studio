import type { RuleEffect } from '../../../types/ui-studio/index'

interface EffectSelectorProps {
  effect: RuleEffect
  onChange: (e: RuleEffect) => void
}

const EFFECT_TYPES: RuleEffect['type'][] = [
  'show', 'hide', 'enable', 'disable', 'required', 'optional', 'readonly', 'editable',
]

export function EffectSelector({ effect, onChange }: EffectSelectorProps) {
  return (
    <select
      className="form-select"
      style={{ fontSize: '12px' }}
      value={effect.type}
      onChange={e => onChange({ type: e.target.value as RuleEffect['type'] })}
    >
      {EFFECT_TYPES.map(t => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  )
}
