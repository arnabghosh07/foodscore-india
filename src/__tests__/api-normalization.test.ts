import { describe, it, expect } from 'vitest';
import { toNum, normalizeNutriments, ApiError } from '@/lib/api';

describe('toNum', () => {
  it('should return the number for valid numeric input', () => {
    expect(toNum(42)).toBe(42);
    expect(toNum(0)).toBe(0);
    expect(toNum(-3.14)).toBe(-3.14);
    expect(toNum(100.5)).toBe(100.5);
  });

  it('should parse numeric strings', () => {
    expect(toNum('42')).toBe(42);
    expect(toNum('3.14')).toBe(3.14);
    expect(toNum('-5')).toBe(-5);
    expect(toNum('0')).toBe(0);
  });

  it('should return undefined for null and undefined', () => {
    expect(toNum(null)).toBeUndefined();
    expect(toNum(undefined)).toBeUndefined();
  });

  it('should return undefined for non-numeric strings', () => {
    expect(toNum('hello')).toBeUndefined();
    expect(toNum('')).toBeUndefined();
    expect(toNum('g')).toBeUndefined();
    expect(toNum('kcal')).toBeUndefined();
  });

  it('should return undefined for NaN', () => {
    expect(toNum(NaN)).toBeUndefined();
  });

  it('should return undefined for Infinity', () => {
    expect(toNum(Infinity)).toBeUndefined();
    expect(toNum(-Infinity)).toBeUndefined();
  });

  it('should handle strings with trailing non-numeric chars that parseFloat can parse', () => {
    // parseFloat("5g") returns 5, but parseFloat("~5") returns NaN
    expect(toNum('5g')).toBe(5);
    expect(toNum('~5')).toBeUndefined(); // ~ is not a valid numeric prefix
  });

  it('should return undefined for boolean values', () => {
    // parseFloat("true") and parseFloat("false") return NaN
    expect(toNum(true)).toBeUndefined();
    expect(toNum(false)).toBeUndefined();
  });

  it('should handle object values', () => {
    expect(toNum({})).toBeUndefined();
    expect(toNum([])).toBeUndefined();
  });
});

describe('normalizeNutriments', () => {
  describe('energy conversion', () => {
    it('should prefer energy-kcal_100g over energy_100g', () => {
      const raw = {
        'energy-kcal_100g': 250,
        'energy_100g': 1046, // kJ equivalent
      };
      const result = normalizeNutriments(raw);
      expect(result.energy_100g).toBe(250);
    });

    it('should convert energy_100g from kJ to kcal when energy-kcal is missing', () => {
      const raw = {
        'energy_100g': 1046, // kJ
      };
      const result = normalizeNutriments(raw);
      // 1046 / 4.184 ≈ 250
      expect(result.energy_100g).toBe(250);
    });

    it('should return undefined energy when both fields are missing', () => {
      const raw = {};
      const result = normalizeNutriments(raw);
      expect(result.energy_100g).toBeUndefined();
    });

    it('should round energy to nearest integer', () => {
      const raw = {
        'energy_100g': 1000, // kJ → 1000/4.184 ≈ 239.0
      };
      const result = normalizeNutriments(raw);
      expect(result.energy_100g).toBe(239);
    });

    it('should handle string energy values', () => {
      const raw = {
        'energy-kcal_100g': '250',
      };
      const result = normalizeNutriments(raw);
      expect(result.energy_100g).toBe(250);
    });
  });

  describe('saturated fat field mapping', () => {
    it('should map saturated-fat_100g (dash variant)', () => {
      const raw = {
        'saturated-fat_100g': 8.5,
      };
      const result = normalizeNutriments(raw);
      expect(result.saturated_fat_100g).toBe(8.5);
    });

    it('should map saturated_fat_100g (underscore variant)', () => {
      const raw = {
        'saturated_fat_100g': 8.5,
      };
      const result = normalizeNutriments(raw);
      expect(result.saturated_fat_100g).toBe(8.5);
    });

    it('should prefer dash variant over underscore variant', () => {
      const raw = {
        'saturated-fat_100g': 8.5,
        'saturated_fat_100g': 10.0,
      };
      const result = normalizeNutriments(raw);
      expect(result.saturated_fat_100g).toBe(8.5);
    });
  });

  describe('sodium normalization', () => {
    it('should keep sodium in grams when value is reasonable', () => {
      const raw = {
        'sodium_100g': 0.5, // 0.5g is reasonable
      };
      const result = normalizeNutriments(raw);
      expect(result.sodium_100g).toBe(0.5);
    });

    it('should convert sodium from mg to g when value > 10 (impossible in grams)', () => {
      const raw = {
        'sodium_100g': 500, // stored as mg, should be converted to 0.5g
      };
      const result = normalizeNutriments(raw);
      expect(result.sodium_100g).toBe(0.5);
    });

    it('should handle sodium at exactly 10 (boundary)', () => {
      const raw = {
        'sodium_100g': 10, // exactly 10 — not > 10, so no conversion
      };
      const result = normalizeNutriments(raw);
      expect(result.sodium_100g).toBe(10);
    });

    it('should handle sodium as string', () => {
      const raw = {
        'sodium_100g': '0.3',
      };
      const result = normalizeNutriments(raw);
      expect(result.sodium_100g).toBe(0.3);
    });
  });

  describe('salt normalization', () => {
    it('should keep salt in grams when value is reasonable', () => {
      const raw = {
        'salt_100g': 2.5,
      };
      const result = normalizeNutriments(raw);
      expect(result.salt_100g).toBe(2.5);
    });

    it('should convert salt from mg to g when value > 25', () => {
      const raw = {
        'salt_100g': 1000, // stored as mg → 1g
      };
      const result = normalizeNutriments(raw);
      expect(result.salt_100g).toBe(1);
    });

    it('should handle salt at exactly 25 (boundary)', () => {
      const raw = {
        'salt_100g': 25, // exactly 25 — not > 25, so no conversion
      };
      const result = normalizeNutriments(raw);
      expect(result.salt_100g).toBe(25);
    });
  });

  describe('fruits/vegetables/nuts variants', () => {
    it('should map fruits-vegetables-nuts_100g (dash variant)', () => {
      const raw = {
        'fruits-vegetables-nuts_100g': 60,
      };
      const result = normalizeNutriments(raw);
      expect(result.fruits_vegetables_nuts_100g).toBe(60);
    });

    it('should map fruits_vegetables_nuts_100g (underscore variant)', () => {
      const raw = {
        'fruits_vegetables_nuts_100g': 60,
      };
      const result = normalizeNutriments(raw);
      expect(result.fruits_vegetables_nuts_100g).toBe(60);
    });

    it('should map fruits-vegetables-legumes-estimate-from-ingredients_100g', () => {
      const raw = {
        'fruits-vegetables-legumes-estimate-from-ingredients_100g': 45,
      };
      const result = normalizeNutriments(raw);
      expect(result.fruits_vegetables_nuts_100g).toBe(45);
    });

    it('should map fruits-vegetables-nuts-estimate-from-ingredients_100g', () => {
      const raw = {
        'fruits-vegetables-nuts-estimate-from-ingredients_100g': 55,
      };
      const result = normalizeNutriments(raw);
      expect(result.fruits_vegetables_nuts_100g).toBe(55);
    });

    it('should prefer dash variant over other variants', () => {
      const raw = {
        'fruits-vegetables-nuts_100g': 60,
        'fruits_vegetables_nuts_100g': 70,
        'fruits-vegetables-legumes-estimate-from-ingredients_100g': 80,
      };
      const result = normalizeNutriments(raw);
      expect(result.fruits_vegetables_nuts_100g).toBe(60);
    });
  });

  describe('standard field mapping', () => {
    it('should map all standard fields correctly', () => {
      const raw = {
        'proteins_100g': 10,
        'carbohydrates_100g': 50,
        'sugars_100g': 20,
        'fat_100g': 15,
        'fiber_100g': 5,
      };
      const result = normalizeNutriments(raw);
      expect(result.proteins_100g).toBe(10);
      expect(result.carbohydrates_100g).toBe(50);
      expect(result.sugars_100g).toBe(20);
      expect(result.fat_100g).toBe(15);
      expect(result.fiber_100g).toBe(5);
    });

    it('should return undefined for missing fields', () => {
      const raw = {};
      const result = normalizeNutriments(raw);
      expect(result.proteins_100g).toBeUndefined();
      expect(result.carbohydrates_100g).toBeUndefined();
      expect(result.sugars_100g).toBeUndefined();
      expect(result.fat_100g).toBeUndefined();
      expect(result.saturated_fat_100g).toBeUndefined();
      expect(result.fiber_100g).toBeUndefined();
      expect(result.sodium_100g).toBeUndefined();
      expect(result.salt_100g).toBeUndefined();
      expect(result.fruits_vegetables_nuts_100g).toBeUndefined();
    });

    it('should ignore _unit and _modifier sibling fields', () => {
      const raw = {
        'proteins_100g': 10,
        'proteins_unit': 'g',
        'proteins_modifier': '~',
        'sugars_100g': 20,
        'sugars_unit': 'g',
        'sugars_value': '20',
      };
      const result = normalizeNutriments(raw);
      expect(result.proteins_100g).toBe(10);
      expect(result.sugars_100g).toBe(20);
      // _unit fields should not appear in the result
      expect(result).not.toHaveProperty('proteins_unit');
      expect(result).not.toHaveProperty('sugars_unit');
    });
  });

  describe('empty and malformed input', () => {
    it('should handle completely empty object', () => {
      const result = normalizeNutriments({});
      expect(result).toEqual({});
    });

    it('should handle unknown field names gracefully', () => {
      const raw = {
        'unknown_field_100g': 42,
        'random_string': 'hello',
        'proteins_100g': 8,
      };
      const result = normalizeNutriments(raw);
      expect(result.proteins_100g).toBe(8);
      // Unknown fields should be ignored in the typed output
    });

    it('should handle mixed types in raw data', () => {
      const raw = {
        'proteins_100g': 'not a number',
        'sugars_100g': null,
        'fat_100g': undefined,
        'fiber_100g': 42,
      };
      const result = normalizeNutriments(raw);
      expect(result.proteins_100g).toBeUndefined(); // "not a number" → parseFloat → NaN → undefined
      expect(result.sugars_100g).toBeUndefined();
      expect(result.fat_100g).toBeUndefined();
      expect(result.fiber_100g).toBe(42);
    });
  });
});

describe('ApiError', () => {
  it('should create an error with the correct message and type', () => {
    const error = new ApiError('Test error', 'network');
    expect(error.message).toBe('Test error');
    expect(error.type).toBe('network');
    expect(error.name).toBe('ApiError');
  });

  it('should be an instance of Error', () => {
    const error = new ApiError('Test', 'timeout');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
  });

  it('should support all error types', () => {
    const types = ['network', 'http', 'rate-limit', 'timeout', 'not-found', 'unknown'] as const;
    types.forEach((type) => {
      const error = new ApiError(`Error: ${type}`, type);
      expect(error.type).toBe(type);
    });
  });
});
