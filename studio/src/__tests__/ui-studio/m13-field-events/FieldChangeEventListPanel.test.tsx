import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FieldChangeEventListPanel } from '../../../components/ui-studio/behavior/FieldChangeEventListPanel'
import type { ViewArtifact } from '../../../types/ui-studio/index'

const baseArtifact: ViewArtifact = {
  id: 'v1', viewKey: 'test', label: 'Test', surfaceType: 'create_edit',
  primaryEntityId: 'entity-saleorder', status: 'draft', version: 1,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  layout: { containers: [] }, components: [], dataSources: [], bindings: [], actions: [], behaviorRules: [],
}

const withEvents: ViewArtifact = {
  ...baseArtifact,
  fieldChangeEvents: [
    { id: 'evt1', triggerFieldId: 'f-so-customer', actions: [{ type: 'refresh_lookup', targetFieldId: 'f-so-salesperson' }] },
    { id: 'evt2', triggerFieldId: 'f-so-paytype', actions: [{ type: 'set', targetFieldId: 'f-so-financer', value: null }] },
  ],
}

describe('FieldChangeEventListPanel (M13)', () => {
  it('shows empty state when no events', () => {
    render(<FieldChangeEventListPanel artifact={baseArtifact} onChange={vi.fn()} />)
    expect(screen.getByText(/No field change events/i)).toBeInTheDocument()
  })
  it('shows Add Event button', () => {
    render(<FieldChangeEventListPanel artifact={baseArtifact} onChange={vi.fn()} />)
    expect(screen.getByText(/Add Event/i)).toBeInTheDocument()
  })
  it('shows existing events', () => {
    render(<FieldChangeEventListPanel artifact={withEvents} onChange={vi.fn()} />)
    expect(screen.getAllByText(/refresh_lookup|set/i).length).toBeGreaterThan(0)
  })
  it('calls onChange when Add Event clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FieldChangeEventListPanel artifact={baseArtifact} onChange={onChange} />)
    await user.click(screen.getByText(/Add Event/i))
    await waitFor(() => expect(onChange).toHaveBeenCalled())
  })
})
