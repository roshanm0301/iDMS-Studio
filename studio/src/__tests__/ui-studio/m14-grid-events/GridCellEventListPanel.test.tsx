import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GridCellEventListPanel } from '../../../components/ui-studio/behavior/GridCellEventListPanel'
import type { ViewArtifact } from '../../../types/ui-studio/index'

const txArtifact: ViewArtifact = {
  id: 'v-tx', viewKey: 'sale_order', label: 'Sale Order', surfaceType: 'transaction_workspace',
  primaryEntityId: 'entity-saleorder', status: 'draft', version: 1,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  layout: { containers: [] }, components: [], dataSources: [], bindings: [], actions: [], behaviorRules: [],
  transactionConfig: {
    headerEntityId: 'entity-saleorder', lineEntityId: 'entity-saleorderline',
    lineRelationshipId: 'rel-so-lines', headerFieldIds: [],
    lineColumns: [
      { fieldId: 'f-sol-qty', label: 'Qty', editable: true },
      { fieldId: 'f-sol-rate', label: 'Rate', editable: true },
    ],
    totalsEnabled: false, totalFieldIds: [],
  },
}

const withEvents: ViewArtifact = {
  ...txArtifact,
  gridCellEvents: [
    { id: 'ce1', triggerColumnFieldId: 'f-sol-qty', actions: [{ type: 'recalculate_row', formula: 'qty * rate' }] },
    { id: 'ce2', triggerColumnFieldId: 'f-sol-rate', actions: [{ type: 'set_cell_value', targetColumnFieldId: 'f-sol-amount', formula: 'qty * rate' }] },
  ],
}

describe('GridCellEventListPanel (M14)', () => {
  it('shows empty state when no cell events', () => {
    render(<GridCellEventListPanel artifact={txArtifact} onChange={vi.fn()} />)
    expect(screen.getByText(/No grid cell events/i)).toBeInTheDocument()
  })
  it('shows Add Cell Event button', () => {
    render(<GridCellEventListPanel artifact={txArtifact} onChange={vi.fn()} />)
    expect(screen.getByText(/Add Cell Event/i)).toBeInTheDocument()
  })
  it('shows existing cell events', () => {
    render(<GridCellEventListPanel artifact={withEvents} onChange={vi.fn()} />)
    expect(screen.getAllByText(/recalculate_row|set_cell_value/i).length).toBeGreaterThan(0)
  })
  it('calls onChange when Add Cell Event clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<GridCellEventListPanel artifact={txArtifact} onChange={onChange} />)
    await user.click(screen.getByText(/Add Cell Event/i))
    await waitFor(() => expect(onChange).toHaveBeenCalled())
  })
})
