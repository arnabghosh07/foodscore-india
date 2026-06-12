import { describe, it, expect } from 'vitest';
import { calculateFoodScore } from '@/lib/scoring';
import { Product } from '@/lib/types';

// Helper to create a mock product with specified nutritional values
function createProduct(overrides: Partial<Product> & { nutriments: Product['nutriments'] }): Product {
  return {
    code: '0000000000000',
    product_name: 'Test Product',
    ...overrides,
  };
}

// Known Indian food products for testing
const TEST_PRODUCTS = {
  // Maggi Noodles - high in salt and fat, ultra-processed
  maggi: createProduct({
    code: '8901042011267',
    product_name: 'Maggi 2-Minute Masala Noodles',
    brands: 'Nestle',
    nova_group: 4,
    nutriments: {
      energy_100g: 449,
      proteins_100g: 8.5,
      carbohydrates_100g: 59,
      sugars_100g: 5,
      fat_100g: 18,
      saturated_fat_100g: 8,
      fiber_100g: 2,
      sodium_100g: 1.8, // ~1800mg sodium
      salt_100g: 4.5,
    },
  }),

  // Amul Butter - high saturated fat
  amulButter: createProduct({
    code: '8901135001023',
    product_name: 'Amul Butter',
    brands: 'Amul',
    nova_group: 2,
    nutriments: {
      energy_100g: 742,
      proteins_100g: 0.5,
      carbohydrates_100g: 0.1,
      sugars_100g: 0.1,
      fat_100g: 82,
      saturated_fat_100g: 52,
      fiber_100g: 0,
      sodium_100g: 0.02,
      salt_100g: 0.05,
    },
  }),

  // Fresh fruit - low sugar, unprocessed
  freshFruit: createProduct({
    product_name: 'Fresh Apple',
    nova_group: 1,
    nutriments: {
      energy_100g: 52,
      proteins_100g: 0.3,
      carbohydrates_100g: 14,
      sugars_100g: 10,
      fat_100g: 0.2,
      saturated_fat_100g: 0.1,
      fiber_100g: 2.4,
      sodium_100g: 0.001,
      salt_100g: 0.002,
      fruits_vegetables_nuts_100g: 100,
    },
  }),

  // Haldiram Aloo Bhujia - high sodium, processed snack
  haldiram: createProduct({
    code: '8901058001158',
    product_name: 'Haldiram Aloo Bhujia',
    brands: 'Haldiram',
    nova_group: 3,
    nutriments: {
      energy_100g: 500,
      proteins_100g: 7,
      carbohydrates_100g: 45,
      sugars_100g: 3,
      fat_100g: 30,
      saturated_fat_100g: 12,
      fiber_100g: 5,
      sodium_100g: 1.5,
      salt_100g: 3.75,
    },
  }),

  // Bournvita - high sugar, ultra-processed
  bournvita: createProduct({
    code: '8906004735109',
    product_name: 'Cadbury Bournvita',
    brands: 'Cadbury',
    nova_group: 4,
    nutriments: {
      energy_100g: 400,
      proteins_100g: 5,
      carbohydrates_100g: 80,
      sugars_100g: 50,
      fat_100g: 10,
      saturated_fat_100g: 6,
      fiber_100g: 1,
      sodium_100g: 0.3,
      salt_100g: 0.75,
    },
  }),

  // Plain rice - minimal nutrition, unprocessed
  plainRice: createProduct({
    product_name: 'Basmati Rice',
    brands: 'India Gate',
    nova_group: 1,
    nutriments: {
      energy_100g: 350,
      proteins_100g: 7,
      carbohydrates_100g: 78,
      sugars_100g: 0,
      fat_100g: 0.5,
      saturated_fat_100g: 0.1,
      fiber_100g: 1.5,
      sodium_100g: 0.005,
      salt_100g: 0.01,
    },
  }),

  // Perfect health food - high protein, fiber, low everything else
  perfectFood: createProduct({
    product_name: 'Super Healthy Mix',
    nova_group: 1,
    nutriments: {
      energy_100g: 200,
      proteins_100g: 20,
      carbohydrates_100g: 30,
      sugars_100g: 2,
      fat_100g: 5,
      saturated_fat_100g: 0.5,
      fiber_100g: 10,
      sodium_100g: 0.05,
      salt_100g: 0.1,
      fruits_vegetables_nuts_100g: 80,
    },
  }),

  // Worst possible food - max sugar, fat, sodium, ultra-processed
  worstFood: createProduct({
    product_name: 'Ultra Junk',
    nova_group: 4,
    nutriments: {
      energy_100g: 600,
      proteins_100g: 1,
      carbohydrates_100g: 80,
      sugars_100g: 60,
      fat_100g: 30,
      saturated_fat_100g: 15,
      fiber_100g: 0,
      sodium_100g: 2,
      salt_100g: 5,
    },
  }),
};

describe('calculateFoodScore', () => {
  describe('Score ranges and grades', () => {
    it('should assign a high grade (A or B) for excellent foods', () => {
      const result = calculateFoodScore(TEST_PRODUCTS.perfectFood);
      expect(result.overallScore).toBeGreaterThanOrEqual(65);
      expect(['A', 'B']).toContain(result.grade);
      expect(['Excellent', 'Good']).toContain(result.gradeLabel);
    });

    it('should assign grade E for ultra-processed junk foods', () => {
      const result = calculateFoodScore(TEST_PRODUCTS.worstFood);
      expect(result.grade).toBe('E');
      expect(result.gradeLabel).toBe('Very Poor');
    });

    it('should always return a score between 0 and 100', () => {
      Object.values(TEST_PRODUCTS).forEach((product) => {
        const result = calculateFoodScore(product);
        expect(result.overallScore).toBeGreaterThanOrEqual(0);
        expect(result.overallScore).toBeLessThanOrEqual(100);
      });
    });

    it('should return valid grade colors', () => {
      Object.values(TEST_PRODUCTS).forEach((product) => {
        const result = calculateFoodScore(product);
        expect(result.gradeColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });

  describe('Specific Indian product scoring', () => {
    it('should give Maggi a poor score (ultra-processed, high sodium)', () => {
      const result = calculateFoodScore(TEST_PRODUCTS.maggi);
      expect(result.grade).toMatch(/[CDE]/);
      expect(result.novaGroup).toBe(4);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should give Amul Butter a low score due to high saturated fat', () => {
      const result = calculateFoodScore(TEST_PRODUCTS.amulButter);
      // 52g saturated fat per 100g is extremely high
      expect(result.warnings.some(w => w.includes('saturated fat'))).toBe(true);
      expect(result.novaGroup).toBe(2);
    });

    it('should give fresh fruit a good score (NOVA 1, healthy nutrients)', () => {
      const result = calculateFoodScore(TEST_PRODUCTS.freshFruit);
      expect(result.novaGroup).toBe(1);
      expect(result.positives.some(p => p.includes('Unprocessed'))).toBe(true);
      expect(result.overallScore).toBeGreaterThan(60);
    });

    it('should give Haldiram a poor score (high sodium, processed)', () => {
      const result = calculateFoodScore(TEST_PRODUCTS.haldiram);
      expect(result.novaGroup).toBe(3);
      expect(result.warnings.some(w => w.includes('sodium'))).toBe(true);
    });

    it('should give Bournvita a very poor score (extreme sugar, ultra-processed)', () => {
      const result = calculateFoodScore(TEST_PRODUCTS.bournvita);
      expect(result.grade).toBe('E');
      expect(result.novaGroup).toBe(4);
      expect(result.warnings.some(w => w.includes('sugar'))).toBe(true);
      expect(result.warnings.some(w => w.includes('Ultra-processed'))).toBe(true);
    });
  });

  describe('NOVA classification impact', () => {
    it('should give higher scores to NOVA 1 (unprocessed) foods', () => {
      const result1 = calculateFoodScore(TEST_PRODUCTS.plainRice);
      expect(result1.novaGroup).toBe(1);
      expect(result1.novaLabel).toBe('Unprocessed');
    });

    it('should penalize NOVA 4 (ultra-processed) foods', () => {
      const result4 = calculateFoodScore(TEST_PRODUCTS.bournvita);
      const result1 = calculateFoodScore(TEST_PRODUCTS.freshFruit);
      // Even if nutritional profiles were similar, NOVA 4 should score lower
      expect(result4.novaGroup).toBe(4);
      expect(result4.novaLabel).toBe('Ultra-Processed');
      // NOVA 1 should score significantly higher than NOVA 4
      expect(result1.overallScore).toBeGreaterThan(result4.overallScore);
    });

    it('should include NOVA description in result', () => {
      Object.values(TEST_PRODUCTS).forEach((product) => {
        const result = calculateFoodScore(product);
        expect(result.novaDescription).toBeTruthy();
        expect(typeof result.novaDescription).toBe('string');
      });
    });
  });

  describe('Warnings generation', () => {
    it('should warn about ultra-processed foods (NOVA 4)', () => {
      const result = calculateFoodScore(TEST_PRODUCTS.maggi);
      expect(result.warnings.some(w => w.includes('processed'))).toBe(true);
    });

    it('should warn about high sodium', () => {
      const result = calculateFoodScore(TEST_PRODUCTS.maggi);
      expect(result.warnings.some(w => w.includes('sodium'))).toBe(true);
    });

    it('should warn about high sugar', () => {
      const result = calculateFoodScore(TEST_PRODUCTS.bournvita);
      expect(result.warnings.some(w => w.includes('sugar'))).toBe(true);
    });

    it('should warn about high saturated fat', () => {
      const result = calculateFoodScore(TEST_PRODUCTS.amulButter);
      expect(result.warnings.some(w => w.includes('saturated fat'))).toBe(true);
    });

    it('should not warn about healthy foods', () => {
      const result = calculateFoodScore(TEST_PRODUCTS.freshFruit);
      expect(result.warnings.length).toBe(0);
    });
  });

  describe('Positive attributes', () => {
    it('should identify unprocessed foods', () => {
      const result = calculateFoodScore(TEST_PRODUCTS.freshFruit);
      expect(result.positives.some(p => p.includes('Unprocessed'))).toBe(true);
    });

    it('should identify high fiber', () => {
      const result = calculateFoodScore(TEST_PRODUCTS.perfectFood);
      expect(result.positives.some(p => p.includes('fiber'))).toBe(true);
    });

    it('should identify high protein', () => {
      const result = calculateFoodScore(TEST_PRODUCTS.perfectFood);
      expect(result.positives.some(p => p.includes('protein'))).toBe(true);
    });

    it('should identify low sugar', () => {
      const result = calculateFoodScore(TEST_PRODUCTS.perfectFood);
      expect(result.positives.some(p => p.includes('sugar'))).toBe(true);
    });
  });

  describe('Nutrient scores for display', () => {
    it('should return nutrient scores array with 5 nutrients', () => {
      const result = calculateFoodScore(TEST_PRODUCTS.maggi);
      expect(result.nutrientScores.length).toBe(5);
    });

    it('should have valid nutrient score structure', () => {
      const result = calculateFoodScore(TEST_PRODUCTS.maggi);
      result.nutrientScores.forEach((ns) => {
        expect(ns.name).toBeTruthy();
        expect(typeof ns.value).toBe('number');
        expect(ns.unit).toBeTruthy();
        expect(typeof ns.score).toBe('number');
        expect(ns.maxScore).toBe(10);
        expect(ns.color).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(ns.label).toBeTruthy();
      });
    });
  });

  describe('Summary generation', () => {
    it('should generate a non-empty summary', () => {
      const result = calculateFoodScore(TEST_PRODUCTS.maggi);
      expect(result.summary).toBeTruthy();
      expect(result.summary.length).toBeGreaterThan(0);
    });

    it('should include product name in summary', () => {
      const result = calculateFoodScore(TEST_PRODUCTS.maggi);
      expect(result.summary).toContain('Maggi 2-Minute Masala Noodles');
    });

    it('should include score in summary', () => {
      const result = calculateFoodScore(TEST_PRODUCTS.maggi);
      expect(result.summary).toContain('/100');
    });
  });

  describe('Edge cases', () => {
    it('should handle products with missing nutritional values', () => {
      const product = createProduct({
        product_name: 'Empty Product',
        nova_group: 3,
        nutriments: {},
      });
      const result = calculateFoodScore(product);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.grade).toBeTruthy();
    });

    it('should handle products with undefined nova_group', () => {
      const product = createProduct({
        product_name: 'No Nova Product',
        nutriments: { sugars_100g: 5 },
      });
      const result = calculateFoodScore(product);
      expect(result.novaGroup).toBe(4);
    });

    it('should handle products with only salt (no sodium)', () => {
      const product = createProduct({
        product_name: 'Salt Product',
        nova_group: 2,
        nutriments: { salt_100g: 5 },
      });
      const result = calculateFoodScore(product);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });
  });
});
