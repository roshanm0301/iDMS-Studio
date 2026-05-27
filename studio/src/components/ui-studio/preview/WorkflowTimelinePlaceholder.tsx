const PLACEHOLDER_ITEMS = [
  { label: 'Draft created', user: 'System', time: '2024-01-15 09:00' },
  { label: 'Submitted for approval', user: 'Sales User', time: '2024-01-15 10:30' },
  { label: 'Approved', user: 'Finance Manager', time: '2024-01-15 14:00' },
]

export function WorkflowTimelinePlaceholder() {
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '12px',
      background: 'var(--bg-sunken)',
    }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>
        Workflow Timeline (read-only)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {PLACEHOLDER_ITEMS.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: 'var(--text-muted)', marginTop: '3px', flexShrink: 0,
            }} />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.label}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', opacity: 0.7 }}>
                {item.user} · {item.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
