import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchProducts, ApiError } from '@/lib/api';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function jsonResponse(body: object, init?: ResponseInit): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    ...init,
  } as Response;
}

function errorResponse(status: number, statusText = 'Error'): Response {
  return {
    ok: false,
    status,
    statusText,
    json: async () => ({ error: statusText }),
  } as Response;
}

describe('searchProducts', () => {
  describe('successful responses', () => {
    it('should return an array of products with normalized nutriments', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          products: [
            {
              code: '5901234123457',
              product_name: 'Parle-G',
              brands: 'Parle',
              image_front_url: 'https://example.com/img.jpg',
              nova_group: 4,
              nutriments: {
                sugars_100g: 30,
                'saturated-fat_100g': 5,
                sodium_100g: 0.2,
                proteins_100g: 6,
                fiber_100g: 1,
                energy_100g: 1800, // kJ
              },
            },
            {
              code: '8901234567890',
              product_name: 'Maggi Noodles',
              brands: 'Nestle',
              image_front_url: 'https://example.com/img2.jpg',
              nova_group: 4,
              nutriments: {
                sugars_100g: 4,
                'saturated-fat_100g': 8,
                sodium_100g: 0.9,
                proteins_100g: 8,
                fiber_100g: 2,
              },
            },
          ],
        })
      );

      const results = await searchProducts('biscuit');

      expect(results).toHaveLength(2);
      expect(results[0].product_name).toBe('Parle-G');
      expect(results[0].brands).toBe('Parle');
      expect(results[0].code).toBe('5901234123457');
      // Nutriments should be normalized (saturated fat mapped from dash variant)
      expect(results[0].nutriments.saturated_fat_100g).toBe(5);
      expect(results[0].nutriments.sugars_100g).toBe(30);
      // Energy should be converted from kJ to kcal: 1800 / 4.184 ≈ 430
      expect(results[0].nutriments.energy_100g).toBe(430);
    });

    it('should return empty array when no products are found', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ products: [] }));

      const results = await searchProducts('nonexistentfoodxyz123');

      expect(results).toEqual([]);
    });

    it('should handle missing products field in response', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));

      const results = await searchProducts('anything');

      expect(results).toEqual([]);
    });

    it('should handle products with empty or missing nutriments', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          products: [
            {
              code: '0000000000000',
              product_name: 'Unknown Product',
              nutriments: {},
            },
          ],
        })
      );

      const results = await searchProducts('unknown');

      expect(results).toHaveLength(1);
      expect(results[0].nutriments.sugars_100g).toBeUndefined();
      expect(results[0].nutriments.sodium_100g).toBeUndefined();
    });

    it('should encode query parameters correctly', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ products: [] }));

      await searchProducts('masala dosa mix');

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('query=masala%20dosa%20mix');
      expect(calledUrl).toContain('countries_tags_en=india');
      expect(calledUrl).toContain('page_size=10');
    });

    it('should normalize sodium from mg to g when value is unrealistically high', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          products: [
            {
              code: '1111111111111',
              product_name: 'Dirty Data Product',
              nutriments: {
                sodium_100g: 500, // stored as mg, should be converted to 0.5g
              },
            },
          ],
        })
      );

      const results = await searchProducts('dirty');

      expect(results[0].nutriments.sodium_100g).toBe(0.5);
    });

    it('should handle string nutriment values from Open Food Facts', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          products: [
            {
              code: '2222222222222',
              product_name: 'String Nutriments',
              nutriments: {
                sugars_100g: '15.5',
                proteins_100g: '3',
                fat_100g: '~10',
              },
            },
          ],
        })
      );

      const results = await searchProducts('string');

      expect(results[0].nutriments.sugars_100g).toBe(15.5);
      expect(results[0].nutriments.proteins_100g).toBe(3);
      // ~10: parseFloat("~10") is NaN → undefined
      expect(results[0].nutriments.fat_100g).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should throw ApiError with type "rate-limit" on 429', async () => {
      mockFetch.mockResolvedValueOnce(errorResponse(429));

      try {
        await searchProducts('test');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error).toMatchObject({ type: 'rate-limit' });
      }
    });

    it('should throw ApiError with type "http" on server errors', async () => {
      // HTTP status errors are thrown AFTER fetchWithRetry returns — no retry for status codes
      mockFetch.mockResolvedValueOnce(errorResponse(500));

      try {
        await searchProducts('test');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error).toMatchObject({ type: 'http' });
        expect(mockFetch).toHaveBeenCalledTimes(1);
      }
    });

    it('should throw ApiError with type "network" on fetch failure', async () => {
      // Network errors are retried by fetchWithRetry (MAX_RETRIES=2), so mock all 3 attempts
      mockFetch
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockRejectedValueOnce(new TypeError('Failed to fetch'));

      try {
        await searchProducts('test');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error).toMatchObject({ type: 'network' });
        expect(mockFetch).toHaveBeenCalledTimes(3);
      }
    });

    it('should throw ApiError with type "timeout" on AbortError', async () => {
      const abortError = new DOMException('The operation was aborted.', 'AbortError');
      mockFetch.mockRejectedValueOnce(abortError);

      try {
        await searchProducts('test');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error).toMatchObject({ type: 'timeout' });
      }
    });
  });

  describe('retry behavior', () => {
    it('should retry on network failure and succeed on second attempt', async () => {
      mockFetch
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(jsonResponse({ products: [{ code: '111', product_name: 'Retry Product', nutriments: {} }] }));

      const results = await searchProducts('retry');

      expect(results).toHaveLength(1);
      expect(results[0].product_name).toBe('Retry Product');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should NOT retry on HTTP 500 (status errors are not retried)', async () => {
      mockFetch.mockResolvedValueOnce(errorResponse(500));

      try {
        await searchProducts('test');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error).toMatchObject({ type: 'http' });
        expect(mockFetch).toHaveBeenCalledTimes(1);
      }
    });

    it('should exhaust retries and throw on persistent network failure', async () => {
      mockFetch
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(searchProducts('fail')).rejects.toThrow(ApiError);
      expect(mockFetch).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('should NOT retry on rate-limit errors (429)', async () => {
      mockFetch.mockResolvedValueOnce(errorResponse(429));

      await expect(searchProducts('test')).rejects.toThrow(ApiError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should NOT retry on timeout errors', async () => {
      const abortError = new DOMException('The operation was aborted.', 'AbortError');
      mockFetch.mockRejectedValueOnce(abortError);

      await expect(searchProducts('test')).rejects.toThrow(ApiError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
