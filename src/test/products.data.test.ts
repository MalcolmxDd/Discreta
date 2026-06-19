import { describe, it, expect } from 'vitest'
import { PRICE_MAX, PRICE_STEP, CHILEAN_REGIONS, ROUTES, EXTREME_REGIONS, SHIPPING_COST_RM, SHIPPING_COST_REGIONS, SHIPPING_COST_EXTREME } from '../constants'
import { categoryIcons, categoryIconsSmall } from '../data/categories'

describe('Constants', () => {
  it('PRICE_MAX is greater than 0', () => {
    expect(PRICE_MAX).toBeGreaterThan(0)
  })

  it('PRICE_STEP is greater than 0', () => {
    expect(PRICE_STEP).toBeGreaterThan(0)
  })

  it('CHILEAN_REGIONS contains Región Metropolitana', () => {
    expect(CHILEAN_REGIONS).toContain('Región Metropolitana')
  })

  it('CHILEAN_REGIONS has at least 16 regions', () => {
    expect(CHILEAN_REGIONS.length).toBeGreaterThanOrEqual(16)
  })

  it('EXTREME_REGIONS has 3 regions', () => {
    expect(EXTREME_REGIONS).toHaveLength(3)
    expect(EXTREME_REGIONS).toContain('Región de Magallanes')
    expect(EXTREME_REGIONS).toContain('Región de Aysén')
    expect(EXTREME_REGIONS).toContain('Región de Arica y Parinacota')
  })

  it('shipping costs are consistent', () => {
    expect(SHIPPING_COST_RM).toBe(0)
    expect(SHIPPING_COST_REGIONS).toBeGreaterThan(0)
    expect(SHIPPING_COST_EXTREME).toBeGreaterThan(0)
  })
})

describe('Category Icons', () => {
  it('has 6 categories mapped', () => {
    const keys = Object.keys(categoryIcons)
    expect(keys).toHaveLength(6)
    expect(keys).toContain('vibradores')
    expect(keys).toContain('dildos')
    expect(keys).toContain('lubricantes')
    expect(keys).toContain('parejas')
    expect(keys).toContain('lenceria')
    expect(keys).toContain('bienestar')
  })

  it('categoryIconsSmall has the same 6 categories', () => {
    expect(Object.keys(categoryIconsSmall)).toEqual(Object.keys(categoryIcons))
  })
})

describe('ROUTES', () => {
  const requiredRoutes = ['HOME', 'PRODUCTS', 'CART', 'CHECKOUT', 'WISHLIST', 'ABOUT', 'CONTACT', 'FAQ', 'LOGIN', 'REGISTER', 'ORDER_STATUS', 'ACCOUNT', 'ADMIN']

  for (const key of requiredRoutes) {
    it(`has route ${key}`, () => {
      expect(ROUTES).toHaveProperty(key)
    })
  }

  it('HOME is /', () => {
    expect(ROUTES.HOME).toBe('/')
  })

  it('PRODUCTS is /productos', () => {
    expect(ROUTES.PRODUCTS).toBe('/productos')
  })
})
