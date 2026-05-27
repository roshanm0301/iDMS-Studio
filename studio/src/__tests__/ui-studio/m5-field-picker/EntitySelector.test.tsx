import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EntitySelector } from '../../../components/ui-studio/common/EntitySelector'

describe('EntitySelector (M5)', () => {
  it('renders entity options', () => {
    render(<EntitySelector value="" onChange={vi.fn()} />)
    expect(screen.getByText('Customer')).toBeInTheDocument()
    expect(screen.getByText('Product')).toBeInTheDocument()
  })
  it('calls onChange with entity id when selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<EntitySelector value="" onChange={onChange} />)
    await user.selectOptions(screen.getByRole('combobox'), 'entity-customer')
    expect(onChange).toHaveBeenCalledWith('entity-customer')
  })
  it('shows placeholder option', () => {
    render(<EntitySelector value="" onChange={vi.fn()} placeholder="Choose entity" />)
    expect(screen.getByText('Choose entity')).toBeInTheDocument()
  })
  it('excludes specified entity ids', () => {
    render(<EntitySelector value="" onChange={vi.fn()} excludeIds={['entity-customer']} />)
    expect(screen.queryByText('Customer')).not.toBeInTheDocument()
  })
})
