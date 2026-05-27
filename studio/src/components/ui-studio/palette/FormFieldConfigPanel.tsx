import { useState } from 'react'
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { FieldPicker } from '../common/FieldPicker'
import { MOCK_ENTITIES } from '../../../mocks/ui-studio/mockEntityMetadata'
import type { ViewArtifact, ComponentDefinition, MockEntityField } from '../../../types/ui-studio/index'

const WIDGET_TYPES = [
  'text_input',
  'textarea',
  'number_input',
  'currency_input',
  'date_picker',
  'datetime_picker',
  'checkbox',
  'dropdown',
  'lookup_widget',
  'display_label',
  'status_badge',
] as const

type WidgetType = typeof WIDGET_TYPES[number]

function autoWidget(field: MockEntityField): WidgetType {
  switch (field.fieldType) {
    case 'text': return 'text_input'
    case 'decimal':
    case 'number': return 'number_input'
    case 'currency': return 'currency_input'
    case 'boolean': return 'checkbox'
    case 'date': return 'date_picker'
    case 'datetime': return 'datetime_picker'
    case 'select':
    case 'multi_select': return 'dropdown'
    case 'entity_ref': return 'lookup_widget'
    case 'status': return 'status_badge'
    case 'computed': return 'display_label'
    default: return 'text_input'
  }
}

function makeFieldComponent(fieldId: string, entityId: string): ComponentDefinition {
  const entity = MOCK_ENTITIES.find(e => e.id === entityId)
  const field = entity?.fields.find(f => f.id === fieldId)
  const widgetType: WidgetType = field ? autoWidget(field) : 'text_input'
  return {
    id: `comp-${Date.now()}-${fieldId}`,
    componentType: widgetType,
    fieldId,
    label: field?.label ?? fieldId,
    config: {
      widgetType,
      required: field?.isRequired ?? false,
      readOnly: field?.isReadOnly ?? false,
      displayOnly: field?.isComputed ?? false,
      placeholder: '',
      helpText: '',
    },
  }
}

interface FormFieldConfigPanelProps {
  artifact: ViewArtifact
  onChange: (patch: Partial<ViewArtifact>) => void
}

export function FormFieldConfigPanel({ artifact, onChange }: FormFieldConfigPanelProps) {
  const [showPicker, setShowPicker] = useState(false)

  const formFields = artifact.components.filter(c => !c.componentType.endsWith('_column'))
  const columnComponents = artifact.components.filter(c => c.componentType.endsWith('_column'))
  const placedFieldIds = formFields.map(c => c.fieldId).filter((id): id is string => !!id)

  function handleAddField(fieldId: string, selected: boolean) {
    if (!selected) return
    const entityId = artifact.primaryEntityId ?? ''
    const newField = makeFieldComponent(fieldId, entityId)
    onChange({ components: [...columnComponents, ...formFields, newField] })
    setShowPicker(false)
  }

  function updateField(id: string, patch: Partial<ComponentDefinition>) {
    const updated = artifact.components.map(c => c.id === id ? { ...c, ...patch } : c)
    onChange({ components: updated })
  }

  function updateFieldConfig(id: string, configPatch: Record<string, unknown>) {
    const updated = artifact.components.map(c =>
      c.id === id ? { ...c, config: { ...c.config, ...configPatch } } : c
    )
    onChange({ components: updated })
  }

  function removeField(id: string) {
    onChange({ components: artifact.components.filter(c => c.id !== id) })
  }

  function moveField(id: string, dir: -1 | 1) {
    const allComps = [...artifact.components]
    const fieldIndices = allComps.reduce<number[]>((acc, c, i) => {
      if (!c.componentType.endsWith('_column')) acc.push(i)
      return acc
    }, [])
    const posInFields = fieldIndices.findIndex(i => allComps[i].id === id)
    if (posInFields === -1) return
    const targetPos = posInFields + dir
    if (targetPos < 0 || targetPos >= fieldIndices.length) return
    const fromIdx = fieldIndices[posInFields]
    const toIdx = fieldIndices[targetPos]
    ;[allComps[fromIdx], allComps[toIdx]] = [allComps[toIdx], allComps[fromIdx]]
    onChange({ components: allComps })
  }

  return (
    <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span className="panel-title" style={{ fontSize: '12px' }}>Form Fields</span>
        <button
          type="button"
          className="btn btn-ghost btn-xs"
          onClick={() => setShowPicker(v => !v)}
        >
          Add Field
        </button>
      </div>

      {showPicker && (
        <div style={{ marginBottom: '10px', padding: '8px', background: 'var(--bg-sunken)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <FieldPicker
            entityId={artifact.primaryEntityId}
            selectedFieldIds={placedFieldIds}
            onToggle={handleAddField}
            multiSelect={false}
            disabledFieldIds={placedFieldIds}
            label="Select a field to add"
          />
        </div>
      )}

      {formFields.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '12px 0', textAlign: 'center' }}>
          No fields configured. Apply Smart Defaults or add manually.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {formFields.map((field, idx) => (
            <div key={field.id} style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px',
              background: 'var(--bg-elev)',
              fontSize: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ flex: 1, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {field.label ?? field.fieldId}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  style={{ padding: '1px', minWidth: 'unset' }}
                  onClick={() => moveField(field.id, -1)}
                  disabled={idx === 0}
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  style={{ padding: '1px', minWidth: 'unset' }}
                  onClick={() => moveField(field.id, 1)}
                  disabled={idx === formFields.length - 1}
                >
                  <ChevronDown size={12} />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  style={{ color: 'var(--red, #dc2626)', padding: '1px', minWidth: 'unset' }}
                  onClick={() => removeField(field.id)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <select
                  className="form-select"
                  style={{ fontSize: '11px', height: '24px', flex: 1, minWidth: '80px' }}
                  value={(field.config as Record<string, unknown>)['widgetType'] as string ?? 'text_input'}
                  onChange={e => {
                    const widgetType = e.target.value
                    updateField(field.id, { componentType: widgetType })
                    updateFieldConfig(field.id, { widgetType })
                  }}
                >
                  {WIDGET_TYPES.map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  <input
                    type="checkbox"
                    checked={(field.config as Record<string, unknown>)['required'] as boolean ?? false}
                    onChange={e => updateFieldConfig(field.id, { required: e.target.checked })}
                  />
                  Required
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  <input
                    type="checkbox"
                    checked={(field.config as Record<string, unknown>)['readOnly'] as boolean ?? false}
                    onChange={e => updateFieldConfig(field.id, { readOnly: e.target.checked })}
                  />
                  Read Only
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
