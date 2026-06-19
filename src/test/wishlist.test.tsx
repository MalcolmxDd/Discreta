import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { WishlistProvider, useWishlist } from '../context/WishlistContext'
import { AuthProvider } from '../context/AuthContext'
import type { ReactNode } from 'react'

function wrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <WishlistProvider>{children}</WishlistProvider>
    </AuthProvider>
  )
}

describe('WishlistContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with empty wishlist', () => {
    const { result } = renderHook(() => useWishlist(), { wrapper })
    expect(result.current.favorites).toHaveLength(0)
    expect(result.current.isFavorite('any')).toBe(false)
  })

  it('toggles favorite on', () => {
    const { result } = renderHook(() => useWishlist(), { wrapper })
    act(() => result.current.toggleFavorite('vib-001'))
    expect(result.current.favorites).toHaveLength(1)
    expect(result.current.favorites[0]).toBe('vib-001')
    expect(result.current.isFavorite('vib-001')).toBe(true)
  })

  it('toggles favorite off', () => {
    const { result } = renderHook(() => useWishlist(), { wrapper })
    act(() => result.current.toggleFavorite('vib-001'))
    expect(result.current.isFavorite('vib-001')).toBe(true)
    act(() => result.current.toggleFavorite('vib-001'))
    expect(result.current.isFavorite('vib-001')).toBe(false)
    expect(result.current.favorites).toHaveLength(0)
  })

  it('supports multiple favorites', () => {
    const { result } = renderHook(() => useWishlist(), { wrapper })
    act(() => result.current.toggleFavorite('vib-001'))
    act(() => result.current.toggleFavorite('vib-002'))
    act(() => result.current.toggleFavorite('dil-001'))
    expect(result.current.favorites).toHaveLength(3)
  })

  it('persists to localStorage for guest users', () => {
    const { result } = renderHook(() => useWishlist(), { wrapper })
    act(() => result.current.toggleFavorite('vib-001'))
    const saved = JSON.parse(localStorage.getItem('discretastore-wishlist') || '[]')
    expect(saved).toEqual(['vib-001'])
  })
})
