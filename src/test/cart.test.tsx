import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { CartProvider, useCart } from '../context/CartContext'
import { AuthProvider } from '../context/AuthContext'
import type { Product } from '../types'
import type { ReactNode } from 'react'

const mockProduct: Product = {
  id: 'vib-001',
  name: 'Luna',
  slug: 'luna',
  description: 'Vibrador bullet de precisión',
  longDescription: 'Descripción larga',
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

function wrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  )
}

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    expect(result.current.items).toHaveLength(0)
    expect(result.current.totalItems).toBe(0)
    expect(result.current.totalPrice).toBe(0)
  })

  it('adds item to cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem(mockProduct))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].product.id).toBe('vib-001')
    expect(result.current.items[0].quantity).toBe(1)
    expect(result.current.totalItems).toBe(1)
    expect(result.current.totalPrice).toBe(1290)
  })

  it('increments quantity when adding existing item', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem(mockProduct))
    act(() => result.current.addItem(mockProduct, 2))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(3)
    expect(result.current.totalItems).toBe(3)
  })

  it('caps quantity at 99', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem(mockProduct, 99))
    act(() => result.current.addItem(mockProduct, 1))
    expect(result.current.items[0].quantity).toBe(99)
  })

  it('removes item from cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem(mockProduct))
    expect(result.current.items).toHaveLength(1)
    act(() => result.current.removeItem('vib-001'))
    expect(result.current.items).toHaveLength(0)
  })

  it('updates quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem(mockProduct))
    act(() => result.current.updateQuantity('vib-001', 5))
    expect(result.current.items[0].quantity).toBe(5)
    expect(result.current.totalPrice).toBe(1290 * 5)
  })

  it('removes item when updating quantity to 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem(mockProduct))
    act(() => result.current.updateQuantity('vib-001', 0))
    expect(result.current.items).toHaveLength(0)
  })

  it('removes item when updating quantity to negative', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem(mockProduct))
    act(() => result.current.updateQuantity('vib-001', -1))
    expect(result.current.items).toHaveLength(0)
  })

  it('clears cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem(mockProduct))
    act(() => result.current.clearCart())
    expect(result.current.items).toHaveLength(0)
    expect(result.current.totalItems).toBe(0)
  })

  it('persists cart to localStorage', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem(mockProduct))
    const saved = JSON.parse(localStorage.getItem('discretastore-cart') || '[]')
    expect(saved).toHaveLength(1)
    expect(saved[0].product.id).toBe('vib-001')
  })
})
