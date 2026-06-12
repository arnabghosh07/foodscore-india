import { Product, Nutriments } from './types';
import ifctRawData from '@/data/ifct_foods.json';

interface IfctFood {
  name: string;
  group: string;
  keywords: string[];
  energyKj: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar: number;
  saturatedFat: number;
  sodium: number;
}

interface IfctDatabase {
  foods: IfctFood[];
}

let ifctData: IfctDatabase | null = null;

function loadIfctData(): IfctDatabase {
  if (ifctData) return ifctData;
  try {
    ifctData = ifctRawData as IfctDatabase;
  } catch (e) {
    console.error('[IFCT] Failed to load Indian food composition data:', e);
    ifctData = { foods: [] };
  }
  return ifctData;
}

function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Search IFCT data by product name keywords.
 * Returns the best matching food's nutritional data as a Nutriments object,
 * or null if no match found.
 */
export function lookupIndianFood(productName: string): Nutriments | null {
  const db = loadIfctData();
  if (db.foods.length === 0) return null;

  const nameNorm = normalize(productName);
  const words = nameNorm.split(/\s+/).filter(Boolean);

  // Score each food by how many keywords match
  const scored = db.foods.map((food) => {
    let score = 0;
    const foodNameNorm = normalize(food.name);
    const allKeywords = food.keywords.map(normalize);

    // Check if product name words match food name or keywords
    for (const word of words) {
      if (word.length < 2) continue;
      if (foodNameNorm.includes(word)) score += 3;
      if (allKeywords.some((kw) => kw.includes(word) || word.includes(kw))) score += 2;
    }

    // Bonus for exact keyword matches
    for (const kw of allKeywords) {
      if (nameNorm.includes(kw)) score += 4;
      if (kw.includes(nameNorm)) score += 2;
    }

    return { food, score };
  });

  // Filter to best matches (score > 0)
  const matches = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);

  if (matches.length === 0) return null;

  const best = matches[0].food;

  // Convert IFCT data to Nutriments format
  // IFCT energy is in kJ, we convert to kcal
  const energyKcal = Math.round(best.energyKj / 4.184);

  return {
    energy_100g: energyKcal,
    proteins_100g: best.protein,
    fat_100g: best.fat,
    carbohydrates_100g: best.carbs,
    sugars_100g: best.sugar,
    saturated_fat_100g: best.saturatedFat,
    fiber_100g: best.fiber,
    sodium_100g: best.sodium,
  };
}

/**
 * Create a mock Product from IFCT data for scoring purposes.
 */
export function createIfctProduct(productName: string, barcode?: string): Product | null {
  const nutriments = lookupIndianFood(productName);
  if (!nutriments) return null;

  return {
    code: barcode || 'IFCT-' + normalize(productName).slice(0, 12),
    product_name: productName + ' (Indian food data)',
    brands: 'ICMR-NIN IFCT 2017',
    image_front_url: '',
    image_nutrition_url: '',
    nutriments,
    ingredients_text: '',
    nova_group: 1, // IFCT data is for whole foods, default to unprocessed
    nutriscore_grade: '',
    nutriscore_score: 0,
    categories: '',
    labels: 'Indian food composition data',
    countries_tags: ['en:india'],
  };
}
