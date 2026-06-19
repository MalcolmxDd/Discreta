import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ToastProvider } from '../context/ToastContext'
import { AuthProvider } from '../context/AuthContext'
import ReviewSection from '../components/ReviewSection'
import type { Review } from '../types'
import type { ReactNode } from 'react'

function wrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  )
}

const mockReviews: Review[] = [
  {
    id: 'rev-001',
    productId: 'vib-001',
    userName: 'Camila R.',
    rating: 5,
    comment: 'Pequeño pero poderoso.',
    date: '2026-05-15',
  },
  {
    id: 'rev-002',
    productId: 'vib-001',
    userName: 'Valentina M.',
    rating: 4,
    comment: 'Muy buen producto.',
    date: '2026-05-28',
  },
]

describe('ReviewSection', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders review section title', () => {
    render(<ReviewSection productId="vib-001" reviews={mockReviews} />, { wrapper })
    expect(screen.getByText('Reseñas')).toBeDefined()
  })

  it('renders average rating', () => {
    render(<ReviewSection productId="vib-001" reviews={mockReviews} />, { wrapper })
    expect(screen.getByText('4.5')).toBeDefined()
  })

  it('renders review count', () => {
    render(<ReviewSection productId="vib-001" reviews={mockReviews} />, { wrapper })
    expect(screen.getByText('2 reseñas')).toBeDefined()
  })

  it('renders reviewer names', () => {
    render(<ReviewSection productId="vib-001" reviews={mockReviews} />, { wrapper })
    expect(screen.getByText('Camila R.')).toBeDefined()
    expect(screen.getByText('Valentina M.')).toBeDefined()
  })

  it('renders review comments', () => {
    render(<ReviewSection productId="vib-001" reviews={mockReviews} />, { wrapper })
    expect(screen.getByText('Pequeño pero poderoso.')).toBeDefined()
    expect(screen.getByText('Muy buen producto.')).toBeDefined()
  })

  it('renders review form button', () => {
    render(<ReviewSection productId="vib-001" reviews={mockReviews} />, { wrapper })
    expect(screen.getByText('Escribir reseña')).toBeDefined()
  })

  it('shows form when clicking write review', () => {
    render(<ReviewSection productId="vib-001" reviews={mockReviews} />, { wrapper })
    fireEvent.click(screen.getByText('Escribir reseña'))
    expect(screen.getByText('Tu opinión')).toBeDefined()
    expect(screen.getByText('Publicar reseña')).toBeDefined()
  })

  it('handles empty reviews gracefully', () => {
    render(<ReviewSection productId="unknown" reviews={[]} />, { wrapper })
    expect(screen.getByText('Reseñas')).toBeDefined()
  })

  it('renders rating distribution', () => {
    render(<ReviewSection productId="vib-001" reviews={mockReviews} />, { wrapper })
    expect(screen.getByText('5★')).toBeDefined()
    expect(screen.getByText('4★')).toBeDefined()
  })

  it('submits a new review', async () => {
    render(<ReviewSection productId="vib-001" reviews={mockReviews} />, { wrapper })
    fireEvent.click(screen.getByText('Escribir reseña'))

    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByLabelText('Comentario'), {
      target: { value: 'Gran producto!' },
    })
    fireEvent.click(screen.getByText('Publicar reseña'))

    expect(screen.getByText('Test User')).toBeDefined()
    expect(screen.getByText('Gran producto!')).toBeDefined()
  })
})
