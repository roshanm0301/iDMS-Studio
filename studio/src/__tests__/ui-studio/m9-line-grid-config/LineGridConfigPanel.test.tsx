import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LineGridConfigPanel } from '../../../components/ui-studio/transaction/LineGridConfigPanel'
import type { ViewArtifact } from '../../../types/ui-studio/index'

const baseArtifact: ViewArtifact = {
  id: 'v-tx', viewKey: 'sale_order', label: 'Sale Order', surfaceType: 'transaction_workspace',
  primaryEntityId: 'entity-saleorder', status: 'draft', version: 1,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  layout: { containers: [] }, components: [], dataSources: [], bindings: [], actions: [], behaviorRules: [],
}

const withLineEntity: ViewArtifact = {
  ...baseArtifact,
  transactionConfig: {
    headerEntityId: 'entity-saleorder',
    lineEntityId: 'entity-saleorderline',
    lineRelationshipId: 'rel-so-lines',
    headerFieldIds: [],
    lineColumns: [],
    totalsEnabled: false,
    totalFieldIds: [],
  },
}

const withColumns: ViewArtifact = {
  ...withLineEntity,
  transactionConfig: {
    ...withLineEntity.transactionConfig!,
    lineColumns: [
      { fieldId: 'f-sol-qty', label: 'Qty', editable: true },
      { fieldId: 'f-sol-rate', label: 'Rate', editable: false },
    ],
  },
}

describe('LineGridConfigPanel (M9)', () => {
  it('shows message when no line entity', () => {
    render(<LineGridConfigPanel artifact={baseArtifact} onChange={vi.fn()} />)
    expect(screen.getByText(/Select a Line Entity first/i)).toBeInTheDocument()
  })
  it('shows empty state when line entity set but no columns', () => {
    render(<LineGridConfigPanel artifact={withLineEntity} onChange={vi.fn()} />)
    expect(screen.getByText(/No line grid columns/i)).toBeInTheDocument()
  })
  it('shows Add Column button when line entity is set', () => {
    render(<LineGridConfigPanel artifact={withLineEntity} onChange={vi.fn()} />)
    expect(screen.getByText(/Add Column/i)).toBeInTheDocument()
  })
  it('shows configured line columns', () => {
    render(<LineGridConfigPanel artifact={withColumns} onChange={vi.fn()} />)
    expect(screen.getByText('Qty')).toBeInTheDocument()
    expect(screen.getByText('Rate')).toBeInTheDocument()
  })
  it('shows editable checkboxes for each column', () => {
    render(<LineGridConfigPanel artifact={withColumns} onChange={vi.fn()} />)
    expect(screen.getAllByText('Editable').length).toBeGreaterThan(0)
  })
  it('calls onChange when editable toggle changed', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LineGridConfigPanel artifact={withColumns} onChange={onChange} />)
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    await waitFor(() => expect(onChange).toHaveBeenCalled())
  })
  it('shows row behavior section', () => {
    render(<LineGridConfigPanel artifact={withLineEntity} onChange={vi.fn()} />)
    expect(screen.getByText(/Allow Add Row/i)).toBeInTheDocument()
  })
  it('opens field picker when Add Column clicked', async () => {
    const user = userEvent.setup()
    render(<LineGridConfigPanel artifact={withLineEntity} onChange={vi.fn()} />)
    await user.click(screen.getByText(/Add Column/i))
    expect(screen.getByPlaceholderText(/search fields/i)).toBeInTheDocument()
  })
})
