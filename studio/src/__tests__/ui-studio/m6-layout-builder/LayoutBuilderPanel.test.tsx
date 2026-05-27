import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LayoutBuilderPanel } from '../../../components/ui-studio/builder/LayoutBuilderPanel'
import type { LayoutDefinition } from '../../../types/ui-studio/index'

const emptyLayout: LayoutDefinition = { containers: [] }
const filledLayout: LayoutDefinition = {
  containers: [{ id: 'c1', type: 'section', label: 'Info Section', children: [], fieldIds: [] }]
}

describe('LayoutBuilderPanel (M6)', () => {
  it('shows empty state when no containers', () => {
    render(<LayoutBuilderPanel layout={emptyLayout} onChange={vi.fn()} />)
    expect(screen.getByText(/No containers/i)).toBeInTheDocument()
  })
  it('shows add buttons for container types', () => {
    render(<LayoutBuilderPanel layout={emptyLayout} onChange={vi.fn()} />)
    expect(screen.getByText(/section/i)).toBeInTheDocument()
  })
  it('calls onChange when add section is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LayoutBuilderPanel layout={emptyLayout} onChange={onChange} />)
    const sectionBtn = screen.getAllByText(/section/i)[0]
    await user.click(sectionBtn)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      containers: expect.arrayContaining([expect.objectContaining({ type: 'section' })])
    }))
  })
  it('shows existing containers', () => {
    render(<LayoutBuilderPanel layout={filledLayout} onChange={vi.fn()} />)
    expect(screen.getByText('Info Section')).toBeInTheDocument()
  })
  it('calls onChange when container is removed', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LayoutBuilderPanel layout={filledLayout} onChange={onChange} />)
    const trashBtns = screen.getAllByRole('button').filter(b => b.querySelector('svg'))
    // Click the remove button (last icon button in the row)
    const removeBtn = trashBtns[trashBtns.length - 1]
    await user.click(removeBtn)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ containers: [] }))
  })
})
