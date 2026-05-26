import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { UIStudioListPage } from '../../../pages/ui-studio/UIStudioListPage'

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('UIStudioListPage — M0 placeholder', () => {
  it('renders the page title', () => {
    renderWithRouter(<UIStudioListPage />)
    expect(screen.getByText('UI Studio')).toBeInTheDocument()
  })

  it('renders the page subtitle', () => {
    renderWithRouter(<UIStudioListPage />)
    expect(screen.getByText(/Design and manage application views/i)).toBeInTheDocument()
  })

  it('renders the New View button', () => {
    renderWithRouter(<UIStudioListPage />)
    expect(screen.getByText('New View')).toBeInTheDocument()
  })

  it('renders the placeholder empty state', () => {
    renderWithRouter(<UIStudioListPage />)
    expect(screen.getByText(/UI Studio — Coming Soon/i)).toBeInTheDocument()
  })
})
