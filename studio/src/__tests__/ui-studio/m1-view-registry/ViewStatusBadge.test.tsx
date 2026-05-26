import { render, screen } from '@testing-library/react'
import { ViewStatusBadge } from '../../../components/ui-studio/common/ViewStatusBadge'

describe('ViewStatusBadge', () => {
  it('renders Draft label', () => {
    render(<ViewStatusBadge status="draft" />)
    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  it('renders Published label', () => {
    render(<ViewStatusBadge status="published" />)
    expect(screen.getByText('Published')).toBeInTheDocument()
  })

  it('renders Needs Attention label', () => {
    render(<ViewStatusBadge status="needs_attention" />)
    expect(screen.getByText('Needs Attention')).toBeInTheDocument()
  })

  it('applies amber class for draft', () => {
    const { container } = render(<ViewStatusBadge status="draft" />)
    expect(container.firstChild).toHaveClass('amber')
  })

  it('applies green class for published', () => {
    const { container } = render(<ViewStatusBadge status="published" />)
    expect(container.firstChild).toHaveClass('green')
  })

  it('applies red class for needs_attention', () => {
    const { container } = render(<ViewStatusBadge status="needs_attention" />)
    expect(container.firstChild).toHaveClass('red')
  })
})
