import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SurfaceConfigPanel } from '../../../components/ui-studio/palette/SurfaceConfigPanel'
import type { ViewArtifact } from '../../../types/ui-studio/index'

const baseArtifact: ViewArtifact = {
  id: 'v1', viewKey: 'test_view', label: 'Test View',
  surfaceType: 'list', primaryEntityId: 'entity-customer',
  status: 'draft', version: 1,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  layout: { containers: [] }, components: [], dataSources: [],
  bindings: [], actions: [], behaviorRules: [],
}

describe('SurfaceConfigPanel (M2)', () => {
  it('renders surface type label and description', () => {
    render(
      <SurfaceConfigPanel
        artifact={baseArtifact}
        onChangeSurface={vi.fn()}
        onUpdateContextContract={vi.fn()}
      />
    )
    expect(screen.getByText('List')).toBeInTheDocument()
    expect(screen.getByText(/grid or table listing/i)).toBeInTheDocument()
  })

  it('shows Change button for draft views', () => {
    render(
      <SurfaceConfigPanel
        artifact={baseArtifact}
        onChangeSurface={vi.fn()}
        onUpdateContextContract={vi.fn()}
      />
    )
    expect(screen.getByText('Change')).toBeInTheDocument()
  })

  it('shows lock icon for published views', () => {
    render(
      <SurfaceConfigPanel
        artifact={{ ...baseArtifact, status: 'published' }}
        onChangeSurface={vi.fn()}
        onUpdateContextContract={vi.fn()}
      />
    )
    expect(screen.queryByText('Change')).not.toBeInTheDocument()
  })

  it('shows record ID source field for record_detail surface', () => {
    render(
      <SurfaceConfigPanel
        artifact={{ ...baseArtifact, surfaceType: 'record_detail' }}
        onChangeSurface={vi.fn()}
        onUpdateContextContract={vi.fn()}
      />
    )
    expect(screen.getByText('Record ID Source')).toBeInTheDocument()
  })

  it('shows line entity selector for transaction_workspace surface', () => {
    render(
      <SurfaceConfigPanel
        artifact={{ ...baseArtifact, surfaceType: 'transaction_workspace' }}
        onChangeSurface={vi.fn()}
        onUpdateContextContract={vi.fn()}
      />
    )
    expect(screen.getByText('Line Entity')).toBeInTheDocument()
  })

  it('opens change surface dialog when Change is clicked', async () => {
    const user = userEvent.setup()
    render(
      <SurfaceConfigPanel
        artifact={baseArtifact}
        onChangeSurface={vi.fn()}
        onUpdateContextContract={vi.fn()}
      />
    )
    await user.click(screen.getByText('Change'))
    expect(screen.getByText('Change Surface Type')).toBeInTheDocument()
    expect(screen.getByText(/reset the layout/i)).toBeInTheDocument()
  })

  it('calls onChangeSurface after confirmation', async () => {
    const user = userEvent.setup()
    const onChangeSurface = vi.fn()
    render(
      <SurfaceConfigPanel
        artifact={baseArtifact}
        onChangeSurface={onChangeSurface}
        onUpdateContextContract={vi.fn()}
      />
    )
    await user.click(screen.getByText('Change'))
    // Dialog is now open — the select inside it shows available surfaces (excluding current 'list')
    const selects = screen.getAllByRole('combobox')
    const surfaceSelect = selects[selects.length - 1]
    await user.selectOptions(surfaceSelect, 'create_edit')
    await user.click(screen.getByText('Reset & Change'))
    await waitFor(() => expect(onChangeSurface).toHaveBeenCalledWith('create_edit'))
  })

  it('calls onUpdateContextContract when routeKey changes', async () => {
    const user = userEvent.setup()
    const onUpdateContextContract = vi.fn()
    render(
      <SurfaceConfigPanel
        artifact={baseArtifact}
        onChangeSurface={vi.fn()}
        onUpdateContextContract={onUpdateContextContract}
      />
    )
    const routeKeyInput = screen.getByDisplayValue('test_view')
    await user.clear(routeKeyInput)
    await user.type(routeKeyInput, 'new_route')
    await waitFor(() => expect(onUpdateContextContract).toHaveBeenCalled())
  })

  it('shows date range context checkbox for dashboard_summary', () => {
    render(
      <SurfaceConfigPanel
        artifact={{ ...baseArtifact, surfaceType: 'dashboard_summary' }}
        onChangeSurface={vi.fn()}
        onUpdateContextContract={vi.fn()}
      />
    )
    expect(screen.getByText(/date range context/i)).toBeInTheDocument()
  })

  it('shows parent entity selector for related_records surface', () => {
    render(
      <SurfaceConfigPanel
        artifact={{ ...baseArtifact, surfaceType: 'related_records' }}
        onChangeSurface={vi.fn()}
        onUpdateContextContract={vi.fn()}
      />
    )
    expect(screen.getByText('Parent Entity')).toBeInTheDocument()
    expect(screen.getByText('Relationship Name')).toBeInTheDocument()
  })
})
