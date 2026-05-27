import { useState } from 'react'
import { Plus, Layers, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import type { LayoutDefinition, LayoutContainer } from '../../../types/ui-studio/index'

type ContainerType = LayoutContainer['type']

const CONTAINER_TYPES: ContainerType[] = ['section', 'tabs', 'columns', 'accordion']

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function makeContainer(type: ContainerType): LayoutContainer {
  return {
    id: `lc-${Date.now()}`,
    type,
    label: capitalize(type),
    children: [],
    fieldIds: [],
  }
}

interface ContainerRowProps {
  container: LayoutContainer
  onRemove: () => void
  onLabelChange: (label: string) => void
}

function ContainerRow({ container, onRemove, onLabelChange }: ContainerRowProps) {
  const [expanded, setExpanded] = useState(true)
  const [editing, setEditing] = useState(false)
  const [labelValue, setLabelValue] = useState(container.label ?? container.type)

  function commitLabel() {
    setEditing(false)
    onLabelChange(labelValue)
  }

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      marginBottom: '4px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 8px',
        background: 'var(--bg-elev)',
        fontSize: '12px',
      }}>
        <button
          type="button"
          className="btn btn-ghost btn-xs"
          style={{ padding: '1px', minWidth: 'unset' }}
          onClick={() => setExpanded(v => !v)}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        <Layers size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <span style={{
          display: 'inline-block',
          padding: '1px 5px',
          borderRadius: '3px',
          fontSize: '10px',
          fontWeight: 600,
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          flexShrink: 0,
        }}>
          {container.type}
        </span>
        {editing ? (
          <input
            type="text"
            className="input"
            value={labelValue}
            autoFocus
            onChange={e => setLabelValue(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={e => { if (e.key === 'Enter') commitLabel() }}
            style={{ fontSize: '12px', height: '22px', flex: 1, padding: '0 6px' }}
          />
        ) : (
          <span
            style={{ flex: 1, cursor: 'text', color: 'var(--text)', fontWeight: 500 }}
            onClick={() => setEditing(true)}
          >
            {container.label ?? container.type}
          </span>
        )}
        <button
          type="button"
          className="btn btn-ghost btn-xs"
          style={{ color: 'var(--red, #dc2626)', padding: '2px', minWidth: 'unset' }}
          onClick={onRemove}
        >
          <Trash2 size={12} />
        </button>
      </div>
      {expanded && container.fieldIds.length > 0 && (
        <div style={{ padding: '6px 8px', fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-sunken)', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {container.fieldIds.map(fid => (
            <span key={fid} style={{ padding: '1px 6px', borderRadius: '3px', background: 'var(--bg-elev)', border: '1px solid var(--border)' }}>
              {fid}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

interface LayoutBuilderPanelProps {
  layout: LayoutDefinition
  onChange: (layout: LayoutDefinition) => void
}

export function LayoutBuilderPanel({ layout, onChange }: LayoutBuilderPanelProps) {
  function addContainer(type: ContainerType) {
    const newContainer = makeContainer(type)
    onChange({ ...layout, containers: [...layout.containers, newContainer] })
  }

  function removeContainer(id: string) {
    onChange({ ...layout, containers: layout.containers.filter(c => c.id !== id) })
  }

  function updateContainerLabel(id: string, label: string) {
    onChange({
      ...layout,
      containers: layout.containers.map(c => c.id === id ? { ...c, label } : c),
    })
  }

  return (
    <div style={{ padding: '12px' }}>
      <div className="panel-header" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="panel-title" style={{ fontSize: '12px' }}>Layout Containers</span>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {CONTAINER_TYPES.map(type => (
            <button
              key={type}
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => addContainer(type)}
              style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px' }}
            >
              <Plus size={11} />{type}
            </button>
          ))}
        </div>
      </div>

      {layout.containers.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '16px 0', textAlign: 'center' }}>
          No containers. Add a section to get started.
        </div>
      ) : (
        <div>
          {layout.containers.map(c => (
            <ContainerRow
              key={c.id}
              container={c}
              onRemove={() => removeContainer(c.id)}
              onLabelChange={label => updateContainerLabel(c.id, label)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
