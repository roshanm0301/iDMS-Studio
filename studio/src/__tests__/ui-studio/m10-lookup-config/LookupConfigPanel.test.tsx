import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LookupConfigPanel } from '../../../components/ui-studio/inspector/LookupConfigPanel'
import type { ComponentDefinition } from '../../../types/ui-studio/index'

const lookupComp: ComponentDefinition = {
  id: 'c1', componentType: 'lookup_widget', fieldId: 'f-so-customer', label: 'Customer',
  config: { lookupConfig: { targetEntityId: 'entity-customer', displayFieldId: '', valueFieldId: '', pickerColumnIds: [], searchFieldIds: [] } },
}

describe('LookupConfigPanel (M10)', () => {
  it('renders lookup entity selector', () => {
    render(<LookupConfigPanel component={lookupComp} entityId="entity-saleorder" onChange={vi.fn()} />)
    expect(screen.getByText(/Target Entity/i)).toBeInTheDocument()
  })
  it('renders display field selector', () => {
    render(<LookupConfigPanel component={lookupComp} entityId="entity-saleorder" onChange={vi.fn()} />)
    expect(screen.getByText(/Display Field/i)).toBeInTheDocument()
  })
  it('renders picker columns section', () => {
    render(<LookupConfigPanel component={lookupComp} entityId="entity-saleorder" onChange={vi.fn()} />)
    expect(screen.getByText(/Picker Columns/i)).toBeInTheDocument()
  })
  it('renders search fields section', () => {
    render(<LookupConfigPanel component={lookupComp} entityId="entity-saleorder" onChange={vi.fn()} />)
    expect(screen.getByText(/Search Fields/i)).toBeInTheDocument()
  })
  it('renders default filter input', () => {
    render(<LookupConfigPanel component={lookupComp} entityId="entity-saleorder" onChange={vi.fn()} />)
    expect(screen.getByText(/Default Filter/i)).toBeInTheDocument()
  })
  it('calls onChange when target entity changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LookupConfigPanel component={lookupComp} entityId="entity-saleorder" onChange={onChange} />)
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], 'entity-product')
    await waitFor(() => expect(onChange).toHaveBeenCalled())
  })
})
