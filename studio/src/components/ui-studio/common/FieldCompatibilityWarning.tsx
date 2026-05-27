import { AlertTriangle } from 'lucide-react'

interface FieldCompatibilityWarningProps {
  message: string
}

export function FieldCompatibilityWarning({ message }: FieldCompatibilityWarningProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '6px',
      padding: '8px 10px',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--amber-soft, #fef3c7)',
      color: 'var(--amber, #d97706)',
      fontSize: '12px',
      lineHeight: 1.5,
    }}>
      <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
      <span>{message}</span>
    </div>
  )
}
