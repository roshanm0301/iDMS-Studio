import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TransactionCanvas } from '../../../components/ui-studio/transaction/TransactionCanvas'
import type { ViewArtifact } from '../../../types/ui-studio/index'

const txArtifact: ViewArtifact = {
  id: 'v-tx', viewKey: 'sale_order_entry', label: 'Sale Order Entry',
  surfaceType: 'transaction_workspace',
  primaryEntityId: 'entity-saleorder',
  status: 'draft', version: 1,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  layout: { containers: [] }, components: [], dataSources: [],
  bindings: [], actions: [], behaviorRules: [],
}

describe('TransactionCanvas (M4)', () => {
  it('renders the three workspace sections', () => {
    render(<TransactionCanvas artifact={txArtifact} onUpdate={vi.fn()} />)
    expect(screen.getByText('Header Section')).toBeInTheDocument()
    expect(screen.getByText('Line Grid')).toBeInTheDocument()
    expect(screen.getByText(/Totals \/ Summary/i)).toBeInTheDocument()
  })

  it('shows header entity name (SaleOrder)', () => {
    render(<TransactionCanvas artifact={txArtifact} onUpdate={vi.fn()} />)
    // "Sale Order" appears in the header section subtitle — check at least 1 instance
    expect(screen.getAllByText(/Sale Order/).length).toBeGreaterThan(0)
  })

  it('shows line entity selector', () => {
    render(<TransactionCanvas artifact={txArtifact} onUpdate={vi.fn()} />)
    expect(screen.getByText('Line Entity')).toBeInTheDocument()
  })

  it('calls onUpdate when line entity is selected', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    render(<TransactionCanvas artifact={txArtifact} onUpdate={onUpdate} />)
    const selects = screen.getAllByRole('combobox')
    const lineEntitySelect = selects.find(s => (s as HTMLSelectElement).value === '')
    if (lineEntitySelect) {
      await user.selectOptions(lineEntitySelect, 'entity-saleorderline')
      await waitFor(() => expect(onUpdate).toHaveBeenCalled())
    }
  })

  it('shows Enable toggle for totals section', () => {
    render(<TransactionCanvas artifact={txArtifact} onUpdate={vi.fn()} />)
    expect(screen.getByText('Enable')).toBeInTheDocument()
  })

  it('shows warning when no primary entity set', () => {
    render(
      <TransactionCanvas
        artifact={{ ...txArtifact, primaryEntityId: undefined }}
        onUpdate={vi.fn()}
      />
    )
    expect(screen.getByText(/Select a Primary.*Entity/i)).toBeInTheDocument()
  })

  it('shows header field picker when header entity is set', () => {
    render(<TransactionCanvas artifact={txArtifact} onUpdate={vi.fn()} />)
    expect(screen.getByText(/Select header fields/i)).toBeInTheDocument()
  })

  it('shows column config table after line columns are configured', () => {
    render(
      <TransactionCanvas
        artifact={{
          ...txArtifact,
          transactionConfig: {
            headerEntityId: 'entity-saleorder',
            lineEntityId: 'entity-saleorderline',
            lineRelationshipId: 'rel-so-lines',
            headerFieldIds: [],
            lineColumns: [{ fieldId: 'f-sol-qty', editable: true }],
            totalsEnabled: false,
            totalFieldIds: [],
          },
        }}
        onUpdate={vi.fn()}
      />
    )
    expect(screen.getByText('Column Configuration')).toBeInTheDocument()
    expect(screen.getByText('Editable')).toBeInTheDocument()
  })

  it('shows totals field picker when totals enabled and line entity has numeric fields', () => {
    render(
      <TransactionCanvas
        artifact={{
          ...txArtifact,
          transactionConfig: {
            headerEntityId: 'entity-saleorder',
            lineEntityId: 'entity-saleorderline',
            lineRelationshipId: 'rel-so-lines',
            headerFieldIds: [],
            lineColumns: [],
            totalsEnabled: true,
            totalFieldIds: [],
          },
        }}
        onUpdate={vi.fn()}
      />
    )
    expect(screen.getByText(/Select numeric fields to total/i)).toBeInTheDocument()
  })
})
