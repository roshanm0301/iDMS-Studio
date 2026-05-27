import type { LayoutDefinition, LayoutContainer } from '../../../types/ui-studio/index'

interface ContainerBlockProps {
  container: LayoutContainer
  entityId?: string
}

function ContainerBlock({ container }: ContainerBlockProps) {
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      marginBottom: '8px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        background: 'var(--bg-elev)',
        borderBottom: '1px solid var(--border)',
        fontSize: '12px',
      }}>
        <span style={{
          display: 'inline-block',
          padding: '1px 5px',
          borderRadius: '3px',
          fontSize: '10px',
          fontWeight: 600,
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
          textTransform: 'uppercase',
        }}>
          {container.type}
        </span>
        <span style={{ fontWeight: 500, color: 'var(--text)' }}>{container.label}</span>
      </div>
      {container.fieldIds.length > 0 && (
        <div style={{ padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {container.fieldIds.map(fid => (
            <span key={fid} style={{
              padding: '2px 8px',
              borderRadius: '3px',
              background: 'var(--bg-sunken)',
              border: '1px solid var(--border)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontFamily: 'monospace',
            }}>
              {fid}
            </span>
          ))}
        </div>
      )}
      {container.children.length > 0 && (
        <div style={{ padding: '8px', paddingTop: 0 }}>
          {container.children.map(child => (
            <ContainerBlock key={child.id} container={child} />
          ))}
        </div>
      )}
    </div>
  )
}

interface LayoutCanvasProps {
  layout: LayoutDefinition
  entityId?: string
}

export function LayoutCanvas({ layout, entityId }: LayoutCanvasProps) {
  if (layout.containers.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
        No layout containers defined.
      </div>
    )
  }

  return (
    <div style={{ padding: '16px' }}>
      {layout.containers.map(c => (
        <ContainerBlock key={c.id} container={c} entityId={entityId} />
      ))}
    </div>
  )
}
