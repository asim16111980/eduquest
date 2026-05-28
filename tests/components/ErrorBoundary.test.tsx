import { render, screen } from '@testing-library/react'
import { ErrorBoundary, DashboardSectionBoundary } from '@/components/shared/ErrorBoundary'

// Mock the component that throws an error
const ThrowError: React.FC = () => {
  throw new Error('Test error')
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Reset error boundary state
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders children when no error occurs', () => {
    const { container } = render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Normal content')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  it('renders error UI when child component throws error', () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  it('calls console.error when error occurs', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error caught by boundary:',
      expect.any(Error),
      expect.any(Object)
    )
  })
})

describe('DashboardSectionBoundary', () => {
  it('renders children when no error occurs', () => {
    const { container } = render(
      <DashboardSectionBoundary title="Test Section" id="test">
        <div>Section content</div>
      </DashboardSectionBoundary>
    )

    expect(screen.getByText('Test Section')).toBeInTheDocument()
    expect(screen.getByText('Section content')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  it('displays custom error message when section fails', () => {
    const { container } = render(
      <DashboardSectionBoundary title="Test Section" id="test">
        <ThrowError />
      </DashboardSectionBoundary>
    )

    expect(screen.getByText('Test Section Error')).toBeInTheDocument()
    expect(screen.getByText(/The Test Section is currently unavailable/)).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  it('includes section id in error boundary', () => {
    const { container } = render(
      <DashboardSectionBoundary title="Test" id="test-id">
        <ThrowError />
      </DashboardSectionBoundary>
    )

    const errorBoundary = container.firstChild
    expect(errorBoundary).toHaveAttribute('data-section-id', 'test-id')
  })
})