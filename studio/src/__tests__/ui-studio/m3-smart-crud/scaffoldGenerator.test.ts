import { generateListScaffold, generateFormScaffold, generateScaffold } from '../../../lib/ui-studio/scaffoldGenerator'
import { MOCK_ENTITIES } from '../../../mocks/ui-studio/mockEntityMetadata'

const customer = MOCK_ENTITIES.find(e => e.id === 'entity-customer')!
const product = MOCK_ENTITIES.find(e => e.id === 'entity-product')!

describe('generateListScaffold (M3)', () => {
  it('produces a section container', () => {
    const result = generateListScaffold(customer)
    expect(result.layout.containers).toHaveLength(1)
    expect(result.layout.containers[0].type).toBe('section')
    expect(result.layout.containers[0].label).toBe('Columns')
  })

  it('creates column components for non-system fields (max 8)', () => {
    const result = generateListScaffold(customer)
    expect(result.components.length).toBeGreaterThan(0)
    expect(result.components.length).toBeLessThanOrEqual(8)
    result.components.forEach(c => {
      expect(c.componentType).toMatch(/_column$/)
    })
  })

  it('excludes system fields', () => {
    const result = generateListScaffold(customer)
    const systemFieldIds = customer.fields.filter(f => f.isSystem).map(f => f.id)
    result.components.forEach(c => {
      expect(systemFieldIds).not.toContain(c.fieldId)
    })
  })

  it('adds a toolbar create action', () => {
    const result = generateListScaffold(customer)
    expect(result.actions).toHaveLength(1)
    expect(result.actions[0].placement).toBe('toolbar')
    expect(result.actions[0].actionType).toBe('navigate')
    expect(result.actions[0].label).toContain('Customer')
  })

  it('maps entity_ref fields to reference_column', () => {
    const result = generateListScaffold(customer)
    const refField = customer.fields.find(f => f.fieldType === 'entity_ref')
    if (refField) {
      const col = result.components.find(c => c.fieldId === refField.id)
      expect(col?.componentType).toBe('reference_column')
    }
  })
})

describe('generateFormScaffold (M3)', () => {
  it('splits required and optional fields into separate sections', () => {
    const result = generateFormScaffold(customer)
    const labels = result.layout.containers.map(c => c.label)
    expect(labels).toContain('Required Information')
    expect(labels).toContain('Additional Details')
  })

  it('creates form widget components for non-system, non-computed fields', () => {
    const result = generateFormScaffold(product)
    expect(result.components.length).toBeGreaterThan(0)
    expect(result.components.every(c => c.componentType !== '')).toBe(true)
  })

  it('maps entity_ref to lookup_widget', () => {
    const result = generateFormScaffold(customer)
    const refField = customer.fields.find(f => !f.isSystem && f.fieldType === 'entity_ref')
    if (refField) {
      const comp = result.components.find(c => c.fieldId === refField.id)
      expect(comp?.componentType).toBe('lookup_widget')
    }
  })

  it('adds Save and Cancel footer actions', () => {
    const result = generateFormScaffold(customer)
    const footerActions = result.actions.filter(a => a.placement === 'form_footer')
    expect(footerActions).toHaveLength(2)
    const labels = footerActions.map(a => a.label)
    expect(labels).toContain('Save')
    expect(labels).toContain('Cancel')
  })

  it('marks required fields as required in component config', () => {
    const result = generateFormScaffold(customer)
    const requiredFieldIds = customer.fields.filter(f => !f.isSystem && f.isRequired).map(f => f.id)
    requiredFieldIds.forEach(fid => {
      const comp = result.components.find(c => c.fieldId === fid)
      expect(comp?.config?.required).toBe(true)
    })
  })
})

describe('generateScaffold dispatcher (M3)', () => {
  it('returns list scaffold for list surface', () => {
    const result = generateScaffold(customer, 'list')
    expect(result).not.toBeNull()
    expect(result?.components[0].componentType).toMatch(/_column$/)
  })

  it('returns form scaffold for create_edit surface', () => {
    const result = generateScaffold(customer, 'create_edit')
    expect(result).not.toBeNull()
    const hasFormFooter = result?.actions.some(a => a.placement === 'form_footer')
    expect(hasFormFooter).toBe(true)
  })

  it('returns null for transaction_workspace surface (CRUD-010)', () => {
    expect(generateScaffold(customer, 'transaction_workspace')).toBeNull()
  })

  it('returns null for dashboard_summary surface (CRUD-010)', () => {
    expect(generateScaffold(customer, 'dashboard_summary')).toBeNull()
  })
})
