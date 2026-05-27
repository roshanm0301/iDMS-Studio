import type { ViewArtifact, PreviewContext, RuleEffect } from '../../../types/ui-studio/index'

interface DashboardSummarySurfaceRendererProps {
  artifact: ViewArtifact
  previewContext: PreviewContext
  ruleMap: Map<string, RuleEffect>
}

const STAT_CARDS = [
  { label: 'Total Orders', value: '142', color: '#6366f1' },
  { label: 'Revenue', value: '₹18,42,500', color: '#16a34a' },
  { label: 'Pending Approval', value: '7', color: '#d97706' },
  { label: 'This Month', value: '38', color: '#0ea5e9' },
]

export function DashboardSummarySurfaceRenderer(_props: DashboardSummarySurfaceRendererProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
        {STAT_CARDS.map(card => (
          <div key={card.label} style={{
            padding: '14px 16px',
            background: 'var(--bg-elev)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            borderLeft: `3px solid ${card.color}`,
          }}>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
              {card.label}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: card.color }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div style={{
        height: '200px',
        background: 'var(--bg-sunken)',
        borderRadius: 'var(--radius)',
        border: '1px dashed var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', fontSize: '12px',
      }}>
        Chart placeholder
      </div>
    </div>
  )
}
