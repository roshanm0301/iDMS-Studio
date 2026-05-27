import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FieldPicker } from '../../../components/ui-studio/common/FieldPicker'

describe('FieldPicker (M5)', () => {
  it('shows message when no entity selected', () => {
    render(<FieldPicker entityId={undefined} selectedFieldIds={[]} onToggle={vi.fn()} />)
    expect(screen.getByText(/Select an entity/i)).toBeInTheDocument()
  })
  it('shows entity fields for a valid entityId', () => {
    render(<FieldPicker entityId="entity-customer" selectedFieldIds={[]} onToggle={vi.fn()} />)
    expect(screen.getByText('Customer Name')).toBeInTheDocument()
  })
  it('hides system fields', () => {
    render(<FieldPicker entityId="entity-customer" selectedFieldIds={[]} onToggle={vi.fn()} />)
    expect(screen.queryByText('Customer ID')).not.toBeInTheDocument()
  })
  it('filters fields by search', async () => {
    const user = userEvent.setup()
    render(<FieldPicker entityId="entity-customer" selectedFieldIds={[]} onToggle={vi.fn()} />)
    await user.type(screen.getByPlaceholderText(/search fields/i), 'email')
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.queryByText('Customer Name')).not.toBeInTheDocument()
  })
  it('calls onToggle when field checkbox clicked', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<FieldPicker entityId="entity-customer" selectedFieldIds={[]} onToggle={onToggle} />)
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    expect(onToggle).toHaveBeenCalled()
  })
  it('disables fields in disabledFieldIds', () => {
    render(<FieldPicker entityId="entity-customer" selectedFieldIds={['f-cust-name']} onToggle={vi.fn()} disabledFieldIds={['f-cust-name']} />)
    const checkboxes = screen.getAllByRole('checkbox')
    const disabledBox = checkboxes.find(c => (c as HTMLInputElement).disabled)
    expect(disabledBox).toBeDefined()
  })
  it('shows type filter chips', () => {
    render(<FieldPicker entityId="entity-customer" selectedFieldIds={[]} onToggle={vi.fn()} />)
    expect(screen.getByText('All')).toBeInTheDocument()
  })
  it('shows label when provided', () => {
    render(<FieldPicker entityId="entity-customer" selectedFieldIds={[]} onToggle={vi.fn()} label="Choose fields" />)
    expect(screen.getByText('Choose fields')).toBeInTheDocument()
  })
})
