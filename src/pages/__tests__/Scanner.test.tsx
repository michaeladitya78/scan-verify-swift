import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Scanner from '../Scanner'

// Mock navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: '123' } } } }),
      signOut: vi.fn()
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test.jpg' } }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/test.jpg' } })
      })
    }
  }
}))

describe('Scanner Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders scanner interface', () => {
    render(
      <BrowserRouter>
        <Scanner />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Customs Scanner')).toBeInTheDocument()
    expect(screen.getByText('Activate Camera')).toBeInTheDocument()
  })

  it('shows manual entry button', () => {
    render(
      <BrowserRouter>
        <Scanner />
      </BrowserRouter>
    )
    
    const manualEntryButton = screen.getByText('Manual Entry')
    expect(manualEntryButton).toBeInTheDocument()
    
    fireEvent.click(manualEntryButton)
    expect(mockNavigate).toHaveBeenCalledWith('/manual-entry')
  })

  // Mock getUserMedia for camera tests
  beforeEach(() => {
    const mockMediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{
          stop: vi.fn()
        }]
      })
    }
    
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: mockMediaDevices,
      writable: true
    })
  })

  it('activates camera when button is clicked', async () => {
    render(
      <BrowserRouter>
        <Scanner />
      </BrowserRouter>
    )
    
    const activateButton = screen.getByText('Activate Camera')
    fireEvent.click(activateButton)
    
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled()
  })
})