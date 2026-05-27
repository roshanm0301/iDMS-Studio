import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GridConfigurationPanel } from '../../../components/ui-studio/palette/GridConfigurationPanel'
import type { ViewArtifact } from '../../../types/ui-studio/index'

const baseArtifact: ViewArtifact = {
  id: 'v1', viewKey: 'cust_list', label: 'Customers', surfaceType: 'list',
  primaryEntityId: 'entity-customer', status: 'draft', version: 1,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  layout: { containers: [] }, components: [], dataSources: [], bindings: [], actions: [], behaviorRules: [],
}

const withColumns: ViewArtifact = {
  ...baseArtifact,
  components: [
    { id: 'col1', componentType: 'text_column', fieldId: 'f-cust-name', label: 'Customer Name', config: { renderer: 'text', sortable: true, filterable: false } },
    { id: 'col2', componentType: 'status_column', fieldId: 'f-cust-status', label: 'Status', config: { renderer: 'status', sortable: false, filterable: false } },
  ],
}

describe('GridConfigurationPanel (M7)', () => {
  it('shows empty state when no columns', () => {
    render(<GridConfigurationPanel artifact={baseArtifact} onChange={vi.fn()} />)
    expect(screen.getByText(/No columns configured/i)).toBeInTheDocument()
  })
  it('shows Add Column button', () => {
    render(<GridConfigurationPanel artifact={baseArtifact} onChange={vi.fn()} />)
    expect(screen.getByText(/Add Column/i)).toBeInTheDocument()
  })
  it('shows configured columns', () => {
    render(<GridConfigurationPanel artifact={withColumns} onChange={vi.fn()} />)
    expect(screen.getByText('Customer Name')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })
  it('shows renderer selects for each column', () => {
    render(<GridConfigurationPanel artifact={withColumns} onChange={vi.fn()} />)
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThanOrEqual(2)
  })
  it('calls onChange when column is removed', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<GridConfigurationPanel artifact={withColumns} onChange={onChange} />)
    // Find all buttons with svg children
    const allBtns = screen.getAllByRole('button')
    // The remove buttons are the last icon-only buttons per row
    await user.click(allBtns[allBtns.length - 1])
    await waitFor(() => expect(onChange).toHaveBeenCalled())
  })
  it('opens field picker when Add Column clicked', async () => {
    const user = userEvent.setup()
    render(<GridConfigurationPanel artifact={baseArtifact} onChange={vi.fn()} />)
    await user.click(screen.getByText(/Add Column/i))
    expect(screen.getByPlaceholderText(/search fields/i)).toBeInTheDocument()
  })
})
