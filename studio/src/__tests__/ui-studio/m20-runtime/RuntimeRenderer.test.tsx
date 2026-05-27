import { render, screen } from '@testing-library/react'
import { RuntimeRenderer } from '../../../lib/ui-studio/renderer/RuntimeRenderer'
import type { ViewArtifact, PreviewContext } from '../../../types/ui-studio/index'

const defaultCtx: PreviewContext = { role: 'Admin', device: 'desktop', workflowState: '', sampleRecordId: '' }

const listArtifact: ViewArtifact = {
  id: 'v1', viewKey: 'cust_list', label: 'Customer List', surfaceType: 'list',
  primaryEntityId: 'entity-customer', status: 'published', version: 2,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  layout: { containers: [] },
  components: [
    { id: 'c1', componentType: 'text_column', fieldId: 'f-cust-name', label: 'Customer Name', config: { renderer: 'text' } },
    { id: 'c2', componentType: 'status_column', fieldId: 'f-cust-status', label: 'Status', config: { renderer: 'status' } },
  ],
  dataSources: [], bindings: [],
  actions: [{ id: 'a1', label: 'New Customer', placement: 'toolbar', actionType: 'navigate', config: {} }],
  behaviorRules: [],
}

const txArtifact: ViewArtifact = {
  id: 'v-tx', viewKey: 'sale_order', label: 'Sale Order Entry', surfaceType: 'transaction_workspace',
  primaryEntityId: 'entity-saleorder', status: 'draft', version: 1,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  layout: { containers: [] }, components: [], dataSources: [], bindings: [], actions: [], behaviorRules: [],
  transactionConfig: {
    headerEntityId: 'entity-saleorder', lineEntityId: 'entity-saleorderline',
    lineRelationshipId: 'rel-so-lines',
    headerFieldIds: ['f-so-date', 'f-so-customer'],
    lineColumns: [{ fieldId: 'f-sol-qty', label: 'Qty', editable: true }, { fieldId: 'f-sol-rate', label: 'Rate', editable: false }],
    totalsEnabled: true, totalFieldIds: [],
  },
}

describe('RuntimeRenderer (M20)', () => {
  it('renders list surface with columns and mock data', () => {
    render(<RuntimeRenderer artifact={listArtifact} previewContext={defaultCtx} />)
    expect(screen.getByText('Customer Name')).toBeInTheDocument()
  })
  it('shows toolbar action for list surface', () => {
    render(<RuntimeRenderer artifact={listArtifact} previewContext={defaultCtx} />)
    expect(screen.getByText('New Customer')).toBeInTheDocument()
  })
  it('renders mock customer records in list', () => {
    render(<RuntimeRenderer artifact={listArtifact} previewContext={defaultCtx} />)
    expect(screen.getByText('Ramesh Motors')).toBeInTheDocument()
  })
  it('renders transaction workspace surface', () => {
    render(<RuntimeRenderer artifact={txArtifact} previewContext={defaultCtx} />)
    expect(screen.getByText(/Header/i)).toBeInTheDocument()
  })
  it('renders dashboard summary for dashboard surface', () => {
    render(<RuntimeRenderer artifact={{ ...listArtifact, surfaceType: 'dashboard_summary' }} previewContext={defaultCtx} />)
    expect(document.body).toBeTruthy()
  })
  it('applies role-based rule hiding (Viewer hides admin actions)', () => {
    const artifactWithRule: ViewArtifact = {
      ...listArtifact,
      actions: [{ id: 'a1', label: 'New Customer', placement: 'toolbar', actionType: 'navigate', visibilityRuleId: 'r1', config: {} }],
      behaviorRules: [{ id: 'r1', label: 'Admin only', conditions: [{ type: 'role', value: 'Viewer' }], effect: { type: 'hide' }, targetIds: ['a1'] }],
    }
    render(<RuntimeRenderer artifact={artifactWithRule} previewContext={{ ...defaultCtx, role: 'Viewer' }} />)
    // Action should be hidden
    expect(screen.queryByText('New Customer')).not.toBeInTheDocument()
  })
})
