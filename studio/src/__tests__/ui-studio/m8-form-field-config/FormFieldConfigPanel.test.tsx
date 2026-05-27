import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormFieldConfigPanel } from '../../../components/ui-studio/palette/FormFieldConfigPanel'
import type { ViewArtifact } from '../../../types/ui-studio/index'

const baseArtifact: ViewArtifact = {
  id: 'v1', viewKey: 'cust_form', label: 'Customer Form', surfaceType: 'create_edit',
  primaryEntityId: 'entity-customer', status: 'draft', version: 1,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  layout: { containers: [] }, components: [], dataSources: [], bindings: [], actions: [], behaviorRules: [],
}

const withFields: ViewArtifact = {
  ...baseArtifact,
  components: [
    { id: 'c1', componentType: 'text_input', fieldId: 'f-cust-name', label: 'Customer Name', config: { widgetType: 'text_input', required: true, readOnly: false, displayOnly: false } },
    { id: 'c2', componentType: 'dropdown', fieldId: 'f-cust-type', label: 'Customer Type', config: { widgetType: 'dropdown', required: true, readOnly: false, displayOnly: false } },
  ],
}

describe('FormFieldConfigPanel (M8)', () => {
  it('shows empty state when no fields', () => {
    render(<FormFieldConfigPanel artifact={baseArtifact} onChange={vi.fn()} />)
    expect(screen.getByText(/No fields configured/i)).toBeInTheDocument()
  })
  it('shows Add Field button', () => {
    render(<FormFieldConfigPanel artifact={baseArtifact} onChange={vi.fn()} />)
    expect(screen.getByText(/Add Field/i)).toBeInTheDocument()
  })
  it('shows configured fields', () => {
    render(<FormFieldConfigPanel artifact={withFields} onChange={vi.fn()} />)
    expect(screen.getByText('Customer Name')).toBeInTheDocument()
    expect(screen.getByText('Customer Type')).toBeInTheDocument()
  })
  it('shows widget type selects', () => {
    render(<FormFieldConfigPanel artifact={withFields} onChange={vi.fn()} />)
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThanOrEqual(2)
  })
  it('shows required checkboxes', () => {
    render(<FormFieldConfigPanel artifact={withFields} onChange={vi.fn()} />)
    expect(screen.getAllByText('Required').length).toBeGreaterThan(0)
  })
  it('opens field picker when Add Field clicked', async () => {
    const user = userEvent.setup()
    render(<FormFieldConfigPanel artifact={baseArtifact} onChange={vi.fn()} />)
    await user.click(screen.getByText(/Add Field/i))
    expect(screen.getByPlaceholderText(/search fields/i)).toBeInTheDocument()
  })
  it('calls onChange when field widget type changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FormFieldConfigPanel artifact={withFields} onChange={onChange} />)
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], 'textarea')
    await waitFor(() => expect(onChange).toHaveBeenCalled())
  })
})
