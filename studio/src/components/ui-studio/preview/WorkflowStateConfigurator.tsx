import { Plus, Trash2 } from 'lucide-react'
import type { WorkflowConfig, WorkflowStateConfig } from '../../../types/ui-studio/index'

interface WorkflowStateConfiguratorProps {
  config: WorkflowConfig | undefined
  onChange: (config: WorkflowConfig) => void
}

const SALE_ORDER_STATES: WorkflowStateConfig[] = [
  { id: 'ws-draft', label: 'Draft', color: '#6366f1', availableActionIds: [], requiresComment: false },
  { id: 'ws-submitted', label: 'Submitted', color: '#0ea5e9', availableActionIds: [], requiresComment: false },
  { id: 'ws-approved', label: 'Approved', color: '#16a34a', availableActionIds: [], requiresComment: false },
  { id: 'ws-invoiced', label: 'Invoiced', color: '#7c3aed', availableActionIds: [], requiresComment: false },
  { id: 'ws-closed', label: 'Closed', color: '#64748b', availableActionIds: [], requiresComment: false },
  { id: 'ws-rejected', label: 'Rejected', color: '#dc2626', availableActionIds: [], requiresComment: true },
  { id: 'ws-cancelled', label: 'Cancelled', color: '#f97316', availableActionIds: [], requiresComment: true },
]

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: '3px',
  display: 'block',
}

export function WorkflowStateConfigurator({ config, onChange }: WorkflowStateConfiguratorProps) {
  const states = config?.states ?? []
  const initialStateId = config?.initialStateId ?? ''

  function addState() {
    const newState: WorkflowStateConfig = {
      id: `ws-${Date.now()}`,
      label: 'New State',
      color: '#6366f1',
      availableActionIds: [],
      requiresComment: false,
    }
    onChange({ states: [...states, newState], initialStateId })
  }

  function updateState(updated: WorkflowStateConfig) {
    onChange({ states: states.map(s => s.id === updated.id ? updated : s), initialStateId })
  }

  function removeState(id: string) {
    const next = states.filter(s => s.id !== id)
    onChange({ states: next, initialStateId: initialStateId === id ? (next[0]?.id ?? '') : initialStateId })
  }

  function seedStates() {
    onChange({ states: SALE_ORDER_STATES, initialStateId: 'ws-draft' })
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="panel-title">Workflow States</div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="btn btn-xs btn-ghost" onClick={seedStates} type="button">
            Seed SaleOrder States
          </button>
          <button className="btn btn-xs btn-primary" onClick={addState} type="button">
            <Plus size={11} /> Add State
          </button>
        </div>
      </div>

      {states.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0' }}>
          No workflow states defined. Click "Add State" or use the seed button above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {states.map(state => (
            <div key={state.id} style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px',
              background: 'var(--bg-sunken)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <div style={{
                  width: '12px', height: '12px', borderRadius: '50%',
                  background: state.color, flexShrink: 0,
                }} />
                <span style={{ fontSize: '12px', fontWeight: 500, flex: 1 }} aria-hidden="true">{state.label}</span>
                <input
                  type="text"
                  className="input"
                  aria-label={`State label: ${state.label}`}
                  style={{ width: '90px', fontSize: '12px' }}
                  value={state.label}
                  onChange={e => updateState({ ...state, label: e.target.value })}
                />
                <input
                  type="text"
                  className="input"
                  style={{ width: '72px', fontSize: '11px', fontFamily: 'monospace' }}
                  value={state.color}
                  onChange={e => updateState({ ...state, color: e.target.value })}
                />
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => removeState(state.id)}
                  type="button"
                >
                  <Trash2 size={11} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Initial</label>
                <input
                  type="radio"
                  name="initial-state"
                  checked={initialStateId === state.id}
                  onChange={() => onChange({ states, initialStateId: state.id })}
                />
                <label style={{ ...labelStyle, marginBottom: 0, marginLeft: '8px' }}>Requires Comment</label>
                <input
                  type="checkbox"
                  checked={state.requiresComment}
                  onChange={e => updateState({ ...state, requiresComment: e.target.checked })}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
