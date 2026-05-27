import { getMockEntityById } from '../../../mocks/ui-studio/mockEntityMetadata'
import type { RuleCondition } from '../../../types/ui-studio/index'

interface ConditionBuilderProps {
  condition: RuleCondition
  onChange: (c: RuleCondition) => void
  entityId?: string
}

const CONDITION_TYPES: RuleCondition['type'][] = ['role', 'field_value', 'workflow_state', 'record_mode', 'device']

export function ConditionBuilder({ condition, onChange, entityId }: ConditionBuilderProps) {
  const entity = entityId ? getMockEntityById(entityId) : undefined
  const fields = entity?.fields.filter(f => !f.isSystem) ?? []

  function patch(updates: Partial<RuleCondition>) {
    onChange({ ...condition, ...updates })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <select
        className="form-select"
        style={{ fontSize: '12px' }}
        value={condition.type}
        onChange={e => patch({ type: e.target.value as RuleCondition['type'], field: undefined })}
      >
        {CONDITION_TYPES.map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      {condition.type === 'field_value' && (
        <div style={{ display: 'flex', gap: '4px' }}>
          <select
            className="form-select"
            style={{ flex: 2, fontSize: '12px' }}
            value={condition.field ?? ''}
            onChange={e => patch({ field: e.target.value })}
          >
            <option value="">— field —</option>
            {fields.map(f => (
              <option key={f.id} value={f.fieldCode}>{f.label}</option>
            ))}
          </select>
          <input
            type="text"
            className="input"
            style={{ flex: 1, fontSize: '11.5px', height: '30px' }}
            placeholder="op"
            value={condition.operator ?? ''}
            onChange={e => patch({ operator: e.target.value })}
          />
        </div>
      )}

      <input
        type="text"
        className="input"
        style={{ fontSize: '12px' }}
        placeholder="Value"
        value={condition.value !== undefined && condition.value !== null ? String(condition.value) : ''}
        onChange={e => patch({ value: e.target.value })}
      />
    </div>
  )
}
