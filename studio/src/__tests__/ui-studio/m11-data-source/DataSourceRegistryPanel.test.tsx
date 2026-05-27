import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataSourceRegistryPanel } from '../../../components/ui-studio/data-binding/DataSourceRegistryPanel'
import type { ViewArtifact } from '../../../types/ui-studio/index'

const baseArtifact: ViewArtifact = {
  id: 'v1', viewKey: 'test', label: 'Test', surfaceType: 'list',
  primaryEntityId: 'entity-customer', status: 'draft', version: 1,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  layout: { containers: [] }, components: [], dataSources: [], bindings: [], actions: [], behaviorRules: [],
}

const withSources: ViewArtifact = {
  ...baseArtifact,
  dataSources: [
    { id: 'ds1', sourceType: 'primary_entity', entityId: 'entity-customer', filters: [] },
    { id: 'ds2', sourceType: 'related_entity', entityId: 'entity-product', filters: [{ field: 'status', operator: 'eq', value: 'active' }] },
  ],
}

describe('DataSourceRegistryPanel (M11)', () => {
  it('shows empty state when no data sources', () => {
    render(<DataSourceRegistryPanel artifact={baseArtifact} onChange={vi.fn()} />)
    expect(screen.getByText(/No data sources/i)).toBeInTheDocument()
  })
  it('shows Add Data Source button', () => {
    render(<DataSourceRegistryPanel artifact={baseArtifact} onChange={vi.fn()} />)
    expect(screen.getByText(/Add.*Source/i)).toBeInTheDocument()
  })
  it('shows existing data sources', () => {
    render(<DataSourceRegistryPanel artifact={withSources} onChange={vi.fn()} />)
    expect(screen.getAllByText(/primary_entity|related_entity/i).length).toBeGreaterThan(0)
  })
  it('calls onChange when Add Source clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DataSourceRegistryPanel artifact={baseArtifact} onChange={onChange} />)
    await user.click(screen.getByText(/Add.*Source/i))
    await waitFor(() => expect(onChange).toHaveBeenCalled())
  })
})
