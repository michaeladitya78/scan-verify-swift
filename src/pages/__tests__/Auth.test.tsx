import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Auth from '../Auth'

// Mock navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock Firebase auth
vi.mock('@/integrations/firebase/client', () => ({
  auth: {
    currentUser: null
  }
}))

describe('Auth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sign in and sign up tabs', () => {
    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
  })

  it('shows error on invalid email format', async () => {
    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    )

    const emailInput = screen.getByPlaceholderText('officer@customs.gov')
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    
    const signInButton = screen.getByText('Sign In')
    fireEvent.click(signInButton)
    
    expect(emailInput).toBeInvalid()
  })
})