import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import type { ViewValidationSummary, ValidationIssue } from '../../../types/ui-studio/index'

interface ValidationPanelProps {
  summary: ViewValidationSummary
  onNavigate?: (targetId: string) => void
}

function IssueList({
  issues,
  icon,
  color,
}: {
  issues: ValidationIssue[]
  icon: React.ReactNode
  color: string
}) {
  if (issues.length === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {issues.map((issue, i) => (
        <div key={`${issue.code}-${i}`} style={{
          display: 'flex', alignItems: 'flex-start', gap: '6px',
          fontSize: '11.5px', padding: '4px 6px',
          background: 'var(--bg-sunken)', borderRadius: 'var(--radius-sm)',
        }}>
          <span style={{ color, flexShrink: 0, marginTop: '1px' }}>{icon}</span>
          <span style={{ flex: 1 }}>{issue.message}</span>
          <span style={{
            fontSize: '10px', fontFamily: 'monospace', fontWeight: 600,
            color: 'var(--text-muted)', background: 'var(--bg-elev)',
            padding: '1px 4px', borderRadius: '3px', flexShrink: 0,
          }}>
            {issue.code}
          </span>
        </div>
      ))}
    </div>
  )
}

function SectionHeader({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>{label}</span>
      {count > 0 && (
        <span style={{
          fontSize: '10px', fontWeight: 700,
          background: color, color: '#fff',
          padding: '0px 5px', borderRadius: '999px', lineHeight: '16px',
        }}>
          {count}
        </span>
      )}
    </div>
  )
}

export function ValidationPanel({ summary, onNavigate }: ValidationPanelProps) {
  const totalIssues = summary.errors.length + summary.warnings.length + summary.suggestions.length
  const _ = onNavigate // suppress unused var warning

  if (totalIssues === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 0', color: '#16a34a' }}>
        <CheckCircle size={14} />
        <span style={{ fontSize: '12px', fontWeight: 500 }}>Ready to publish</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Validation
      </div>

      {summary.errors.length > 0 && (
        <div>
          <SectionHeader label="Errors" count={summary.errors.length} color="#dc2626" />
          <IssueList issues={summary.errors} icon={<AlertCircle size={12} />} color="#dc2626" />
        </div>
      )}

      {summary.warnings.length > 0 && (
        <div>
          <SectionHeader label="Warnings" count={summary.warnings.length} color="#d97706" />
          <IssueList issues={summary.warnings} icon={<AlertTriangle size={12} />} color="#d97706" />
        </div>
      )}

      {summary.suggestions.length > 0 && (
        <div>
          <SectionHeader label="Suggestions" count={summary.suggestions.length} color="#2563eb" />
          <IssueList issues={summary.suggestions} icon={<Info size={12} />} color="#2563eb" />
        </div>
      )}
    </div>
  )
}
