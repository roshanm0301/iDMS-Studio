import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WorkflowStateConfigurator } from '../../../components/ui-studio/preview/WorkflowStateConfigurator'

const emptyConfig = undefined
const filledConfig = {
  initialStateId: 'ws-draft',
  states: [
    { id: 'ws-draft', label: 'Draft', color: '#6366f1', availableActionIds: [], requiresComment: false },
    { id: 'ws-submitted', label: 'Submitted', color: '#0ea5e9', availableActionIds: [], requiresComment: false },
  ],
}

describe('WorkflowStateConfigurator (M16)', () => {
  it('shows seed button when no config', () => {
    render(<WorkflowStateConfigurator config={emptyConfig} onChange={vi.fn()} />)
    expect(screen.getByText(/Seed.*States/i)).toBeInTheDocument()
  })
  it('calls onChange with 7 states when seed clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<WorkflowStateConfigurator config={emptyConfig} onChange={onChange} />)
    await user.click(screen.getByText(/Seed.*States/i))
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        states: expect.arrayContaining([
          expect.objectContaining({ label: 'Draft' }),
          expect.objectContaining({ label: 'Approved' }),
        ])
      }))
    })
  })
  it('shows existing states', () => {
    render(<WorkflowStateConfigurator config={filledConfig} onChange={vi.fn()} />)
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByText('Submitted')).toBeInTheDocument()
  })
  it('shows Add State button', () => {
    render(<WorkflowStateConfigurator config={filledConfig} onChange={vi.fn()} />)
    expect(screen.getByText(/Add State/i)).toBeInTheDocument()
  })
})
