import { getMockEntityById } from '../../../mocks/ui-studio/mockEntityMetadata'
import type { FieldChangeAction, FieldChangeActionType } from '../../../types/ui-studio/index'

interface FieldChangeActionBuilderProps {
  action: FieldChangeAction
  entityId: string | undefined
  onChange: (a: FieldChangeAction) => void
}

const ACTION_TYPES: FieldChangeActionType[] = [
  'clear', 'set', 'refresh_lookup', 'recalculate', 'warn', 'confirm', 'revalidate',
]

const NO_TARGET_TYPES: FieldChangeActionType[] = ['warn', 'confirm', 'revalidate']
const MESSAGE_TYPES: FieldChangeActionType[] = ['warn', 'confirm']

export function FieldChangeActionBuilder({ action, entityId, onChange }: FieldChangeActionBuilderProps) {
  const entity = entityId ? getMockEntityById(entityId) : undefined
  const fields = entity?.fields.filter(f => !f.isSystem) ?? []

  function patch(updates: Partial<FieldChangeAction>) {
    onChange({ ...action, ...updates })
  }

  const showTarget = !NO_TARGET_TYPES.includes(action.type)
  const showValue = action.type === 'set'
  const showMessage = MESSAGE_TYPES.includes(action.type)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <select
        className="form-select"
        style={{ fontSize: '12px' }}
        value={action.type}
        onChange={e => patch({ type: e.target.value as FieldChangeActionType })}
      >
        {ACTION_TYPES.map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      {showTarget && (
        <select
          className="form-select"
          style={{ fontSize: '12px' }}
          value={action.targetFieldId ?? ''}
          onChange={e => patch({ targetFieldId: e.target.value })}
        >
          <option value="">— Target field —</option>
          {fields.map(f => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
      )}

      {showValue && (
        <input
          type="text"
          className="input"
          style={{ fontSize: '12px' }}
          placeholder="Value to set"
          value={action.value !== undefined && action.value !== null ? String(action.value) : ''}
          onChange={e => patch({ value: e.target.value })}
        />
      )}

      {showMessage && (
        <input
          type="text"
          className="input"
          style={{ fontSize: '12px' }}
          placeholder="Message…"
          value={action.message ?? ''}
          onChange={e => patch({ message: e.target.value })}
        />
      )}
    </div>
  )
}
