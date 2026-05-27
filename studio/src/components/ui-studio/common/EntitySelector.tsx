import { MOCK_ENTITIES } from '../../../mocks/ui-studio/mockEntityMetadata'

interface EntitySelectorProps {
  value: string | undefined
  onChange: (entityId: string) => void
  placeholder?: string
  excludeIds?: string[]
}

export function EntitySelector({ value, onChange, placeholder, excludeIds }: EntitySelectorProps) {
  const entities = MOCK_ENTITIES.filter(e => !excludeIds?.includes(e.id))

  return (
    <select
      className="form-select"
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
    >
      {placeholder !== undefined ? (
        <option value="">{placeholder}</option>
      ) : (
        <option value="">— Select entity —</option>
      )}
      {entities.map(e => (
        <option key={e.id} value={e.id}>{e.label}</option>
      ))}
    </select>
  )
}
