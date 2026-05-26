import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UIStudioListPage } from '../../../pages/ui-studio/UIStudioListPage'
import { resetMockViewRepository } from '../../../mocks/ui-studio/mockViewRepository'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => { resetMockViewRepository() })

describe('UIStudioListPage — smoke tests', () => {
  it('renders the page title', async () => {
    render(<UIStudioListPage />, { wrapper })
    await waitFor(() => expect(screen.getByText('UI Studio')).toBeInTheDocument())
  })

  it('renders the page subtitle', async () => {
    render(<UIStudioListPage />, { wrapper })
    await waitFor(() => expect(screen.getByText(/Design and publish application views/i)).toBeInTheDocument())
  })

  it('renders the New View button', async () => {
    render(<UIStudioListPage />, { wrapper })
    await waitFor(() => expect(screen.getByText('New View')).toBeInTheDocument())
  })

  it('renders view list after loading', async () => {
    render(<UIStudioListPage />, { wrapper })
    await waitFor(() => expect(screen.getByText('Customer List')).toBeInTheDocument())
  })
})
