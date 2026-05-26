import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { CreateViewDraftDialog } from '../../../components/ui-studio/shell/CreateViewDraftDialog'
import { resetMockViewRepository } from '../../../mocks/ui-studio/mockViewRepository'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => { resetMockViewRepository() })

describe('CreateViewDraftDialog', () => {
  it('renders dialog content when open', () => {
    render(<CreateViewDraftDialog open={true} onOpenChange={() => undefined} />, { wrapper })
    expect(screen.getByText('Create New View')).toBeInTheDocument()
    expect(screen.getByLabelText('View Label *')).toBeInTheDocument()
    expect(screen.getByLabelText('View Key *')).toBeInTheDocument()
  })

  it('shows validation error when label is empty', async () => {
    const user = userEvent.setup()
    render(<CreateViewDraftDialog open={true} onOpenChange={() => undefined} />, { wrapper })
    await user.click(screen.getByText('Create Draft'))
    await waitFor(() => expect(screen.getByText('Label is required')).toBeInTheDocument())
  })

  it('shows validation error for invalid view key', async () => {
    const user = userEvent.setup()
    render(<CreateViewDraftDialog open={true} onOpenChange={() => undefined} />, { wrapper })
    await user.type(screen.getByLabelText('View Label *'), 'My View')
    await user.clear(screen.getByLabelText('View Key *'))
    await user.type(screen.getByLabelText('View Key *'), 'invalid key!')
    await user.click(screen.getByText('Create Draft'))
    await waitFor(() => expect(screen.getByText(/Letters, digits, underscores only/)).toBeInTheDocument())
  })

  it('auto-fills view key from label on blur', async () => {
    const user = userEvent.setup()
    render(<CreateViewDraftDialog open={true} onOpenChange={() => undefined} />, { wrapper })
    const labelInput = screen.getByLabelText('View Label *')
    await user.type(labelInput, 'My Test View')
    await user.tab()
    await waitFor(() => {
      const keyInput = screen.getByLabelText('View Key *') as HTMLInputElement
      expect(keyInput.value).toBe('my_test_view')
    })
  })

  it('creates a view and calls onCreated', async () => {
    const user = userEvent.setup()
    const onCreated = vi.fn()
    const onOpenChange = vi.fn()
    render(<CreateViewDraftDialog open={true} onOpenChange={onOpenChange} onCreated={onCreated} />, { wrapper })
    await user.type(screen.getByLabelText('View Label *'), 'Test View')
    await user.tab()
    await user.click(screen.getByText('Create Draft'))
    await waitFor(() => expect(onCreated).toHaveBeenCalled(), { timeout: 2000 })
  })

  it('shows server error when viewKey is duplicate', async () => {
    const user = userEvent.setup()
    render(<CreateViewDraftDialog open={true} onOpenChange={() => undefined} />, { wrapper })
    const labelInput = screen.getByLabelText('View Label *')
    await user.type(labelInput, 'Customer List Dup')
    const keyInput = screen.getByLabelText('View Key *')
    await user.clear(keyInput)
    await user.type(keyInput, 'customer_list')
    await user.click(screen.getByText('Create Draft'))
    await waitFor(() => expect(screen.getByText(/already in use/)).toBeInTheDocument(), { timeout: 2000 })
  })
})
