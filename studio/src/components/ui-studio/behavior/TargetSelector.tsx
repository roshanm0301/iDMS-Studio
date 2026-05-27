interface Target {
  id: string
  label: string
  type: string
}

interface TargetSelectorProps {
  targetIds: string[]
  allTargets: Target[]
  onChange: (ids: string[]) => void
}

export function TargetSelector({ targetIds, allTargets, onChange }: TargetSelectorProps) {
  if (allTargets.length === 0) {
    return (
      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No targets available</div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {allTargets.map(target => {
        const checked = targetIds.includes(target.id)
        return (
          <label key={target.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={checked}
              onChange={e => {
                onChange(e.target.checked
                  ? [...targetIds, target.id]
                  : targetIds.filter(id => id !== target.id))
              }}
            />
            <span style={{ flex: 1 }}>{target.label}</span>
            <span style={{
              fontSize: '10px', color: 'var(--text-muted)',
              background: 'var(--bg-sunken)', padding: '1px 4px', borderRadius: '3px',
            }}>
              {target.type}
            </span>
          </label>
        )
      })}
    </div>
  )
}
