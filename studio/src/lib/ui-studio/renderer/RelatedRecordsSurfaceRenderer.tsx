import type { ViewArtifact, PreviewContext, RuleEffect } from '../../../types/ui-studio/index'

interface RelatedRecordsSurfaceRendererProps {
  artifact: ViewArtifact
  previewContext: PreviewContext
  ruleMap: Map<string, RuleEffect>
}

const PLACEHOLDER_RECORDS = [
  { id: 'rel-001', name: 'Related Record A', type: 'Type 1', status: 'Active' },
  { id: 'rel-002', name: 'Related Record B', type: 'Type 2', status: 'Active' },
  { id: 'rel-003', name: 'Related Record C', type: 'Type 1', status: 'Inactive' },
]

export function RelatedRecordsSurfaceRenderer(_props: RelatedRecordsSurfaceRendererProps) {
  return (
    <div>
      <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Name', 'Type', 'Status'].map(h => (
              <th key={h} style={{
                padding: '8px 10px', textAlign: 'left', fontSize: '11.5px',
                fontWeight: 600, color: 'var(--text-muted)',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-sunken)',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PLACEHOLDER_RECORDS.map(record => (
            <tr key={record.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '8px 10px', fontSize: '12.5px' }}>{record.name}</td>
              <td style={{ padding: '8px 10px', fontSize: '12.5px' }}>{record.type}</td>
              <td style={{ padding: '8px 10px', fontSize: '12.5px' }}>{record.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
