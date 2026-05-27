import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActionRegistryPanel } from '../../../components/ui-studio/palette/ActionRegistryPanel'
import type { ViewArtifact } from '../../../types/ui-studio/index'

const baseArtifact: ViewArtifact = {
  id: 'v1', viewKey: 'test', label: 'Test', surfaceType: 'list',
  primaryEntityId: 'entity-customer', status: 'draft', version: 1,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  layout: { containers: [] }, components: [], dataSources: [], bindings: [],
  actions: [], behaviorRules: [],
}

const withActions: ViewArtifact = {
  ...baseArtifact,
  actions: [
    { id: 'a1', label: 'New Customer', placement: 'toolbar', actionType: 'navigate', config: {} },
    { id: 'a2', label: 'Edit', placement: 'row', actionType: 'navigate', config: {} },
  ],
}

describe('ActionRegistryPanel (M15)', () => {
  it('shows empty state when no actions', () => {
    render(<ActionRegistryPanel artifact={baseArtifact} onChange={vi.fn()} />)
    expect(screen.getByText(/No actions configured/i)).toBeInTheDocument()
  })
  it('shows Add Action button', () => {
    render(<ActionRegistryPanel artifact={baseArtifact} onChange={vi.fn()} />)
    expect(screen.getByText(/Add Action/i)).toBeInTheDocument()
  })
  it('shows existing actions', () => {
    render(<ActionRegistryPanel artifact={withActions} onChange={vi.fn()} />)
    expect(screen.getByText('New Customer')).toBeInTheDocument()
    expect(screen.getByText('Edit')).toBeInTheDocument()
  })
  it('calls onChange when Add Action clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ActionRegistryPanel artifact={baseArtifact} onChange={onChange} />)
    await user.click(screen.getByText(/Add Action/i))
    await waitFor(() => expect(onChange).toHaveBeenCalled())
  })
  it('shows placement badges', () => {
    render(<ActionRegistryPanel artifact={withActions} onChange={vi.fn()} />)
    expect(screen.getByText('toolbar')).toBeInTheDocument()
    expect(screen.getByText('row')).toBeInTheDocument()
  })
})
