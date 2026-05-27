import type { WorkflowStateConfig } from '../../../types/ui-studio/index'

interface WorkflowStatusStripProps {
  states: WorkflowStateConfig[]
  currentStateId: string
}

export function WorkflowStatusStrip({ states, currentStateId }: WorkflowStatusStripProps) {
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', padding: '8px 0' }}>
      {states.map(state => {
        const isCurrent = state.id === currentStateId
        return (
          <span
            key={state.id}
            style={{
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '11.5px',
              fontWeight: isCurrent ? 600 : 400,
              background: isCurrent ? state.color : 'transparent',
              color: isCurrent ? '#fff' : state.color,
              border: `1.5px solid ${state.color}`,
              transition: 'all 0.15s',
            }}
          >
            {state.label}
          </span>
        )
      })}
    </div>
  )
}
