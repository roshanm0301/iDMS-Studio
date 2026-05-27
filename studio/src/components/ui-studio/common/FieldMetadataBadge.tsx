import type { MockEntityField } from '../../../types/ui-studio/index'

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  text: { bg: 'var(--blue-soft, #dbeafe)', color: 'var(--blue, #2563eb)' },
  number: { bg: 'var(--indigo-soft, #e0e7ff)', color: 'var(--indigo, #4338ca)' },
  decimal: { bg: 'var(--indigo-soft, #e0e7ff)', color: 'var(--indigo, #4338ca)' },
  currency: { bg: 'var(--green-soft, #dcfce7)', color: 'var(--green, #16a34a)' },
  boolean: { bg: 'var(--amber-soft, #fef3c7)', color: 'var(--amber, #d97706)' },
  date: { bg: 'var(--purple-soft, #f3e8ff)', color: 'var(--purple, #9333ea)' },
  datetime: { bg: 'var(--purple-soft, #f3e8ff)', color: 'var(--purple, #9333ea)' },
  select: { bg: 'var(--teal-soft, #ccfbf1)', color: 'var(--teal, #0d9488)' },
  multi_select: { bg: 'var(--teal-soft, #ccfbf1)', color: 'var(--teal, #0d9488)' },
  entity_ref: { bg: 'var(--orange-soft, #ffedd5)', color: 'var(--orange, #ea580c)' },
  computed: { bg: 'var(--red-soft, #fee2e2)', color: 'var(--red, #dc2626)' },
  status: { bg: 'var(--accent-soft, #eff6ff)', color: 'var(--accent, #3b82f6)' },
}

const DEFAULT_COLOR = { bg: 'var(--bg-sunken, #f3f4f6)', color: 'var(--text-muted, #6b7280)' }

interface FieldMetadataBadgeProps {
  field: MockEntityField
  compact?: boolean
}

export function FieldMetadataBadge({ field, compact = false }: FieldMetadataBadgeProps) {
  const typeColor = TYPE_COLORS[field.fieldType] ?? DEFAULT_COLOR

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
      <span style={{
        display: 'inline-block',
        padding: '1px 5px',
        borderRadius: '3px',
        fontSize: '10px',
        fontWeight: 600,
        fontFamily: 'monospace',
        background: typeColor.bg,
        color: typeColor.color,
        lineHeight: '14px',
      }}>
        {field.fieldType}
      </span>
      {!compact && field.isSystem && (
        <span style={{
          display: 'inline-block',
          padding: '1px 4px',
          borderRadius: '3px',
          fontSize: '9px',
          fontWeight: 700,
          background: 'var(--bg-sunken, #f3f4f6)',
          color: 'var(--text-subtle, #9ca3af)',
          lineHeight: '14px',
          letterSpacing: '0.03em',
        }}>
          SYS
        </span>
      )}
      {!compact && field.isComputed && (
        <span style={{
          display: 'inline-block',
          padding: '1px 4px',
          borderRadius: '3px',
          fontSize: '9px',
          fontWeight: 700,
          background: 'var(--red-soft, #fee2e2)',
          color: 'var(--red, #dc2626)',
          lineHeight: '14px',
          letterSpacing: '0.03em',
        }}>
          COMP
        </span>
      )}
      {!compact && field.isReadOnly && !field.isSystem && !field.isComputed && (
        <span style={{
          display: 'inline-block',
          padding: '1px 4px',
          borderRadius: '3px',
          fontSize: '9px',
          fontWeight: 700,
          background: 'var(--bg-sunken, #f3f4f6)',
          color: 'var(--text-subtle, #9ca3af)',
          lineHeight: '14px',
          letterSpacing: '0.03em',
        }}>
          RO
        </span>
      )}
      {!compact && field.isRequired && !field.isSystem && (
        <span style={{
          display: 'inline-block',
          padding: '1px 4px',
          borderRadius: '3px',
          fontSize: '9px',
          fontWeight: 700,
          background: 'var(--amber-soft, #fef3c7)',
          color: 'var(--amber, #d97706)',
          lineHeight: '14px',
          letterSpacing: '0.03em',
        }}>
          REQ
        </span>
      )}
    </span>
  )
}
