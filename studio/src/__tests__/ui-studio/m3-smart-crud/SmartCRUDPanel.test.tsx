import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SmartCRUDPanel } from '../../../components/ui-studio/smart-crud/SmartCRUDPanel'
import type { ViewArtifact } from '../../../types/ui-studio/index'

const listArtifact: ViewArtifact = {
  id: 'v-list', viewKey: 'cust_list', label: 'Customer List',
  surfaceType: 'list', primaryEntityId: 'entity-customer',
  status: 'draft', version: 1,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  layout: { containers: [] }, components: [], dataSources: [],
  bindings: [], actions: [], behaviorRules: [],
}

const txArtifact: ViewArtifact = {
  ...listArtifact,
  id: 'v-tx', viewKey: 'sale_order', label: 'Sale Order',
  surfaceType: 'transaction_workspace',
}

describe('SmartCRUDPanel (M3)', () => {
  it('shows Apply Smart Defaults button for list surface with entity', () => {
    render(<SmartCRUDPanel artifact={listArtifact} onApplyScaffold={vi.fn()} />)
    expect(screen.getByText('Apply Smart Defaults')).toBeInTheDocument()
  })

  it('shows entity field preview with eligible fields', () => {
    render(<SmartCRUDPanel artifact={listArtifact} onApplyScaffold={vi.fn()} />)
    // At least one non-system customer field should be visible in the preview list
    expect(screen.getAllByText(/Customer Name|Customer Code|Email|Phone|Customer Type|Branch|Status/).length).toBeGreaterThan(0)
  })

  it('calls onApplyScaffold with layout + components + scaffoldApplied when clicked', async () => {
    const user = userEvent.setup()
    const onApplyScaffold = vi.fn()
    render(<SmartCRUDPanel artifact={listArtifact} onApplyScaffold={onApplyScaffold} />)
    await user.click(screen.getByText('Apply Smart Defaults'))
    expect(onApplyScaffold).toHaveBeenCalledWith(expect.objectContaining({
      scaffoldApplied: true,
      layout: expect.any(Object),
      components: expect.any(Array),
      actions: expect.any(Array),
    }))
  })

  it('shows Re-generate label when scaffold already applied', () => {
    render(
      <SmartCRUDPanel
        artifact={{ ...listArtifact, scaffoldApplied: true }}
        onApplyScaffold={vi.fn()}
      />
    )
    expect(screen.getByText('Re-generate Scaffold')).toBeInTheDocument()
  })

  it('shows not-applicable message for transaction_workspace', () => {
    render(<SmartCRUDPanel artifact={txArtifact} onApplyScaffold={vi.fn()} />)
    expect(screen.getByText(/transaction workspace/i)).toBeInTheDocument()
    expect(screen.queryByText('Apply Smart Defaults')).not.toBeInTheDocument()
  })

  it('shows warning when no entity is selected', () => {
    render(
      <SmartCRUDPanel
        artifact={{ ...listArtifact, primaryEntityId: undefined }}
        onApplyScaffold={vi.fn()}
      />
    )
    expect(screen.getByText(/Select a Primary Entity/i)).toBeInTheDocument()
  })

  it('shows success indicator after scaffold applied', () => {
    render(
      <SmartCRUDPanel
        artifact={{ ...listArtifact, scaffoldApplied: true }}
        onApplyScaffold={vi.fn()}
      />
    )
    expect(screen.getByText(/Smart defaults applied/i)).toBeInTheDocument()
  })
})
