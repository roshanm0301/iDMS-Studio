import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { UIStudioEditorPage } from '../../../pages/ui-studio/UIStudioEditorPage'
import { resetMockViewRepository } from '../../../mocks/ui-studio/mockViewRepository'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/admin/ui-studio/editor/view-customer-list']}>
        <Routes>
          <Route path="/admin/ui-studio/editor/:viewId" element={<>{children}</>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => { resetMockViewRepository() })

describe('UIStudioEditorPage (M2)', () => {
  it('renders editor toolbar with view name after loading', async () => {
    render(<UIStudioEditorPage />, { wrapper })
    await waitFor(() => expect(screen.getByText('Customer List')).toBeInTheDocument(), { timeout: 3000 })
  })

  it('shows Surface and Tools tabs in left panel', async () => {
    render(<UIStudioEditorPage />, { wrapper })
    await waitFor(() => screen.getByText('Customer List'))
    // Multiple 'Surface' texts may exist (tab + section heading) — at least 1 is enough
    expect(screen.getAllByText('Surface').length).toBeGreaterThan(0)
    expect(screen.getByText('Tools')).toBeInTheDocument()
  })

  it('shows surface type in toolbar', async () => {
    render(<UIStudioEditorPage />, { wrapper })
    await waitFor(() => screen.getByText('Customer List'))
    // Multiple 'List' texts may appear (toolbar badge + canvas) — at least 1 is enough
    expect(screen.getAllByText('List').length).toBeGreaterThan(0)
  })

  it('shows Inspector panel on the right', async () => {
    render(<UIStudioEditorPage />, { wrapper })
    await waitFor(() => screen.getByText('Customer List'))
    expect(screen.getByText('Inspector')).toBeInTheDocument()
  })

  it('shows Save Draft button', async () => {
    render(<UIStudioEditorPage />, { wrapper })
    await waitFor(() => screen.getByText('Save Draft'))
    expect(screen.getByText('Save Draft')).toBeInTheDocument()
  })

  it('switches to Tools tab when clicked', async () => {
    const user = userEvent.setup()
    render(<UIStudioEditorPage />, { wrapper })
    await waitFor(() => screen.getByText('Customer List'))
    await user.click(screen.getByText('Tools'))
    expect(screen.getByText('Smart CRUD Scaffold')).toBeInTheDocument()
  })

  it('shows SurfaceConfigPanel surface type and context contract', async () => {
    render(<UIStudioEditorPage />, { wrapper })
    await waitFor(() => screen.getByText('Customer List'))
    expect(screen.getByText('Surface Type')).toBeInTheDocument()
    expect(screen.getByText('Context Contract')).toBeInTheDocument()
  })

  it('shows error state for non-existent view', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/admin/ui-studio/editor/non-existent-id']}>
          <Routes>
            <Route path="/admin/ui-studio/editor/:viewId" element={<UIStudioEditorPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )
    await waitFor(() => expect(screen.getByText('View not found')).toBeInTheDocument(), { timeout: 3000 })
  })
})
