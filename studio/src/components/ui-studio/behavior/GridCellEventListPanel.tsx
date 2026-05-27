import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { GridCellTriggerSelector } from './GridCellTriggerSelector'
import { GridCellActionBuilder } from './GridCellActionBuilder'
import type { ViewArtifact, GridCellEvent, GridCellAction, TransactionLineColumn } from '../../../types/ui-studio/index'

interface GridCellEventListPanelProps {
  artifact: ViewArtifact
  onChange: (patch: Partial<ViewArtifact>) => void
}

export function GridCellEventListPanel({ artifact, onChange }: GridCellEventListPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const events = artifact.gridCellEvents ?? []
  const lineColumns: TransactionLineColumn[] = artifact.transactionConfig?.lineColumns ?? []
  const lineEntityId = artifact.transactionConfig?.lineEntityId

  function getColumnLabel(fieldId: string): string {
    return lineColumns.find(c => c.fieldId === fieldId)?.label ?? fieldId
  }

  function addEvent() {
    const newEvent: GridCellEvent = {
      id: `gce-${Date.now()}`,
      triggerColumnFieldId: '',
      actions: [],
    }
    onChange({ gridCellEvents: [...events, newEvent] })
  }

  function updateEvent(updated: GridCellEvent) {
    onChange({ gridCellEvents: events.map(e => e.id === updated.id ? updated : e) })
  }

  function removeEvent(id: string) {
    onChange({ gridCellEvents: events.filter(e => e.id !== id) })
    if (expandedId === id) setExpandedId(null)
  }

  function addAction(eventId: string) {
    const evt = events.find(e => e.id === eventId)
    if (!evt) return
    const newAction: GridCellAction = { type: 'set_cell_value' }
    updateEvent({ ...evt, actions: [...evt.actions, newAction] })
  }

  function updateAction(eventId: string, index: number, updated: GridCellAction) {
    const evt = events.find(e => e.id === eventId)
    if (!evt) return
    updateEvent({
      ...evt,
      actions: evt.actions.map((a, i) => i === index ? updated : a),
    })
  }

  function removeAction(eventId: string, index: number) {
    const evt = events.find(e => e.id === eventId)
    if (!evt) return
    updateEvent({ ...evt, actions: evt.actions.filter((_, i) => i !== index) })
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="panel-title">Grid Cell Events</div>
        <button className="btn btn-xs btn-primary" onClick={addEvent} type="button">
          <Plus size={11} /> Add Cell Event
        </button>
      </div>

      {events.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0' }}>
          No grid cell events defined
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {events.map(evt => {
            const isExpanded = expandedId === evt.id
            const triggerLabel = evt.triggerColumnFieldId ? getColumnLabel(evt.triggerColumnFieldId) : '—'

            return (
              <div key={evt.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 8px', background: 'var(--bg-sunken)', cursor: 'pointer',
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : evt.id)}
                >
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span style={{ flex: 1, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {triggerLabel}
                  </span>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    {evt.actions.length} action{evt.actions.length !== 1 ? 's' : ''}
                  </span>
                  {evt.actions.map((a, i) => (
                    <span key={i} style={{
                      fontSize: '10.5px', background: 'var(--bg-sunken)', padding: '1px 4px',
                      borderRadius: '3px', color: 'var(--text-muted)',
                    }}>
                      {a.type}
                    </span>
                  ))}
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={e => { e.stopPropagation(); removeEvent(evt.id) }}
                    type="button"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
                {isExpanded && (
                  <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <GridCellTriggerSelector
                      triggerColumnFieldId={evt.triggerColumnFieldId}
                      lineColumns={lineColumns}
                      lineEntityId={lineEntityId}
                      onChange={fieldId => updateEvent({ ...evt, triggerColumnFieldId: fieldId })}
                    />

                    {evt.actions.map((action, i) => (
                      <div key={i} style={{
                        border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                        padding: '8px', position: 'relative',
                      }}>
                        <button
                          className="btn btn-ghost btn-xs"
                          style={{ position: 'absolute', top: '4px', right: '4px' }}
                          onClick={() => removeAction(evt.id, i)}
                          type="button"
                        >
                          <Trash2 size={10} />
                        </button>
                        <GridCellActionBuilder
                          action={action}
                          lineColumns={lineColumns}
                          lineEntityId={lineEntityId}
                          onChange={updated => updateAction(evt.id, i, updated)}
                        />
                      </div>
                    ))}

                    <button className="btn btn-xs btn-ghost" onClick={() => addAction(evt.id)} type="button">
                      <Plus size={11} /> Add Action
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
