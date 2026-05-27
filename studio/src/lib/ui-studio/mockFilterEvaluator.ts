import type { FilterExpression } from '../../types/ui-studio/index'

export function evaluateMockFilter(
  records: Record<string, unknown>[],
  filters: FilterExpression[],
): Record<string, unknown>[] {
  if (filters.length === 0) return records

  return records.filter(record => {
    return filters.every(filter => {
      const fieldValue = record[filter.field]
      const filterValue = filter.value

      switch (filter.operator) {
        case 'eq':
          return fieldValue === filterValue
        case 'neq':
          return fieldValue !== filterValue
        case 'contains':
          return typeof fieldValue === 'string' &&
            typeof filterValue === 'string' &&
            fieldValue.toLowerCase().includes(filterValue.toLowerCase())
        case 'gt':
          return typeof fieldValue === 'number' &&
            typeof filterValue === 'number' &&
            fieldValue > filterValue
        case 'lt':
          return typeof fieldValue === 'number' &&
            typeof filterValue === 'number' &&
            fieldValue < filterValue
        case 'in':
          return Array.isArray(filterValue) && filterValue.includes(fieldValue)
        default:
          return true
      }
    })
  })
}
