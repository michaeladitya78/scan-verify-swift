import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

// Mock Firebase integration
vi.mock('@/integrations/firebase/client', () => ({
  auth: {
    currentUser: { uid: '123' }
  },
  storage: {}
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback({ uid: '123' })
    return () => {}
  }),
  signOut: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn().mockResolvedValue({}),
  getDownloadURL: vi.fn().mockResolvedValue('https://test.com/test.jpg')
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
    expect(screen.getByText('Enable Camera')).toBeInTheDocument()
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
      enumerateDevices: vi.fn().mockResolvedValue([{ kind: 'videoinput' }]),
      getUserMedia: vi.fn().mockResolvedValue({
        getVideoTracks: () => [{
          getCapabilities: () => ({ torch: true }),
          applyConstraints: vi.fn().mockResolvedValue(undefined),
          stop: vi.fn()
        }],
        getTracks: () => [{
          stop: vi.fn()
        }]
      })
    }
    
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: mockMediaDevices,
      writable: true,
      configurable: true
    })
  })

  it('activates camera when button is clicked', async () => {
    render(
      <BrowserRouter>
        <Scanner />
      </BrowserRouter>
    )
    
    const activateButton = screen.getByText('Enable Camera')
    fireEvent.click(activateButton)
    
    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled()
    })
  })
})