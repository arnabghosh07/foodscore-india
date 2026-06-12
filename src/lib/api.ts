import { Product } from './types';

const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v2/product';

export async function lookupProduct(barcode: string): Promise<Product | null> {
  try {
    const response = await fetch(
      `${OPEN_FOOD_FACTS_API}/${barcode}.json?fields=code,product_name,brands,image_front_url,image_nutrition_url,nutriments,ingredients_text,nova_group,nutriscore_grade,nutriscore_score,categories,labels,countries_tags`,
      {
        headers: {
          'User-Agent': 'FoodScore-India/1.0 (https://github.com/foodscore-india)',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 0 || !data.product) {
      return null;
    }

    return data.product as Product;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&fields=code,product_name,brands,image_front_url,nutriments,nova_group&page_size=10`,
      {
        headers: {
          'User-Agent': 'FoodScore-India/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return (data.products || []) as Product[];
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
}
