import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { WishlistProvider } from '../context/WishlistContext'
import { CartProvider } from '../context/CartContext'
import { ToastProvider } from '../context/ToastContext'
import { AuthProvider } from '../context/AuthContext'
import ProductCard from '../components/ProductCard'
import type { Product } from '../types'
import type { ReactNode } from 'react'

const mockProduct: Product = {
  id: 'vib-001',
  name: 'Luna',
  slug: 'luna',
  description: 'Vibrador bullet de precisión con 10 modos',
  longDescription: 'Descripción larga de prueba',
  price: 1290,
  images: ['https://picsum.photos/seed/luna/400/400'],
  gradient: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
  category: 'vibradores',
  tags: ['bullet', 'silicona'],
  rating: 4.5,
  inStock: true,
  stockCount: 25,
  features: ['10 modos', 'Silicona'],
}

const mockProductWithDiscount: Product = {
  ...mockProduct,
  id: 'vib-002',
  name: 'Gema',
  slug: 'gema',
  price: 1890,
  originalPrice: 2290,
  rating: 4.8,
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>{children}</WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  )
}

describe('ProductCard', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders product name', () => {
    render(<ProductCard product={mockProduct} />, { wrapper })
    expect(screen.getByText('Luna')).toBeDefined()
  })

  it('renders product price', () => {
    render(<ProductCard product={mockProduct} />, { wrapper })
    expect(screen.getByText('$1.290')).toBeDefined()
  })

  it('renders category', () => {
    render(<ProductCard product={mockProduct} />, { wrapper })
    expect(screen.getByText('vibradores')).toBeDefined()
  })

  it('renders rating', () => {
    render(<ProductCard product={mockProduct} />, { wrapper })
    expect(screen.getByText('4.5')).toBeDefined()
  })

  it('renders discount badge when originalPrice exists', () => {
    render(<ProductCard product={mockProductWithDiscount} />, { wrapper })
    expect(screen.getByText('-17%')).toBeDefined()
  })

  it('renders original price when discount exists', () => {
    render(<ProductCard product={mockProductWithDiscount} />, { wrapper })
    expect(screen.getByText('$2.290')).toBeDefined()
  })

  it('links to product detail page', () => {
    render(<ProductCard product={mockProduct} />, { wrapper })
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/productos/luna')
  })

  it('renders lazy loading image', () => {
    render(<ProductCard product={mockProduct} />, { wrapper })
    const img = screen.getByAltText('Luna')
    expect(img.getAttribute('loading')).toBe('lazy')
  })

  it('does not show discount badge when no originalPrice', () => {
    render(<ProductCard product={mockProduct} />, { wrapper })
    // Should not find a badge with % (the discount badge)
    const badges = screen.queryAllByText(/-?\d+%/);
    expect(badges.length).toBe(0)
  })
})
