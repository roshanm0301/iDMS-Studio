import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BehaviorRuleListPanel } from '../../../components/ui-studio/behavior/BehaviorRuleListPanel'
import type { ViewArtifact } from '../../../types/ui-studio/index'

const baseArtifact: ViewArtifact = {
  id: 'v1', viewKey: 'test', label: 'Test', surfaceType: 'create_edit',
  primaryEntityId: 'entity-saleorder', status: 'draft', version: 1,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  layout: { containers: [] }, components: [], dataSources: [], bindings: [], actions: [],
  behaviorRules: [],
}

const withRules: ViewArtifact = {
  ...baseArtifact,
  behaviorRules: [
    { id: 'r1', label: 'Admin sees delete', conditions: [{ type: 'role', value: 'Admin' }], effect: { type: 'show' }, targetIds: ['action-delete'] },
    { id: 'r2', label: 'Hide field on mobile', conditions: [{ type: 'device', value: 'mobile' }], effect: { type: 'hide' }, targetIds: ['f-so-remarks'] },
  ],
}

describe('BehaviorRuleListPanel (M12)', () => {
  it('shows empty state when no rules', () => {
    render(<BehaviorRuleListPanel artifact={baseArtifact} onChange={vi.fn()} />)
    expect(screen.getByText(/No behavior rules/i)).toBeInTheDocument()
  })
  it('shows Add Rule button', () => {
    render(<BehaviorRuleListPanel artifact={baseArtifact} onChange={vi.fn()} />)
    expect(screen.getByText(/Add Rule/i)).toBeInTheDocument()
  })
  it('shows existing rules', () => {
    render(<BehaviorRuleListPanel artifact={withRules} onChange={vi.fn()} />)
    expect(screen.getByText('Admin sees delete')).toBeInTheDocument()
    expect(screen.getByText('Hide field on mobile')).toBeInTheDocument()
  })
  it('calls onChange when Add Rule clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<BehaviorRuleListPanel artifact={baseArtifact} onChange={onChange} />)
    await user.click(screen.getByText(/Add Rule/i))
    await waitFor(() => expect(onChange).toHaveBeenCalled())
  })
  it('shows effect badge for each rule', () => {
    render(<BehaviorRuleListPanel artifact={withRules} onChange={vi.fn()} />)
    expect(screen.getAllByText(/show|hide/i).length).toBeGreaterThan(0)
  })
})
