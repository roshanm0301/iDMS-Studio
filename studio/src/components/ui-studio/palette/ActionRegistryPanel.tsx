import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { ActionConfigurator } from './ActionConfigurator'
import type { ViewArtifact, ActionDefinition } from '../../../types/ui-studio/index'

interface ActionRegistryPanelProps {
  artifact: ViewArtifact
  onChange: (patch: Partial<ViewArtifact>) => void
}

export function ActionRegistryPanel({ artifact, onChange }: ActionRegistryPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const actions = artifact.actions ?? []

  function addAction() {
    const newAction: ActionDefinition = {
      id: `action-${Date.now()}`,
      label: 'New Action',
      placement: 'toolbar',
      actionType: 'navigate',
      config: {},
    }
    onChange({ actions: [...actions, newAction] })
  }

  function updateAction(updated: ActionDefinition) {
    onChange({ actions: actions.map(a => a.id === updated.id ? updated : a) })
  }

  function removeAction(id: string) {
    onChange({ actions: actions.filter(a => a.id !== id) })
    if (expandedId === id) setExpandedId(null)
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="panel-title">Actions</div>
        <button className="btn btn-xs btn-primary" onClick={addAction} type="button">
          <Plus size={11} /> Add Action
        </button>
      </div>

      {actions.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0' }}>
          No actions configured.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {actions.map(action => {
            const isExpanded = expandedId === action.id
            return (
              <div key={action.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 8px', background: 'var(--bg-sunken)', cursor: 'pointer',
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : action.id)}
                >
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span style={{ flex: 1, fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {action.label}
                  </span>
                  <span style={{
                    fontSize: '10.5px', fontWeight: 600,
                    background: 'var(--accent-soft)', color: 'var(--accent)',
                    padding: '1px 5px', borderRadius: '4px',
                  }}>
                    {action.actionType}
                  </span>
                  <span style={{
                    fontSize: '10.5px', fontWeight: 500,
                    background: 'var(--bg-elev)', color: 'var(--text-muted)',
                    padding: '1px 5px', borderRadius: '4px',
                    border: '1px solid var(--border)',
                  }}>
                    {action.placement}
                  </span>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={e => { e.stopPropagation(); removeAction(action.id) }}
                    type="button"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
                {isExpanded && (
                  <ActionConfigurator action={action} onChange={updateAction} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
