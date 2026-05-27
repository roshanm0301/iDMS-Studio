import { evaluateMockFilter } from '../../../lib/ui-studio/mockFilterEvaluator'

const records = [
  { id: '1', name: 'Alpha', type: 'vehicle', price: 100 },
  { id: '2', name: 'Beta', type: 'spare', price: 50 },
  { id: '3', name: 'Gamma', type: 'vehicle', price: 200 },
]

describe('evaluateMockFilter (M11)', () => {
  it('returns all records when no filters', () => {
    expect(evaluateMockFilter(records, [])).toHaveLength(3)
  })
  it('filters with eq operator', () => {
    const result = evaluateMockFilter(records, [{ field: 'type', operator: 'eq', value: 'vehicle' }])
    expect(result).toHaveLength(2)
  })
  it('filters with neq operator', () => {
    const result = evaluateMockFilter(records, [{ field: 'type', operator: 'neq', value: 'spare' }])
    expect(result).toHaveLength(2)
  })
  it('filters with contains operator', () => {
    const result = evaluateMockFilter(records, [{ field: 'name', operator: 'contains', value: 'ph' }])
    expect(result).toHaveLength(1)
  })
  it('filters with gt operator', () => {
    const result = evaluateMockFilter(records, [{ field: 'price', operator: 'gt', value: 75 }])
    expect(result).toHaveLength(2)
  })
  it('filters with lt operator', () => {
    const result = evaluateMockFilter(records, [{ field: 'price', operator: 'lt', value: 75 }])
    expect(result).toHaveLength(1)
  })
  it('chains multiple filters', () => {
    const result = evaluateMockFilter(records, [
      { field: 'type', operator: 'eq', value: 'vehicle' },
      { field: 'price', operator: 'gt', value: 150 },
    ])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('3')
  })
})
