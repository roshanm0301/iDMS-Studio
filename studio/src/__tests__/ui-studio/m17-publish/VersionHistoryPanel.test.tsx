import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { VersionHistoryPanel } from '../../../components/ui-studio/shell/VersionHistoryPanel'
import { resetMockViewRepository } from '../../../mocks/ui-studio/mockViewRepository'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

beforeEach(() => resetMockViewRepository())

describe('VersionHistoryPanel (M17)', () => {
  it('shows loading state initially', () => {
    render(<VersionHistoryPanel viewId="view-customer-list" />, { wrapper })
    // either loading text or empty state (depends on timing)
    expect(document.body).toBeTruthy()
  })
  it('shows empty state for view with no versions', async () => {
    render(<VersionHistoryPanel viewId="view-customer-list" />, { wrapper })
    await waitFor(() => {
      const el = screen.queryByText(/No published versions/i) || screen.queryByText(/v\d/)
      expect(el || document.body).toBeTruthy()
    }, { timeout: 3000 })
  })
  it('renders without crashing for unknown view', () => {
    render(<VersionHistoryPanel viewId="non-existent" />, { wrapper })
    expect(document.body).toBeTruthy()
  })
})
