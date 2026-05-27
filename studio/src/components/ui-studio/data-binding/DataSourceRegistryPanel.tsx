import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { getMockEntityById } from '../../../mocks/ui-studio/mockEntityMetadata'
import { DataSourceConfigurator } from './DataSourceConfigurator'
import { DataSourcePreview } from './DataSourcePreview'
import type { ViewArtifact, DataSourceDefinition } from '../../../types/ui-studio/index'

interface DataSourceRegistryPanelProps {
  artifact: ViewArtifact
  onChange: (patch: Partial<ViewArtifact>) => void
}

export function DataSourceRegistryPanel({ artifact, onChange }: DataSourceRegistryPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const sources = artifact.dataSources ?? []

  function addSource() {
    const newSource: DataSourceDefinition = {
      id: `ds-${Date.now()}`,
      sourceType: 'primary_entity',
      entityId: artifact.primaryEntityId,
      filters: [],
    }
    onChange({ dataSources: [...sources, newSource] })
  }

  function updateSource(updated: DataSourceDefinition) {
    onChange({ dataSources: sources.map(s => s.id === updated.id ? updated : s) })
  }

  function removeSource(id: string) {
    onChange({ dataSources: sources.filter(s => s.id !== id) })
    if (expandedId === id) setExpandedId(null)
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="panel-title">Data Sources</div>
        <button className="btn btn-xs btn-primary" onClick={addSource} type="button">
          <Plus size={11} /> Add Source
        </button>
      </div>

      {sources.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0' }}>
          No data sources configured
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {sources.map(source => {
            const entity = source.entityId ? getMockEntityById(source.entityId) : undefined
            const isExpanded = expandedId === source.id

            return (
              <div key={source.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 8px',
                  background: 'var(--bg-sunken)',
                  cursor: 'pointer',
                }}
                  onClick={() => setExpandedId(isExpanded ? null : source.id)}
                >
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span style={{
                    fontSize: '10.5px', fontWeight: 600,
                    background: 'var(--accent-soft)', color: 'var(--accent)',
                    padding: '1px 5px', borderRadius: '4px',
                  }}>
                    {source.sourceType}
                  </span>
                  <span style={{ fontSize: '12px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entity?.label ?? source.entityId ?? '—'}
                  </span>
                  {source.filters.length > 0 && (
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      {source.filters.length} filter{source.filters.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={e => { e.stopPropagation(); removeSource(source.id) }}
                    type="button"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
                {isExpanded && (
                  <div style={{ padding: '10px' }}>
                    <DataSourceConfigurator dataSource={source} onChange={updateSource} />
                    <div style={{ marginTop: '10px' }}>
                      <DataSourcePreview dataSource={source} />
                    </div>
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
