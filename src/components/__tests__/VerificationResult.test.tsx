import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { VerificationResult, VerificationData } from '@/components/VerificationResult'

describe('VerificationResult Component', () => {
  const mockOnClose = vi.fn()
  const mockOnScanNext = vi.fn()

  const mockPassResult: VerificationData = {
    status: 'PASS' as const,
    productDescription: 'Test Product',
    brand: 'Test Brand',
    declaredValue: 100,
    countryOfOrigin: 'Test Country',
    extractedSerial: 'TEST123',
    extractedHsn: 'HSN123',
    hsnMatch: true,
    modelMatch: true,
    capturedImageUrl: 'https://test.com/test.jpg'
  }

  const mockFailResult: VerificationData = {
    status: 'NO_PASS' as const,
    productDescription: 'Test Product',
    brand: 'Test Brand',
    mismatchReason: 'HSN code mismatch',
    extractedSerial: 'TEST123',
    extractedHsn: 'HSN123',
    hsnMatch: false,
    modelMatch: true,
    capturedImageUrl: 'https://test.com/test.jpg'
  }

  it('displays pass result correctly', () => {
    render(
      <VerificationResult 
        result={mockPassResult} 
        onClose={mockOnClose}
        onScanNext={mockOnScanNext}
      />
    )
    
    expect(screen.getByText('VERIFICATION PASSED')).toBeInTheDocument()
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('Test Brand')).toBeInTheDocument()
  })

  it('displays fail result correctly', () => {
    render(
      <VerificationResult 
        result={mockFailResult}
        onClose={mockOnClose}
        onScanNext={mockOnScanNext}
      />
    )
    
    expect(screen.getByText(/HSN code mismatch/i)).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    render(
      <VerificationResult 
        result={mockPassResult}
        onClose={mockOnClose}
        onScanNext={mockOnScanNext}
      />
    )
    
    const closeButtons = screen.getAllByRole('button', { name: /close/i })
    fireEvent.click(closeButtons[0])
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('calls onScanNext when scan next button is clicked', () => {
    render(
      <VerificationResult 
        result={mockPassResult}
        onClose={mockOnClose}
        onScanNext={mockOnScanNext}
      />
    )
    
    const nextButton = screen.getByText(/scan next/i)
    fireEvent.click(nextButton)
    expect(mockOnScanNext).toHaveBeenCalled()
  })
})