import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { UIStudioListPage } from '../../../pages/ui-studio/UIStudioListPage'
import { resetMockViewRepository } from '../../../mocks/ui-studio/mockViewRepository'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/admin/ui-studio']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => { resetMockViewRepository() })

describe('UIStudioListPage', () => {
  it('renders page title', async () => {
    render(<UIStudioListPage />, { wrapper })
    await waitFor(() => expect(screen.getByText('UI Studio')).toBeInTheDocument())
  })

  it('shows seeded views in the table after loading', async () => {
    render(<UIStudioListPage />, { wrapper })
    await waitFor(() => expect(screen.getByText('Customer List')).toBeInTheDocument())
    expect(screen.getByText('Customer Detail')).toBeInTheDocument()
    expect(screen.getByText('Sale Order Entry')).toBeInTheDocument()
  })

  it('shows New View button', async () => {
    render(<UIStudioListPage />, { wrapper })
    await waitFor(() => expect(screen.getByText('New View')).toBeInTheDocument())
  })

  it('filters views by search text', async () => {
    const user = userEvent.setup()
    render(<UIStudioListPage />, { wrapper })
    await waitFor(() => screen.getByText('Customer List'))
    const searchInput = screen.getByPlaceholderText('Search views…')
    await user.type(searchInput, 'customer')
    expect(screen.getByText('Customer List')).toBeInTheDocument()
    expect(screen.getByText('Customer Detail')).toBeInTheDocument()
    expect(screen.queryByText('Product Master')).not.toBeInTheDocument()
  })

  it('filters views by status', async () => {
    const user = userEvent.setup()
    render(<UIStudioListPage />, { wrapper })
    await waitFor(() => screen.getByText('Customer List'))
    const statusSelect = screen.getByDisplayValue('All Status')
    await user.selectOptions(statusSelect, 'draft')
    expect(screen.getByText('Product Master')).toBeInTheDocument()
    expect(screen.queryByText('Customer List')).not.toBeInTheDocument()
  })

  it('shows empty state when no views match filter', async () => {
    const user = userEvent.setup()
    render(<UIStudioListPage />, { wrapper })
    await waitFor(() => screen.getByText('Customer List'))
    const searchInput = screen.getByPlaceholderText('Search views…')
    await user.type(searchInput, 'zzz_no_match_xyz')
    expect(screen.getByText('No views match your filters')).toBeInTheDocument()
  })

  it('opens Create View dialog when New View is clicked', async () => {
    const user = userEvent.setup()
    render(<UIStudioListPage />, { wrapper })
    await waitFor(() => screen.getByText('New View'))
    await user.click(screen.getByText('New View'))
    expect(screen.getByText('Create New View')).toBeInTheDocument()
  })

  it('shows surface type filter chips and count', async () => {
    render(<UIStudioListPage />, { wrapper })
    await waitFor(() => screen.getByText('Customer List'))
    // Surface chips strip: "All 5", "List 2", "Transaction 1", etc.
    expect(screen.getByText(/^All$/)).toBeInTheDocument()
    // At least one chip should exist for a surface with views
    const chips = document.querySelectorAll('.filter-chip')
    expect(chips.length).toBeGreaterThan(1)
  })
})
