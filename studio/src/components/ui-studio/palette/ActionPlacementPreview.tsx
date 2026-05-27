import type { ActionDefinition } from '../../../types/ui-studio/index'

interface ActionPlacementPreviewProps {
  actions: ActionDefinition[]
}

const ZONE_ORDER: ActionDefinition['placement'][] = ['toolbar', 'form_footer', 'row', 'section', 'grid', 'quick_action']

export function ActionPlacementPreview({ actions }: ActionPlacementPreviewProps) {
  const byPlacement = new Map<string, ActionDefinition[]>()
  for (const action of actions) {
    const list = byPlacement.get(action.placement) ?? []
    list.push(action)
    byPlacement.set(action.placement, list)
  }

  if (byPlacement.size === 0) return null

  return (
    <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {ZONE_ORDER.filter(zone => byPlacement.has(zone)).map(zone => {
        const zoneActions = byPlacement.get(zone)!
        const isHorizontal = zone === 'toolbar' || zone === 'form_footer'
        return (
          <div key={zone}>
            <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {zone}
            </div>
            <div style={{
              display: 'flex',
              flexDirection: isHorizontal ? 'row' : 'column',
              gap: '4px',
              padding: '8px',
              background: 'var(--bg-sunken)',
              borderRadius: 'var(--radius-sm)',
              border: '1px dashed var(--border)',
            }}>
              {zoneActions.map(action => (
                <button
                  key={action.id}
                  className="btn btn-secondary btn-sm"
                  style={{ pointerEvents: 'none' }}
                  tabIndex={-1}
                >
                  {zone === 'row' ? `row action: ${action.label}` : action.label}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
