import { Product, Nutriments } from './types';

const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.net/api/v2/product';
const REQUEST_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 2;

/**
 * Safely parse a value as a number.
 * OFf mixes numbers, strings ("g", "kcal", "~"), and null in the nutriments object.
 * Returns undefined for anything that isn't a finite number.
 */
export function toNum(v: unknown): number | undefined {
  if (v == null) return undefined;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return isFinite(n) ? n : undefined;
}

/**
 * Normalize raw nutriments from Open Food Facts into our clean Nutriments shape.
 *
 * Problems in the raw OFf response this fixes:
 *  1. Field names use dashes  e.g. "saturated-fat_100g" — we map to underscores.
 *  2. Every field has sibling "_unit", "_modifier", "_value" strings mixed in
 *     (e.g. carbohydrates_unit = "g") — toNum() strips these safely.
 *  3. energy_100g is in kJ; we prefer energy-kcal_100g for kcal display.
 *  4. Some products store sodium/salt in mg instead of g (dirty data);
 *     we detect this and convert (>10 g sodium per 100g is impossible).
 */
export function normalizeNutriments(raw: Record<string, unknown>): Nutriments {
  // Energy: prefer the explicit kcal field; fall back to converting kJ
  const energyKcalRaw = toNum(raw['energy-kcal_100g']);
  const energyKjRaw = toNum(raw['energy_100g']); // energy_100g is always kJ in OFf
  const energyKcal =
    energyKcalRaw != null ? energyKcalRaw
    : energyKjRaw != null ? energyKjRaw / 4.184
    : undefined;

  // Saturated fat: OFf uses a dash in the field name
  const satFat = toNum(raw['saturated-fat_100g']) ?? toNum(raw['saturated_fat_100g']);

  // Sodium/salt: OFf spec = grams, but dirty data sometimes stores mg.
  // >10 g sodium per 100g is physiologically impossible → must be mg.
  let sodium = toNum(raw['sodium_100g']);
  if (sodium != null && sodium > 10) sodium = sodium / 1000;

  let salt = toNum(raw['salt_100g']);
  if (salt != null && salt > 25) salt = salt / 1000;

  // Fruits/vegetables/nuts: OFf uses dashes in some field variants
  const fruitsVeg =
    toNum(raw['fruits-vegetables-nuts_100g']) ??
    toNum(raw['fruits_vegetables_nuts_100g']) ??
    toNum(raw['fruits-vegetables-legumes-estimate-from-ingredients_100g']) ??
    toNum(raw['fruits-vegetables-nuts-estimate-from-ingredients_100g']);

  return {
    energy_100g:           energyKcal != null ? Math.round(energyKcal) : undefined,
    proteins_100g:         toNum(raw['proteins_100g']),
    carbohydrates_100g:    toNum(raw['carbohydrates_100g']),
    sugars_100g:           toNum(raw['sugars_100g']),
    fat_100g:              toNum(raw['fat_100g']),
    saturated_fat_100g:    satFat,
    fiber_100g:            toNum(raw['fiber_100g']),
    sodium_100g:           sodium,
    salt_100g:             salt,
    fruits_vegetables_nuts_100g: fruitsVeg,
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly type: 'network' | 'http' | 'rate-limit' | 'timeout' | 'not-found' | 'unknown'
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithTimeout(
  url: string,
  timeoutMs = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // NOTE: Do NOT set User-Agent in browser fetch — it is a forbidden header
    // and causes CORS preflight failures on some CDNs/proxies.
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } catch (error) {
    if (
      error instanceof DOMException && error.name === 'AbortError'
    ) {
      throw new ApiError(
        'Request timed out. Please check your connection and try again.',
        'timeout'
      );
    }
    // TypeError covers "Failed to fetch", "Network request failed", etc.
    if (error instanceof TypeError) {
      throw new ApiError(
        'Unable to reach the food database. Please check your internet connection.',
        'network'
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Fetch with automatic retry on transient failures. */
async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchWithTimeout(url);
    } catch (err) {
      if (err instanceof ApiError) {
        // Don't retry timeout or rate-limit errors
        if (err.type === 'timeout' || err.type === 'rate-limit') throw err;
        // Don't retry on the last attempt
        if (attempt === retries) throw err;
        // Wait before retrying (exponential backoff: 500ms, 1000ms)
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        lastError = err;
      } else {
        throw err;
      }
    }
  }
  throw lastError ?? new ApiError('Unknown error', 'unknown');
}

export async function lookupProduct(barcode: string): Promise<Product | null> {
  try {
    const response = await fetchWithRetry(
      `${OPEN_FOOD_FACTS_API}/${barcode}.json` +
      `?fields=code,product_name,brands,image_front_url,image_nutrition_url,` +
      `nutriments,ingredients_text,nova_group,nutriscore_grade,nutriscore_score,` +
      `categories,labels,countries_tags`
    );

    if (response.status === 429) {
      throw new ApiError(
        'Too many requests. Please wait a moment before trying again.',
        'rate-limit'
      );
    }

    if (!response.ok) {
      if (response.status === 404) {
        return null; // product not in database — not an error
      }
      throw new ApiError(
        `Server error (${response.status}). Please try again later.`,
        'http'
      );
    }

    const data = await response.json();

    if (data.status === 0 || !data.product) {
      return null;
    }

    const product = data.product as Product & { nutriments: Record<string, unknown> };
    product.nutriments = normalizeNutriments(product.nutriments ?? {});
    return product as Product;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Error fetching product:', error);
    throw new ApiError(
      'Something unexpected happened while looking up the product.',
      'unknown'
    );
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const response = await fetchWithRetry(
      `https://world.openfoodfacts.net/api/v2/search` +
      `?query=${encodeURIComponent(query)}` +
      `&countries_tags_en=india` +
      `&fields=code,product_name,brands,image_front_url,nutriments,nova_group` +
      `&page_size=10`
    );

    if (response.status === 429) {
      throw new ApiError(
        'Too many requests. Please wait a moment before trying again.',
        'rate-limit'
      );
    }

    if (!response.ok) {
      throw new ApiError(
        `Search failed (${response.status}). Please try again later.`,
        'http'
      );
    }

    const data = await response.json();
    const products = (data.products ?? []) as Array<Product & { nutriments: Record<string, unknown> }>;
    // Normalize nutriments for all search results too
    return products.map((p) => {
      p.nutriments = normalizeNutriments(p.nutriments ?? {});
      return p as Product;
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Error searching products:', error);
    throw new ApiError(
      'Unable to search for products. Please check your connection.',
      'network'
    );
  }
}
