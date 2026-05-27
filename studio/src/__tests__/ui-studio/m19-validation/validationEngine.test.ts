import { validateArtifact } from '../../../lib/ui-studio/validationEngine'
import type { ViewArtifact } from '../../../types/ui-studio/index'

const base: ViewArtifact = {
  id: 'v1', viewKey: 'test_view', label: 'Test View', surfaceType: 'list',
  primaryEntityId: 'entity-customer', status: 'draft', version: 1,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  layout: { containers: [] }, components: [], dataSources: [], bindings: [],
  actions: [], behaviorRules: [],
}

describe('validateArtifact (M19)', () => {
  it('returns no errors for a valid artifact', () => {
    const result = validateArtifact({ ...base, components: [{ id: 'c1', componentType: 'text_column', fieldId: 'f-cust-name', label: 'Name', config: {} }], actions: [{ id: 'a1', label: 'New', placement: 'toolbar', actionType: 'navigate', config: {} }] })
    expect(result.errors).toHaveLength(0)
  })
  it('flags missing viewKey (VAL-001)', () => {
    const result = validateArtifact({ ...base, viewKey: '' })
    expect(result.errors.some(e => e.code === 'VAL-001')).toBe(true)
  })
  it('flags missing label (VAL-002)', () => {
    const result = validateArtifact({ ...base, label: '' })
    expect(result.errors.some(e => e.code === 'VAL-002')).toBe(true)
  })
  it('warns for missing primaryEntityId (VAL-003)', () => {
    const result = validateArtifact({ ...base, primaryEntityId: undefined })
    expect(result.warnings.some(e => e.code === 'VAL-003')).toBe(true)
  })
  it('errors for transaction_workspace without header entity (VAL-004)', () => {
    const result = validateArtifact({ ...base, surfaceType: 'transaction_workspace', transactionConfig: { headerEntityId: '', lineEntityId: 'entity-saleorderline', lineRelationshipId: 'rel-so-lines', headerFieldIds: [], lineColumns: [], totalsEnabled: false, totalFieldIds: [] } })
    expect(result.errors.some(e => e.code === 'VAL-004')).toBe(true)
  })
  it('errors for transaction_workspace without line entity (VAL-005)', () => {
    const result = validateArtifact({ ...base, surfaceType: 'transaction_workspace', transactionConfig: { headerEntityId: 'entity-saleorder', lineEntityId: '', lineRelationshipId: '', headerFieldIds: [], lineColumns: [], totalsEnabled: false, totalFieldIds: [] } })
    expect(result.errors.some(e => e.code === 'VAL-005')).toBe(true)
  })
  it('warns for list with no columns (VAL-006)', () => {
    const result = validateArtifact({ ...base, surfaceType: 'list', components: [] })
    expect(result.warnings.some(e => e.code === 'VAL-006')).toBe(true)
  })
  it('warns for create_edit with no fields (VAL-007)', () => {
    const result = validateArtifact({ ...base, surfaceType: 'create_edit', components: [] })
    expect(result.warnings.some(e => e.code === 'VAL-007')).toBe(true)
  })
  it('gives suggestion when no actions (VAL-011)', () => {
    const result = validateArtifact({ ...base, actions: [] })
    expect(result.suggestions.some(e => e.code === 'VAL-011')).toBe(true)
  })
})
