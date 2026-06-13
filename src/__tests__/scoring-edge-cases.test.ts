import { describe, it, expect } from 'vitest';
import { calculateFoodScore } from '@/lib/scoring';
import { Product } from '@/lib/types';

function createProduct(overrides: Partial<Product> & { nutriments: Product['nutriments'] }): Product {
  return {
    code: '0000000000000',
    product_name: 'Test Product',
    ...overrides,
  };
}

describe('calculateFoodScore — edge cases', () => {
  describe('Grade boundary thresholds', () => {
    it('should assign grade A at score >= 80', () => {
      // Perfect food: high protein, fiber, fruits, NOVA 1, zero sugar/fat/sodium
      const product = createProduct({
        product_name: 'Grade A Boundary',
        nova_group: 1,
        nutriments: {
          proteins_100g: 20,
          fiber_100g: 10,
          fruits_vegetables_nuts_100g: 90,
          sugars_100g: 0,
          saturated_fat_100g: 0,
          sodium_100g: 0,
        },
      });
      const result = calculateFoodScore(product);
      // With NOVA 1 bonus (+10 credits) and max credits, score should be high
      expect(result.grade).toBe('A');
      expect(result.gradeLabel).toBe('Excellent');
    });

    it('should assign grade B for scores 65-79', () => {
      // Moderate food: some penalties offset by moderate credits
      const product = createProduct({
        product_name: 'Grade B Product',
        nova_group: 3,
        nutriments: {
          proteins_100g: 3,
          fiber_100g: 1,
          sugars_100g: 10,
          saturated_fat_100g: 4,
          sodium_100g: 0.25,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.grade).toBe('B');
      expect(result.gradeLabel).toBe('Good');
    });

    it('should assign grade C for scores 50-64', () => {
      const product = createProduct({
        product_name: 'Grade C Product',
        nova_group: 3,
        nutriments: {
          proteins_100g: 3,
          fiber_100g: 0,
          sugars_100g: 12,
          saturated_fat_100g: 4,
          sodium_100g: 0.25,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.grade).toBe('C');
      expect(result.gradeLabel).toBe('Fair');
    });

    it('should assign grade D for scores 35-49', () => {
      const product = createProduct({
        product_name: 'Grade D Product',
        nova_group: 3,
        nutriments: {
          proteins_100g: 2,
          fiber_100g: 0,
          sugars_100g: 20,
          saturated_fat_100g: 10,
          sodium_100g: 0.5,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.grade).toBe('D');
      expect(result.gradeLabel).toBe('Poor');
    });

    it('should assign grade E for scores below 35', () => {
      const product = createProduct({
        product_name: 'Grade E Product',
        nova_group: 4,
        nutriments: {
          proteins_100g: 1,
          fiber_100g: 0,
          sugars_100g: 50,
          saturated_fat_100g: 15,
          sodium_100g: 2,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.grade).toBe('E');
      expect(result.gradeLabel).toBe('Very Poor');
    });
  });

  describe('Score capping logic', () => {
    it('should cap score at 30 for extreme sugar (>=40g)', () => {
      const product = createProduct({
        product_name: 'Extreme Sugar',
        nova_group: 4,
        nutriments: {
          proteins_100g: 5,
          fiber_100g: 3,
          sugars_100g: 45,
          saturated_fat_100g: 5,
          sodium_100g: 0.1,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.overallScore).toBeLessThanOrEqual(30);
      expect(result.grade).toBe('E');
    });

    it('should cap score at 30 for extreme sodium (>=1.0g)', () => {
      const product = createProduct({
        product_name: 'Extreme Sodium',
        nova_group: 4,
        nutriments: {
          proteins_100g: 5,
          fiber_100g: 3,
          sugars_100g: 5,
          saturated_fat_100g: 5,
          sodium_100g: 1.5,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.overallScore).toBeLessThanOrEqual(30);
    });

    it('should cap score at 45 for palm oil products', () => {
      const product = createProduct({
        product_name: 'Palm Oil Product',
        nova_group: 4,
        ingredients_text: 'Sugar, palm oil, flour',
        nutriments: {
          proteins_100g: 5,
          fiber_100g: 3,
          sugars_100g: 10,
          saturated_fat_100g: 5,
          sodium_100g: 0.1,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.overallScore).toBeLessThanOrEqual(45);
    });

    it('should cap score at 45 for high sugar (>=25g)', () => {
      const product = createProduct({
        product_name: 'High Sugar Product',
        nova_group: 4,
        nutriments: {
          proteins_100g: 5,
          fiber_100g: 3,
          sugars_100g: 30,
          saturated_fat_100g: 3,
          sodium_100g: 0.1,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.overallScore).toBeLessThanOrEqual(45);
    });

    it('should cap score at 45 for high sodium (>=0.6g)', () => {
      const product = createProduct({
        product_name: 'High Sodium Product',
        nova_group: 3,
        nutriments: {
          proteins_100g: 5,
          fiber_100g: 3,
          sugars_100g: 5,
          saturated_fat_100g: 3,
          sodium_100g: 0.7,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.overallScore).toBeLessThanOrEqual(45);
    });

    it('should clamp score to 0 at minimum', () => {
      const product = createProduct({
        product_name: 'Absolute Worst',
        nova_group: 4,
        ingredients_text: 'palm oil, hydrogenated fat',
        nutriments: {
          proteins_100g: 0,
          fiber_100g: 0,
          sugars_100g: 80,
          saturated_fat_100g: 30,
          sodium_100g: 5,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('should clamp score to 100 at maximum', () => {
      const product = createProduct({
        product_name: 'Perfect Food',
        nova_group: 1,
        nutriments: {
          proteins_100g: 30,
          fiber_100g: 15,
          fruits_vegetables_nuts_100g: 100,
          sugars_100g: 0,
          saturated_fat_100g: 0,
          sodium_100g: 0,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Red flag detection', () => {
    it('should detect palm oil in ingredients', () => {
      const product = createProduct({
        product_name: 'Palm Oil Snack',
        ingredients_text: 'Flour, sugar, palmolein, salt',
        nova_group: 4,
        nutriments: { sugars_100g: 5, saturated_fat_100g: 5, sodium_100g: 0.1 },
      });
      const result = calculateFoodScore(product);
      expect(result.safetyRecommendation?.hasRedFlags).toBe(true);
      expect(result.safetyRecommendation?.redFlags.some(f => f.includes('Palm'))).toBe(true);
    });

    it('should detect vanaspati as palm oil variant', () => {
      const product = createProduct({
        product_name: 'Vanaspati Product',
        ingredients_text: 'Refined vanaspati, sugar',
        nova_group: 3,
        nutriments: { sugars_100g: 5, saturated_fat_100g: 5, sodium_100g: 0.1 },
      });
      const result = calculateFoodScore(product);
      expect(result.safetyRecommendation?.redFlags.some(f => f.includes('Palm') || f.includes('Vanaspati'))).toBe(true);
    });

    it('should detect hydrogenated fats', () => {
      const product = createProduct({
        product_name: 'Hydrogenated Product',
        ingredients_text: 'Sugar, hydrogenated vegetable oil',
        nova_group: 4,
        nutriments: { sugars_100g: 5, saturated_fat_100g: 5, sodium_100g: 0.1 },
      });
      const result = calculateFoodScore(product);
      expect(result.safetyRecommendation?.redFlags.some(f => f.includes('Hydrogenated'))).toBe(true);
    });

    it('should flag very high sugar (>=25g) as red flag', () => {
      const product = createProduct({
        product_name: 'Sugary Product',
        nova_group: 4,
        nutriments: {
          sugars_100g: 30,
          saturated_fat_100g: 2,
          sodium_100g: 0.1,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.safetyRecommendation?.redFlags.some(f => f.includes('sugar'))).toBe(true);
    });

    it('should flag very high sodium (>=0.6g) as red flag', () => {
      const product = createProduct({
        product_name: 'Salty Product',
        nova_group: 3,
        nutriments: {
          sugars_100g: 5,
          saturated_fat_100g: 2,
          sodium_100g: 0.8,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.safetyRecommendation?.redFlags.some(f => f.includes('sodium'))).toBe(true);
    });

    it('should flag very high saturated fat (>=10g) as red flag', () => {
      const product = createProduct({
        product_name: 'Fatty Product',
        nova_group: 3,
        nutriments: {
          sugars_100g: 5,
          saturated_fat_100g: 12,
          sodium_100g: 0.1,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.safetyRecommendation?.redFlags.some(f => f.includes('saturated fat'))).toBe(true);
    });

    it('should not flag low sugar products', () => {
      const product = createProduct({
        product_name: 'Low Sugar Product',
        nova_group: 2,
        nutriments: {
          sugars_100g: 2,
          saturated_fat_100g: 0.5,
          sodium_100g: 0.05,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.safetyRecommendation?.hasRedFlags).toBe(false);
    });
  });

  describe('Safety recommendations', () => {
    it('should identify diabetics as high risk for high sugar products', () => {
      const product = createProduct({
        product_name: 'High Sugar Drink',
        nova_group: 4,
        nutriments: {
          sugars_100g: 20,
          saturated_fat_100g: 2,
          sodium_100g: 0.1,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.safetyRecommendation?.highRiskGroups).toContain('Diabetics');
    });

    it('should identify hypertension patients for high sodium', () => {
      const product = createProduct({
        product_name: 'Salty Snack',
        nova_group: 3,
        nutriments: {
          sugars_100g: 5,
          saturated_fat_100g: 2,
          sodium_100g: 0.5,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.safetyRecommendation?.highRiskGroups).toContain('Hypertension Patients');
    });

    it('should identify heart patients for high saturated fat', () => {
      const product = createProduct({
        product_name: 'Fatty Butter',
        nova_group: 2,
        nutriments: {
          sugars_100g: 0,
          saturated_fat_100g: 15,
          sodium_100g: 0.05,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.safetyRecommendation?.highRiskGroups).toContain('Heart Patients');
    });

    it('should identify pregnant women for caffeine-containing products', () => {
      const product = createProduct({
        product_name: 'Sting Energy Drink',
        ingredients_text: 'Carbonated water, caffeine, sugar',
        nova_group: 4,
        nutriments: {
          sugars_100g: 12,
          saturated_fat_100g: 0,
          sodium_100g: 0.1,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.safetyRecommendation?.highRiskGroups).toContain('Pregnant Women');
    });

    it('should suggest daily consumption for score >=80', () => {
      const product = createProduct({
        product_name: 'Daily Food',
        nova_group: 1,
        nutriments: {
          proteins_100g: 20,
          fiber_100g: 10,
          sugars_100g: 1,
          saturated_fat_100g: 0.5,
          sodium_100g: 0.01,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.safetyRecommendation?.weeklyFrequency).toContain('Daily');
    });

    it('should suggest avoidance for very low score', () => {
      const product = createProduct({
        product_name: 'Avoid This',
        nova_group: 4,
        nutriments: {
          sugars_100g: 50,
          saturated_fat_100g: 15,
          sodium_100g: 2,
          proteins_100g: 1,
          fiber_100g: 0,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.safetyRecommendation?.weeklyFrequency).toContain('Avoid');
    });

    it('should give strict portion limit for very low score NOVA 4', () => {
      const product = createProduct({
        product_name: 'Danger Food',
        nova_group: 4,
        nutriments: {
          sugars_100g: 50,
          saturated_fat_100g: 15,
          sodium_100g: 2,
          proteins_100g: 1,
          fiber_100g: 0,
        },
      });
      const result = calculateFoodScore(product);
      // With these values, sugar limit = 50g, sat fat limit = 147g, sodium limit = 100g
      // NOVA 4 + score < 35 caps maxPortion to 25g → roundedLimit = 25
      expect(result.safetyRecommendation?.dailyLimit).toContain('Max 25g per day');
    });

    it('should give "can be consumed freely" for clean NOVA 1 foods', () => {
      const product = createProduct({
        product_name: 'Clean Whole Food',
        nova_group: 1,
        nutriments: {
          proteins_100g: 5,
          fiber_100g: 3,
          sugars_100g: 2,
          saturated_fat_100g: 0.5,
          sodium_100g: 0.05,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.safetyRecommendation?.dailyLimit).toContain('freely');
    });

    it('should estimate biscuit count in daily limit for biscuit products', () => {
      const product = createProduct({
        product_name: 'Parle-G Biscuit',
        nova_group: 4,
        nutriments: {
          sugars_100g: 30,
          saturated_fat_100g: 5,
          sodium_100g: 0.3,
          proteins_100g: 5,
          fiber_100g: 1,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.safetyRecommendation?.dailyLimit).toContain('biscuit');
    });
  });

  describe('Healthy alternatives', () => {
    it('should suggest noodle alternatives for noodle products', () => {
      const product = createProduct({
        product_name: 'Maggi Noodles',
        nova_group: 4,
        nutriments: { sugars_100g: 5, saturated_fat_100g: 5, sodium_100g: 0.5 },
      });
      const result = calculateFoodScore(product);
      expect(result.healthyAlternatives).toBeDefined();
      expect(result.healthyAlternatives!.length).toBeGreaterThan(0);
      expect(result.healthyAlternatives!.some(a => a.name.toLowerCase().includes('noodle') || a.name.toLowerCase().includes('millet'))).toBe(true);
    });

    it('should suggest biscuit alternatives for biscuit products', () => {
      const product = createProduct({
        product_name: 'Good Day Biscuit',
        nova_group: 4,
        nutriments: { sugars_100g: 25, saturated_fat_100g: 8, sodium_100g: 0.3 },
      });
      const result = calculateFoodScore(product);
      expect(result.healthyAlternatives!.some(a => a.name.toLowerCase().includes('biscuit') || a.name.toLowerCase().includes('makhana'))).toBe(true);
    });

    it('should suggest chip alternatives for chip products', () => {
      const product = createProduct({
        product_name: 'Lays Chips',
        nova_group: 4,
        nutriments: { sugars_100g: 2, saturated_fat_100g: 8, sodium_100g: 0.5 },
      });
      const result = calculateFoodScore(product);
      expect(result.healthyAlternatives!.some(a => a.name.toLowerCase().includes('chana') || a.name.toLowerCase().includes('popcorn') || a.name.toLowerCase().includes('makhana'))).toBe(true);
    });

    it('should suggest drink alternatives for beverage products', () => {
      const product = createProduct({
        product_name: 'Thums Up Cola',
        nova_group: 4,
        nutriments: { sugars_100g: 12, saturated_fat_100g: 0, sodium_100g: 0.02 },
      });
      const result = calculateFoodScore(product);
      expect(result.healthyAlternatives!.some(a => a.name.toLowerCase().includes('coconut') || a.name.toLowerCase().includes('buttermilk') || a.name.toLowerCase().includes('chaas'))).toBe(true);
    });

    it('should suggest generic alternatives for unknown products', () => {
      const product = createProduct({
        product_name: 'Mystery Food',
        nova_group: 3,
        nutriments: { sugars_100g: 10, saturated_fat_100g: 5, sodium_100g: 0.3 },
      });
      const result = calculateFoodScore(product);
      expect(result.healthyAlternatives!.some(a => a.name.toLowerCase().includes('almond') || a.name.toLowerCase().includes('makhana'))).toBe(true);
    });
  });

  describe('Nutriment fallback and safety', () => {
    it('should handle completely empty nutriments object', () => {
      const product = createProduct({
        product_name: 'Empty Nutriments',
        nova_group: 3,
        nutriments: {},
      });
      const result = calculateFoodScore(product);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.nutrientScores.length).toBe(5);
    });

    it('should handle undefined nutriments', () => {
      const product = {
        code: '0000000000000',
        product_name: 'Undefined Nutriments',
        nova_group: 2,
        nutriments: undefined as unknown as Product['nutriments'],
      };
      const result = calculateFoodScore(product);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.grade).toBeTruthy();
    });

    it('should handle NaN values in nutriments gracefully', () => {
      const product = createProduct({
        product_name: 'NaN Product',
        nova_group: 3,
        nutriments: {
          sugars_100g: NaN,
          saturated_fat_100g: NaN,
          sodium_100g: NaN,
          proteins_100g: NaN,
          fiber_100g: NaN,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should handle Infinity values in nutriments gracefully', () => {
      const product = createProduct({
        product_name: 'Infinity Product',
        nova_group: 3,
        nutriments: {
          sugars_100g: Infinity,
          saturated_fat_100g: Infinity,
          sodium_100g: Infinity,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should handle negative values in nutriments', () => {
      const product = createProduct({
        product_name: 'Negative Product',
        nova_group: 2,
        nutriments: {
          sugars_100g: -5,
          saturated_fat_100g: -2,
          sodium_100g: -1,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should use salt_100g as sodium fallback when sodium_100g is missing', () => {
      const product = createProduct({
        product_name: 'Salt Only',
        nova_group: 2,
        nutriments: {
          salt_100g: 2.5, // should be treated as 1.0g sodium (2.5 / 2.5)
          sugars_100g: 5,
          saturated_fat_100g: 2,
        },
      });
      const result = calculateFoodScore(product);
      // Salt 2.5g → sodium 1.0g which is high, should trigger warnings
      expect(result.overallScore).toBeLessThan(70);
    });
  });

  describe('NOVA group edge cases', () => {
    it('should default to NOVA 4 when nova_group is undefined', () => {
      const product = createProduct({
        product_name: 'No NOVA',
        nutriments: { sugars_100g: 5, saturated_fat_100g: 2, sodium_100g: 0.1 },
      });
      const result = calculateFoodScore(product);
      expect(result.novaGroup).toBe(4);
    });

    it('should handle NOVA group 1 (unprocessed)', () => {
      const product = createProduct({
        product_name: 'Whole Food',
        nova_group: 1,
        nutriments: { sugars_100g: 5, saturated_fat_100g: 1, sodium_100g: 0.05 },
      });
      const result = calculateFoodScore(product);
      expect(result.novaLabel).toBe('Unprocessed');
      expect(result.novaDescription).toContain('Whole foods');
    });

    it('should handle NOVA group 2 (processed culinary)', () => {
      const product = createProduct({
        product_name: 'Cooking Oil',
        nova_group: 2,
        nutriments: { sugars_100g: 0, saturated_fat_100g: 5, sodium_100g: 0 },
      });
      const result = calculateFoodScore(product);
      expect(result.novaLabel).toBe('Processed Culinary');
    });

    it('should handle NOVA group 3 (processed)', () => {
      const product = createProduct({
        product_name: 'Canned Beans',
        nova_group: 3,
        nutriments: { sugars_100g: 3, saturated_fat_100g: 1, sodium_100g: 0.4 },
      });
      const result = calculateFoodScore(product);
      expect(result.novaLabel).toBe('Processed Foods');
    });

    it('should handle NOVA group 4 (ultra-processed)', () => {
      const product = createProduct({
        product_name: 'Instant Noodles',
        nova_group: 4,
        nutriments: { sugars_100g: 3, saturated_fat_100g: 8, sodium_100g: 1.0 },
      });
      const result = calculateFoodScore(product);
      expect(result.novaLabel).toBe('Ultra-Processed');
    });

    it('should default to NOVA 4 label for unknown NOVA groups', () => {
      const product = createProduct({
        product_name: 'Unknown NOVA',
        nova_group: 99,
        nutriments: { sugars_100g: 5, saturated_fat_100g: 2, sodium_100g: 0.1 },
      });
      const result = calculateFoodScore(product);
      // Should fall back to NOVA 4 label since 99 is not in NOVA_LABELS
      expect(result.novaLabel).toBe('Ultra-Processed');
    });
  });

  describe('Warnings deduplication', () => {
    it('should not duplicate sugar warnings when both red flag and warning exist', () => {
      const product = createProduct({
        product_name: 'Double Sugar Warning',
        nova_group: 4,
        nutriments: {
          sugars_100g: 30,
          saturated_fat_100g: 2,
          sodium_100g: 0.1,
        },
      });
      const result = calculateFoodScore(product);
      const sugarWarnings = result.warnings.filter(w => w.toLowerCase().includes('sugar'));
      // Should have exactly one sugar-related warning (the red flag, not both)
      expect(sugarWarnings.length).toBe(1);
    });

    it('should not duplicate sodium warnings', () => {
      const product = createProduct({
        product_name: 'Double Sodium Warning',
        nova_group: 4,
        nutriments: {
          sugars_100g: 5,
          saturated_fat_100g: 2,
          sodium_100g: 0.8,
        },
      });
      const result = calculateFoodScore(product);
      const sodiumWarnings = result.warnings.filter(w => w.toLowerCase().includes('sodium'));
      expect(sodiumWarnings.length).toBe(1);
    });
  });

  describe('Data source indicator', () => {
    it('should indicate openfoodfacts as data source for products with nutriments', () => {
      const product = createProduct({
        product_name: 'OF Product',
        nova_group: 3,
        nutriments: { sugars_100g: 5, saturated_fat_100g: 2, sodium_100g: 0.1 },
      });
      const result = calculateFoodScore(product);
      expect(result.dataSource).toBe('openfoodfacts');
    });
  });

  describe('Product name in output', () => {
    it('should handle empty product_name gracefully', () => {
      const product = {
        code: '0000000000000',
        product_name: undefined,
        nova_group: 3,
        nutriments: { sugars_100g: 5, saturated_fat_100g: 2, sodium_100g: 0.1 },
      } as unknown as Product;
      const result = calculateFoodScore(product);
      // undefined/null product_name falls back to 'Unknown product' via ?? operator
      expect(result.summary).toContain('Unknown product');
    });

    it('should not crash in safety recommendations when product_name is undefined', () => {
      // Regression test: calculateSafetyRecommendation previously called
      // product.product_name.toLowerCase() without null guard, causing a TypeError
      const product = {
        code: '0000000000000',
        product_name: undefined,
        nova_group: 4,
        nutriments: { sugars_100g: 5, saturated_fat_100g: 2, sodium_100g: 0.1 },
      } as unknown as Product;
      const result = calculateFoodScore(product);
      expect(result.safetyRecommendation).toBeDefined();
      expect(result.safetyRecommendation?.dailyLimit).toBeTruthy();
      expect(result.safetyRecommendation?.weeklyFrequency).toBeTruthy();
    });

    it('should not crash when product_name is null', () => {
      const product = {
        code: '0000000000000',
        product_name: null,
        nova_group: 3,
        nutriments: { sugars_100g: 5, saturated_fat_100g: 2, sodium_100g: 0.1 },
      } as unknown as Product;
      const result = calculateFoodScore(product);
      expect(result.safetyRecommendation).toBeDefined();
      expect(result.summary).toContain('Unknown product');
    });

    it('should include actual product name in summary', () => {
      const product = createProduct({
        product_name: 'Britannia Marie Gold',
        nova_group: 3,
        nutriments: { sugars_100g: 5, saturated_fat_100g: 2, sodium_100g: 0.1 },
      });
      const result = calculateFoodScore(product);
      expect(result.summary).toContain('Britannia Marie Gold');
    });
  });

  describe('Energy warning', () => {
    it('should warn about high energy (>500 kcal)', () => {
      const product = createProduct({
        product_name: 'High Energy',
        nova_group: 3,
        nutriments: {
          energy_100g: 600,
          sugars_100g: 5,
          saturated_fat_100g: 5,
          sodium_100g: 0.1,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.warnings.some(w => w.includes('energy') || w.includes('Energy'))).toBe(true);
    });

    it('should not warn about moderate energy', () => {
      const product = createProduct({
        product_name: 'Moderate Energy',
        nova_group: 2,
        nutriments: {
          energy_100g: 300,
          sugars_100g: 2,
          saturated_fat_100g: 1,
          sodium_100g: 0.05,
        },
      });
      const result = calculateFoodScore(product);
      expect(result.warnings.some(w => w.includes('energy') || w.includes('Energy'))).toBe(false);
    });
  });

  describe('Feedback generation', () => {
    it('should combine positive and warning in feedback when both exist', () => {
      const product = createProduct({
        product_name: 'Mixed Product',
        nova_group: 3,
        nutriments: {
          proteins_100g: 10,
          fiber_100g: 5,
          sugars_100g: 25,
          saturated_fat_100g: 5,
          sodium_100g: 0.3,
        },
      });
      const result = calculateFoodScore(product);
      // Should have both a positive and a warning in feedback
      expect(result.feedback).toContain('. ');
    });

    it('should return "No specific feedback" when no positives or warnings', () => {
      const product = createProduct({
        product_name: 'Neutral Product',
        nova_group: 2,
        nutriments: {
          sugars_100g: 8,
          saturated_fat_100g: 3,
          sodium_100g: 0.2,
          proteins_100g: 3,
          fiber_100g: 1.5,
        },
      });
      const result = calculateFoodScore(product);
      // This product has some positives (low sugar) and some warnings
      expect(result.feedback).toBeTruthy();
    });
  });
});
