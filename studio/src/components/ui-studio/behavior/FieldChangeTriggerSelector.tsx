import { getMockEntityById } from '../../../mocks/ui-studio/mockEntityMetadata'

interface FieldChangeTriggerSelectorProps {
  triggerFieldId: string
  entityId: string | undefined
  onChange: (fieldId: string) => void
}

export function FieldChangeTriggerSelector({ triggerFieldId, entityId, onChange }: FieldChangeTriggerSelectorProps) {
  const entity = entityId ? getMockEntityById(entityId) : undefined
  const fields = entity?.fields.filter(f => !f.isSystem) ?? []

  return (
    <select
      className="form-select"
      style={{ fontSize: '12px', width: '100%' }}
      value={triggerFieldId}
      onChange={e => onChange(e.target.value)}
    >
      <option value="">— Select trigger field —</option>
      {fields.map(f => (
        <option key={f.id} value={f.id}>{f.label}</option>
      ))}
    </select>
  )
}
