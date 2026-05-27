import { MOCK_ENTITIES, getMockEntityById } from '../../../mocks/ui-studio/mockEntityMetadata'
import { MockLookupPreview } from './MockLookupPreview'
import type { ComponentDefinition, LookupConfig } from '../../../types/ui-studio/index'

interface LookupConfigPanelProps {
  component: ComponentDefinition
  entityId: string | undefined
  onChange: (config: Partial<Record<string, unknown>>) => void
}

export function LookupConfigPanel({ component, entityId, onChange }: LookupConfigPanelProps) {
  const isLookup = component.componentType === 'lookup_widget' || component.componentType === 'entity_ref'

  if (!isLookup) {
    return (
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0' }}>
        Select a lookup_widget field to configure
      </div>
    )
  }

  const existing = (component.config?.lookupConfig ?? {}) as Partial<LookupConfig>

  function patch(key: keyof LookupConfig, value: unknown) {
    onChange({ lookupConfig: { ...existing, [key]: value } })
  }

  function handleTargetEntityChange(newEntityId: string) {
    onChange({
      lookupConfig: {
        targetEntityId: newEntityId,
        displayFieldId: '',
        valueFieldId: '',
        pickerColumnIds: [],
        searchFieldIds: [],
        defaultFilter: existing.defaultFilter ?? '',
      },
    })
  }

  const targetEntity = existing.targetEntityId ? getMockEntityById(existing.targetEntityId) : undefined
  const nonSystemFields = targetEntity?.fields.filter(f => !f.isSystem) ?? []
  const textSelectFields = nonSystemFields.filter(f => f.fieldType === 'text' || f.fieldType === 'select')
  const systemOrIdFields = targetEntity?.fields.filter(f => f.isSystem || f.fieldCode === 'id') ?? []

  const otherEntities = MOCK_ENTITIES.filter(e => e.id !== entityId)

  const labelStyle: React.CSSProperties = {
    fontSize: '11.5px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: '4px',
    display: 'block',
  }

  const selectStyle: React.CSSProperties = {
    width: '100%',
    fontSize: '12px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Target Entity */}
      <div>
        <label style={labelStyle}>Target Entity</label>
        <select
          className="form-select"
          style={selectStyle}
          value={existing.targetEntityId ?? ''}
          onChange={e => handleTargetEntityChange(e.target.value)}
        >
          <option value="">— Select entity —</option>
          {otherEntities.map(e => (
            <option key={e.id} value={e.id}>{e.label}</option>
          ))}
        </select>
      </div>

      {/* Display Field */}
      <div>
        <label style={labelStyle}>Display Field</label>
        <select
          className="form-select"
          style={selectStyle}
          value={existing.displayFieldId ?? ''}
          onChange={e => patch('displayFieldId', e.target.value)}
          disabled={!targetEntity}
        >
          <option value="">— Select field —</option>
          {textSelectFields.map(f => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Value Field */}
      <div>
        <label style={labelStyle}>Value Field</label>
        <select
          className="form-select"
          style={selectStyle}
          value={existing.valueFieldId ?? ''}
          onChange={e => patch('valueFieldId', e.target.value)}
          disabled={!targetEntity}
        >
          <option value="">— Select field —</option>
          {systemOrIdFields.map(f => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Picker Columns */}
      <div>
        <label style={labelStyle}>Picker Columns</label>
        {nonSystemFields.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Select a target entity first</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {nonSystemFields.map(f => {
              const checked = (existing.pickerColumnIds ?? []).includes(f.id)
              return (
                <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => {
                      const cols = existing.pickerColumnIds ?? []
                      patch('pickerColumnIds', e.target.checked
                        ? [...cols, f.id]
                        : cols.filter(id => id !== f.id))
                    }}
                  />
                  {f.label}
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* Search Fields */}
      <div>
        <label style={labelStyle}>Search Fields</label>
        {textSelectFields.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Select a target entity first</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {textSelectFields.map(f => {
              const checked = (existing.searchFieldIds ?? []).includes(f.id)
              return (
                <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => {
                      const sfs = existing.searchFieldIds ?? []
                      patch('searchFieldIds', e.target.checked
                        ? [...sfs, f.id]
                        : sfs.filter(id => id !== f.id))
                    }}
                  />
                  {f.label}
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* Default Filter */}
      <div>
        <label style={labelStyle}>Default Filter (expression)</label>
        <input
          type="text"
          className="input"
          style={{ width: '100%', fontSize: '12px' }}
          value={existing.defaultFilter ?? ''}
          onChange={e => patch('defaultFilter', e.target.value)}
          placeholder="e.g. status = 'active'"
        />
      </div>

      {/* Preview */}
      {existing.targetEntityId && (
        <div>
          <div style={{ ...labelStyle, marginBottom: '6px' }}>Preview</div>
          <MockLookupPreview
            targetEntityId={existing.targetEntityId}
            displayFieldId={existing.displayFieldId ?? ''}
            pickerColumnIds={existing.pickerColumnIds ?? []}
          />
        </div>
      )}
    </div>
  )
}
