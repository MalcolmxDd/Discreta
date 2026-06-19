import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchReviewsByProduct, submitReview } from '../api/reviews'

const mockReviewsResponse = {
  reviews: [
    { id: 'rev-1', productId: 'vib-001', userName: 'Ana', rating: 5, comment: 'Excelente', date: '2026-01-15' },
    { id: 'rev-2', productId: 'vib-001', userName: 'Luis', rating: 4, comment: 'Bueno', date: '2026-02-10' },
  ],
  average: 4.5,
  total: 2,
  distribution: { 5: 1, 4: 1, 3: 0, 2: 0, 1: 0 },
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('fetchReviewsByProduct', () => {
  it('fetches reviews for a product and returns mapped data', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockReviewsResponse }),
    } as Response)

    const result = await fetchReviewsByProduct('vib-001')

    expect(result.reviews).toHaveLength(2)
    expect(result.average).toBe(4.5)
    expect(result.total).toBe(2)
    expect(result.reviews[0].userName).toBe('Ana')
    expect(result.reviews[1].rating).toBe(4)
  })

  it('returns distribution counts', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockReviewsResponse }),
    } as Response)

    const result = await fetchReviewsByProduct('vib-001')

    expect(result.distribution[5]).toBe(1)
    expect(result.distribution[1]).toBe(0)
  })

  it('returns empty reviews array when no reviews exist', async () => {
    const emptyResponse = {
      reviews: [],
      average: 0,
      total: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: emptyResponse }),
    } as Response)

    const result = await fetchReviewsByProduct('nonexistent')

    expect(result.reviews).toHaveLength(0)
    expect(result.total).toBe(0)
    expect(result.average).toBe(0)
  })
})

describe('submitReview', () => {
  it('submits a review and returns the mapped review', async () => {
    const newReview = { id: 'rev-3', productId: 'vib-001', userName: 'Test', rating: 5, comment: 'Great', date: '2026-06-18' }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: newReview }),
    } as Response)

    const result = await submitReview({ productId: 'vib-001', userName: 'Test', rating: 5, comment: 'Great' })

    expect(result.id).toBe('rev-3')
    expect(result.userName).toBe('Test')
    expect(result.rating).toBe(5)
  })

  it('calls POST /reviews with correct payload', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { id: 'rev-4', productId: 'vib-001', userName: 'User', rating: 3, comment: 'Ok', date: '2026-06-18' } }),
    } as Response)

    await submitReview({ productId: 'vib-001', userName: 'User', rating: 3, comment: 'Ok', userId: null })

    const callUrl = mockFetch.mock.calls[0][0] as string
    const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string)

    expect(callUrl).toContain('/reviews')
    expect(callBody.productId).toBe('vib-001')
    expect(callBody.rating).toBe(3)
  })

  it('handles API errors gracefully', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Comentario requerido' }),
    } as Response)

    await expect(submitReview({ productId: 'vib-001', userName: 'User', rating: 1, comment: '' })).rejects.toThrow()
  })
})
