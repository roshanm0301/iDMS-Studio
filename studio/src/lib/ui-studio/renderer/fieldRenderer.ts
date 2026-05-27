export function renderFieldValue(value: unknown, widgetType: string): string {
  switch (widgetType) {
    case 'currency':
      return `₹${Number(value).toLocaleString('en-IN')}`
    case 'boolean':
    case 'checkbox':
      return value ? 'Yes' : 'No'
    case 'date':
      return String(value ?? '—').slice(0, 10)
    case 'datetime':
      return String(value ?? '—').slice(0, 16).replace('T', ' ')
    case 'status_badge':
    case 'status':
      return String(value ?? '—').toUpperCase()
    case 'display_label':
    case 'computed':
      return String(value ?? '—')
    default:
      return String(value ?? '—')
  }
}
