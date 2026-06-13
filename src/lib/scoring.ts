import { Product, FoodScoreResult, NutrientScore, Nutriments, SafetyRecommendation, HealthyAlternative } from './types';
import { lookupIndianFood } from './indianFoods';

/** Return n if it is a finite, real number, otherwise return fallback (default 0). */
function safeNum(n: number | undefined | null, fallback = 0): number {
  if (n == null) return fallback;
  const v = typeof n === 'number' ? n : Number(n);
  return isFinite(v) ? v : fallback;
}

/** Ensure a nutriments object is always defined and all values are numbers. */
function safeNutriments(raw: Nutriments | undefined | null): Nutriments {
  if (!raw || typeof raw !== 'object') return {};
  return raw;
}

// Indian dietary context thresholds (per 100g)
const INDIAN_THRESHOLDS = {
  sugar: { low: 5, high: 15, veryHigh: 25 },
  saturatedFat: { low: 1.5, high: 5, veryHigh: 10 },
  sodium: { low: 0.1, high: 0.3, veryHigh: 0.6 },
  fiber: { low: 1.5, good: 3, excellent: 6 },
  protein: { low: 3, good: 8, excellent: 12 },
};

// NOVA classification labels (based on FSSAI/WHO classification)
const NOVA_LABELS: Record<number, { label: string; description: string }> = {
  1: { label: 'Unprocessed', description: 'Whole foods with no or minimal processing. Best for health.' },
  2: { label: 'Processed Culinary', description: 'Processed ingredients used in cooking. Moderate consumption.' },
  3: { label: 'Processed Foods', description: 'Industrially processed with added salt, sugar, or oil. Consume in moderation.' },
  4: { label: 'Ultra-Processed', description: 'Highly processed with artificial additives. Limit consumption.' },
};

// Grade thresholds based on overall score (0-100)
function getGrade(score: number): { grade: string; color: string; label: string } {
  if (score >= 80) return { grade: 'A', color: '#2ecc71', label: 'Excellent' };
  if (score >= 65) return { grade: 'B', color: '#27ae60', label: 'Good' };
  if (score >= 50) return { grade: 'C', color: '#f39c12', label: 'Fair' };
  if (score >= 35) return { grade: 'D', color: '#e67e22', label: 'Poor' };
  return { grade: 'E', color: '#e74c3c', label: 'Very Poor' };
}

// Calculate negative points (unhealthy components)
function calculateNegativePoints(n: Nutriments): number {
  let points = 0;
  const sugars = safeNum(n.sugars_100g);
  const satFat = safeNum(n.saturated_fat_100g);
  const sodium = safeNum(n.sodium_100g) || safeNum(n.salt_100g ? n.salt_100g / 2.5 : 0);

  // Sugar points (0-10)
  if (sugars >= INDIAN_THRESHOLDS.sugar.veryHigh) points += 10;
  else if (sugars >= INDIAN_THRESHOLDS.sugar.high) points += 7;
  else if (sugars >= INDIAN_THRESHOLDS.sugar.low) points += 4;
  else points += 1;

  // Saturated fat points (0-10)
  if (satFat >= INDIAN_THRESHOLDS.saturatedFat.veryHigh) points += 10;
  else if (satFat >= INDIAN_THRESHOLDS.saturatedFat.high) points += 7;
  else if (satFat >= INDIAN_THRESHOLDS.saturatedFat.low) points += 4;
  else points += 1;

  // Sodium points (0-10)
  if (sodium >= INDIAN_THRESHOLDS.sodium.veryHigh) points += 10;
  else if (sodium >= INDIAN_THRESHOLDS.sodium.high) points += 7;
  else if (sodium >= INDIAN_THRESHOLDS.sodium.low) points += 4;
  else points += 1;

  return points;
}

// Calculate positive points (healthy components)
function calculatePositivePoints(n: Nutriments): number {
  let points = 0;
  const fiber = safeNum(n.fiber_100g);
  const protein = safeNum(n.proteins_100g);
  const fruitsVeg = safeNum(n.fruits_vegetables_nuts_100g);

  // Fiber points (0-5)
  if (fiber >= INDIAN_THRESHOLDS.fiber.excellent) points += 5;
  else if (fiber >= INDIAN_THRESHOLDS.fiber.good) points += 3;
  else if (fiber >= INDIAN_THRESHOLDS.fiber.low) points += 2;

  // Protein points (0-5)
  if (protein >= INDIAN_THRESHOLDS.protein.excellent) points += 5;
  else if (protein >= INDIAN_THRESHOLDS.protein.good) points += 3;
  else if (protein >= INDIAN_THRESHOLDS.protein.low) points += 1;

  // Fruits/vegetables/nuts points (0-5)
  if (fruitsVeg >= 80) points += 5;
  else if (fruitsVeg >= 60) points += 3;
  else if (fruitsVeg >= 40) points += 1;

  return points;
}

// NOVA penalty/bonus
function getNOVAScore(novaGroup: number | undefined): number {
  switch (novaGroup) {
    case 1: return 15;
    case 2: return 10;
    case 3: return 5;
    case 4: return -5;
    default: return 0;
  }
}

// Generate nutrient scores for display
function getNutrientScores(n: Nutriments): NutrientScore[] {
  const scores: NutrientScore[] = [];

  // Sugar
  const sugars = safeNum(n.sugars_100g);
  const sugarScore = Math.min(10, Math.max(0, 10 - (sugars / 2.5)));
  scores.push({
    name: 'Sugar',
    value: sugars,
    unit: 'g',
    score: sugarScore,
    maxScore: 10,
    color: sugars <= INDIAN_THRESHOLDS.sugar.low ? '#2ecc71' : sugars <= INDIAN_THRESHOLDS.sugar.high ? '#f39c12' : '#e74c3c',
    label: sugars <= INDIAN_THRESHOLDS.sugar.low ? 'Low' : sugars <= INDIAN_THRESHOLDS.sugar.high ? 'Moderate' : 'High',
  });

  // Saturated Fat
  const satFat = safeNum(n.saturated_fat_100g);
  const satFatScore = Math.min(10, Math.max(0, 10 - (satFat / 1)));
  scores.push({
    name: 'Saturated Fat',
    value: satFat,
    unit: 'g',
    score: satFatScore,
    maxScore: 10,
    color: satFat <= INDIAN_THRESHOLDS.saturatedFat.low ? '#2ecc71' : satFat <= INDIAN_THRESHOLDS.saturatedFat.high ? '#f39c12' : '#e74c3c',
    label: satFat <= INDIAN_THRESHOLDS.saturatedFat.low ? 'Low' : satFat <= INDIAN_THRESHOLDS.saturatedFat.high ? 'Moderate' : 'High',
  });

  // Sodium
  const sodium = safeNum(n.sodium_100g) || safeNum(n.salt_100g ? n.salt_100g / 2.5 : 0);
  const sodiumScore = Math.min(10, Math.max(0, 10 - (sodium / 0.06)));
  scores.push({
    name: 'Sodium',
    value: Math.round(sodium * 1000),
    unit: 'mg',
    score: sodiumScore,
    maxScore: 10,
    color: sodium <= INDIAN_THRESHOLDS.sodium.low ? '#2ecc71' : sodium <= INDIAN_THRESHOLDS.sodium.high ? '#f39c12' : '#e74c3c',
    label: sodium <= INDIAN_THRESHOLDS.sodium.low ? 'Low' : sodium <= INDIAN_THRESHOLDS.sodium.high ? 'Moderate' : 'High',
  });

  // Fiber
  const fiber = safeNum(n.fiber_100g);
  const fiberScore = Math.min(10, Math.max(0, (fiber / 0.6)));
  scores.push({
    name: 'Fiber',
    value: fiber,
    unit: 'g',
    score: fiberScore,
    maxScore: 10,
    color: fiber >= INDIAN_THRESHOLDS.fiber.good ? '#2ecc71' : fiber >= INDIAN_THRESHOLDS.fiber.low ? '#f39c12' : '#e74c3c',
    label: fiber >= INDIAN_THRESHOLDS.fiber.good ? 'Good' : fiber >= INDIAN_THRESHOLDS.fiber.low ? 'Moderate' : 'Low',
  });

  // Protein
  const protein = safeNum(n.proteins_100g);
  const proteinScore = Math.min(10, Math.max(0, (protein / 1.2)));
  scores.push({
    name: 'Protein',
    value: protein,
    unit: 'g',
    score: proteinScore,
    maxScore: 10,
    color: protein >= INDIAN_THRESHOLDS.protein.good ? '#2ecc71' : protein >= INDIAN_THRESHOLDS.protein.low ? '#f39c12' : '#e74c3c',
    label: protein >= INDIAN_THRESHOLDS.protein.good ? 'Good' : protein >= INDIAN_THRESHOLDS.protein.low ? 'Moderate' : 'Low',
  });

  return scores;
}

// Generate warnings based on nutritional content
function generateWarnings(n: Nutriments, novaGroup?: number): string[] {
  const warnings: string[] = [];
  const sugars = safeNum(n.sugars_100g);
  const satFat = safeNum(n.saturated_fat_100g);
  const sodium = safeNum(n.sodium_100g) || safeNum(n.salt_100g ? n.salt_100g / 2.5 : 0);

  if (sugars >= INDIAN_THRESHOLDS.sugar.veryHigh) {
    warnings.push(`High sugar: ${sugars}g per 100g (WHO recommends <25g/day)`);
  }
  if (satFat >= INDIAN_THRESHOLDS.saturatedFat.veryHigh) {
    warnings.push(`High saturated fat: ${satFat}g per 100g (limit <22g/day)`);
  }
  if (sodium >= INDIAN_THRESHOLDS.sodium.veryHigh) {
    warnings.push(`High sodium: ${Math.round(sodium * 1000)}mg per 100g (limit <2000mg/day)`);
  }
  if (novaGroup === 4) {
    warnings.push('Ultra-processed food (NOVA Group 4) - linked to health risks');
  }
  if (n.energy_100g && n.energy_100g > 500) {
    warnings.push(`High energy: ${n.energy_100g} kcal per 100g`);
  }

  return warnings;
}

// Generate positives
function generatePositives(n: Nutriments, novaGroup?: number): string[] {
  const positives: string[] = [];
  const fiber = safeNum(n.fiber_100g);
  const protein = safeNum(n.proteins_100g);
  const sugars = safeNum(n.sugars_100g);
  const satFat = safeNum(n.saturated_fat_100g);

  if (fiber >= INDIAN_THRESHOLDS.fiber.good) {
    positives.push(`Good source of fiber: ${fiber}g per 100g`);
  }
  if (protein >= INDIAN_THRESHOLDS.protein.good) {
    positives.push(`High protein: ${protein}g per 100g`);
  }
  if (sugars <= INDIAN_THRESHOLDS.sugar.low) {
    positives.push(`Low sugar: ${sugars}g per 100g`);
  }
  if (satFat <= INDIAN_THRESHOLDS.saturatedFat.low) {
    positives.push(`Low saturated fat: ${satFat}g per 100g`);
  }
  if (novaGroup === 1) {
    positives.push('Unprocessed whole food (NOVA Group 1)');
  }

  return positives;
}

// Main scoring function
export function calculateFoodScore(product: Product): FoodScoreResult {
  try {
    // Always ensure nutriments is a safe object — never undefined/null
    let nutriments: Nutriments = safeNutriments(product?.nutriments);

    // If nutriments are empty, try IFCT Indian food fallback
    const hasNutriments =
      nutriments.proteins_100g != null || nutriments.sugars_100g != null;
    let usedIfctFallback = false;

    if (!hasNutriments && product?.product_name) {
      try {
        const indianData = lookupIndianFood(product.product_name);
        if (indianData) {
          nutriments = { ...nutriments, ...indianData };
          usedIfctFallback = true;
        }
      } catch {
        // IFCT lookup failed — proceed with empty nutriments
      }
    }

    const novaGroup = product?.nova_group ?? 4;
    const productName = product?.product_name ?? 'Unknown product';

    // Red flag and penalty scoring
    const redFlags: string[] = [];
    const ingredients = (product?.ingredients_text || '').toLowerCase();
    const sugars = safeNum(nutriments.sugars_100g);
    const sodium = safeNum(nutriments.sodium_100g) || safeNum(nutriments.salt_100g ? nutriments.salt_100g / 2.5 : 0);
    const satFat = safeNum(nutriments.saturated_fat_100g);

    // 1. Palm Oil Check
    const usesPalmOil = ingredients.includes('palm') || ingredients.includes('palmolein') || ingredients.includes('vanaspati');
    if (usesPalmOil) {
      redFlags.push('Contains Palm Oil / Palmolein (bad for heart health and raises cholesterol)');
    }
    // 2. High Sugar Check
    if (sugars >= 25) {
      redFlags.push(`Very High sugar: ${sugars}g per 100g (exceeds recommended daily limit of 25g)`);
    }
    // 3. High Sodium Check
    if (sodium >= 0.6) {
      redFlags.push(`Very High sodium: ${Math.round(sodium * 1000)}mg per 100g (raises blood pressure)`);
    }
    // 4. High Saturated Fat Check
    if (satFat >= 10) {
      redFlags.push(`Very High saturated fat: ${satFat}g per 100g`);
    }
    // 5. Hydrogenated Fats Check
    if (ingredients.includes('hydrogenated') || ingredients.includes('vanaspati')) {
      redFlags.push('Contains Hydrogenated / Trans Fats');
    }

    // Base score = 80
    let penalties = 0;

    // Palm oil penalty
    if (usesPalmOil) penalties += 25;

    // Sugars penalty
    if (sugars >= 25) penalties += 20;
    else if (sugars > 5) penalties += (sugars - 5) * 0.8;

    // Sodium penalty
    if (sodium >= 0.6) penalties += 20;
    else if (sodium > 0.1) penalties += (sodium - 0.1) * 30;

    // Saturated fat penalty
    if (satFat >= 10) penalties += 15;
    else if (satFat > 1.5) penalties += (satFat - 1.5) * 1.5;

    // NOVA processing penalty
    if (novaGroup === 4) penalties += 15;
    else if (novaGroup === 3) penalties += 5;

    // Credits:
    let credits = 0;
    const protein = safeNum(nutriments.proteins_100g);
    const fiber = safeNum(nutriments.fiber_100g);
    const fruitsVeg = safeNum(nutriments.fruits_vegetables_nuts_100g);

    if (protein > 0) credits += Math.min(10, protein * 1.0);
    if (fiber > 0) credits += Math.min(10, fiber * 1.5);
    if (fruitsVeg >= 40) credits += Math.min(10, (fruitsVeg / 10));

    // NOVA Group 1 bonus
    if (novaGroup === 1) credits += 10;

    let overallScore = 80 - penalties + credits;

    // CAP the score if there is a major red flag
    if (sugars >= 40 || sodium >= 1.0) {
      overallScore = Math.min(30, overallScore); // Force Grade E for extreme cases
    } else if (usesPalmOil || sugars >= 25 || sodium >= 0.6) {
      overallScore = Math.min(45, overallScore); // Force Grade D/E
    }

    overallScore = Math.max(0, Math.min(100, overallScore));
    if (!isFinite(overallScore)) overallScore = 50;

    const { grade, color, label } = getGrade(overallScore);
    const novaInfo = NOVA_LABELS[novaGroup] ?? NOVA_LABELS[4];
    const nutrientScores = getNutrientScores(nutriments);
    
    // Add red flags to warnings list so they also show up in health warnings tab
    const baseWarnings = generateWarnings(nutriments, novaGroup);
    const filteredBaseWarnings = baseWarnings.filter(bw => {
      const bwLower = bw.toLowerCase();
      if (bwLower.includes('sugar') && redFlags.some(rf => rf.toLowerCase().includes('sugar'))) return false;
      if (bwLower.includes('sodium') && redFlags.some(rf => rf.toLowerCase().includes('sodium'))) return false;
      if (bwLower.includes('saturated fat') && redFlags.some(rf => rf.toLowerCase().includes('saturated fat'))) return false;
      return true;
    });
    const warnings = Array.from(new Set([...redFlags, ...filteredBaseWarnings]));
    const positives = generatePositives(nutriments, novaGroup);

    // Generate feedback (combines key positive and warning)
    const feedback = positives.length > 0 && warnings.length > 0
      ? positives[0] + '. ' + warnings[0]
      : positives.length > 0
        ? positives[0]
        : warnings.length > 0
          ? warnings[0]
          : 'No specific feedback.';

    // Generate summary
    let summary = productName + ' scores ' + Math.round(overallScore) + '/100 (' + grade + '). ';
    if (positives.length > 0) {
      summary += positives[0] + '. ';
    }
    if (warnings.length > 0) {
      summary += warnings[0];
    }

    // Safety recommendations & alternatives
    const safetyRecommendation = calculateSafetyRecommendation(nutriments, product, novaGroup, overallScore, redFlags);
    const healthyAlternatives = getHealthyAlternatives(productName, product?.categories);

    return {
      dataSource: usedIfctFallback ? 'ifct_fallback' : 'openfoodfacts',
      product,
      overallScore,
      negativePoints: penalties,
      positivePoints: credits,
      grade,
      gradeColor: color,
      gradeLabel: label,
      novaGroup,
      novaLabel: novaInfo.label,
      novaDescription: novaInfo.description,
      novaScore: novaGroup === 1 ? 10 : 0,
      nutrientScores,
      warnings,
      positives,
      feedback,
      summary,
      safetyRecommendation,
      healthyAlternatives,
    };
  } catch (err) {
    console.error('[scoring] calculateFoodScore failed:', err);
    return {
      dataSource: 'openfoodfacts',
      product,
      overallScore: 50,
      negativePoints: 0,
      positivePoints: 0,
      grade: 'C',
      gradeColor: '#f39c12',
      gradeLabel: 'Fair',
      novaGroup: product?.nova_group ?? 4,
      novaLabel: 'Unknown',
      novaDescription: 'Could not compute score for this product.',
      novaScore: 0,
      nutrientScores: [],
      warnings: [],
      positives: [],
      feedback: 'Nutritional data unavailable for this product.',
      summary: 'Score could not be computed.',
    };
  }
}

export function getHealthyAlternatives(productName: string, categoryText?: string): HealthyAlternative[] {
  const name = (productName + ' ' + (categoryText || '')).toLowerCase();
  
  if (name.includes('noodle') || name.includes('maggi') || name.includes('ramen')) {
    return [
      { name: '🌾 Whole Wheat / Atta Noodles (No Palm Oil)', grade: 'B', gradeColor: '#27ae60', reason: 'Made with whole wheat flour, high in fiber, and baked/air-dried rather than palm oil fried.' },
      { name: '🌱 Millet Noodles (Ragi/Jowar)', grade: 'A', gradeColor: '#2ecc71', reason: 'Rich in fiber and minerals, low glycemic index, and baked with clean ingredients.' },
    ];
  }
  if (name.includes('biscuit') || name.includes('cookie') || name.includes('good day') || name.includes('parle') || name.includes('marie') || name.includes('bourbon')) {
    return [
      { name: '🌾 Oats / Ragi Digestive Biscuits (No Palm Oil)', grade: 'B', gradeColor: '#27ae60', reason: 'High fiber, lower sugar, and usually baked with whole grains.' },
      { name: '🥜 Roasted Makhana (Foxnuts)', grade: 'A', gradeColor: '#2ecc71', reason: 'Naturally low in fat, zero sugar, high in protein, and rich in calcium.' },
    ];
  }
  if (name.includes('chip') || name.includes('wafer') || name.includes('kurkure') || name.includes('churkur') || name.includes('namkeen') || name.includes('snack') || name.includes('pataka') || name.includes('crunch') || name.includes('puff') || name.includes('potato')) {
    return [
      { name: '🥜 Roasted Chana (Bengal Gram)', grade: 'A', gradeColor: '#2ecc71', reason: 'Zero trans fats, rich in plant protein and dietary fiber, keeps you full longer.' },
      { name: '🍿 Air-popped Popcorn / Makhana', grade: 'A', gradeColor: '#2ecc71', reason: 'Light, crunchy, low calorie snack. Make sure it is salted lightly without butter.' },
    ];
  }
  if (name.includes('drink') || name.includes('cola') || name.includes('sting') || name.includes('energy') || name.includes('soda') || name.includes('juice') || name.includes('beverage') || name.includes('thums up')) {
    return [
      { name: '🥥 Fresh Tender Coconut Water', grade: 'A', gradeColor: '#2ecc71', reason: 'Natural electrolytes, hydration, and zero added sugars.' },
      { name: '🥛 Buttermilk (Chaas) / Low Sugar Lassi', grade: 'A', gradeColor: '#2ecc71', reason: 'Probiotic benefits, cooling, protein-rich, and free from synthetic preservatives.' },
    ];
  }
  return [
    { name: '🥜 Roasted Almonds / Walnuts', grade: 'A', gradeColor: '#2ecc71', reason: 'Rich in healthy fats (omega-3), protein, and vitamins. Great for energy.' },
    { name: '🍿 Roasted Makhana (Foxnuts)', grade: 'A', gradeColor: '#2ecc71', reason: 'Crispy, low-calorie, rich in calcium and antioxidants.' },
  ];
}

function calculateSafetyRecommendation(
  n: Nutriments,
  product: Product,
  novaGroup: number,
  overallScore: number,
  redFlags: string[]
): SafetyRecommendation {
  const sugars = safeNum(n.sugars_100g);
  const satFat = safeNum(n.saturated_fat_100g);
  const sodium = safeNum(n.sodium_100g) || safeNum(n.salt_100g ? n.salt_100g / 2.5 : 0);
  const ingredients = (product.ingredients_text || '').toLowerCase();
  const name = (product.product_name || '').toLowerCase();

  const hasPalmOil = redFlags.some(flag => flag.toLowerCase().includes('palm') || flag.toLowerCase().includes('palmolein') || flag.toLowerCase().includes('vanaspati'));
  const hasHighSugar = sugars > 15;
  const hasHighSodium = sodium > 0.3;
  const hasCaffeine = ingredients.includes('caffeine') || name.includes('sting') || name.includes('energy drink') || name.includes('red bull');

  // 1. High risk groups
  const highRiskGroups: string[] = [];
  if (hasHighSugar) {
    highRiskGroups.push('Diabetics', 'Young Children', 'Weight Watchers');
  }
  if (hasHighSodium) {
    highRiskGroups.push('Hypertension Patients', 'Heart Patients', 'Elderly');
  }
  if (hasPalmOil || satFat > 8) {
    highRiskGroups.push('Heart Patients', 'High Cholesterol Patients');
  }
  if (hasCaffeine) {
    highRiskGroups.push('Pregnant Women', 'Children', 'Caffeine-sensitive individuals');
  }
  if (novaGroup === 4 && highRiskGroups.length === 0) {
    highRiskGroups.push('Young Children');
  }

  // 2. Daily portion recommendation
  // WHO/FSSAI thresholds: max 25g sugar, 22g sat fat, 2g sodium (5g salt) per day from food
  let sugarLimit = sugars > 0 ? (25 / sugars) * 100 : 500;
  let satFatLimit = satFat > 0 ? (22 / satFat) * 100 : 500;
  let sodiumLimit = sodium > 0 ? (2 / sodium) * 100 : 500;

  let maxPortion = Math.min(sugarLimit, satFatLimit, sodiumLimit);

  // Cap it based on score and processing
  if (novaGroup === 4) {
    if (overallScore < 35) {
      maxPortion = Math.min(maxPortion, 25); // very small portion for dangerous foods
    } else if (overallScore < 50) {
      maxPortion = Math.min(maxPortion, 35);
    } else {
      maxPortion = Math.min(maxPortion, 50); // cap ultra-processed at 50g daily
    }
  } else if (novaGroup === 3) {
    maxPortion = Math.min(maxPortion, 100);
  }

  let dailyLimit = '';
  if (novaGroup === 1 && sugars < 5 && sodium < 0.1) {
    dailyLimit = 'Can be consumed freely as part of a balanced diet (standard portion ~150g-200g)';
  } else {
    const roundedLimit = Math.round(maxPortion / 5) * 5;
    if (roundedLimit <= 15) {
      dailyLimit = 'Strictly limit. If consumed, eat at most 10g-15g (a tiny bite)';
    } else {
      let servingEst = '';
      if (name.includes('biscuit') || name.includes('cookie')) {
        const count = Math.max(1, Math.round(roundedLimit / 10));
        servingEst = ` (approx. ${count} biscuit${count > 1 ? 's' : ''})`;
      } else if (name.includes('noodle') || name.includes('maggi')) {
        servingEst = ' (approx. 1/3 pack of cooked noodles)';
      } else if (name.includes('chip') || name.includes('kurkure') || name.includes('namkeen')) {
        servingEst = ' (approx. a small handful)';
      } else if (name.includes('drink') || name.includes('cola') || name.includes('sting') || name.includes('energy')) {
        servingEst = ` (approx. ${Math.round(roundedLimit)}ml - half a glass)`;
      }
      dailyLimit = `Max ${roundedLimit}g per day${servingEst}`;
    }
  }

  // 3. Weekly Frequency
  let weeklyFrequency = '';
  if (overallScore >= 80) {
    weeklyFrequency = 'Daily / Regular consumption is safe (4-7 times a week)';
  } else if (overallScore >= 65) {
    weeklyFrequency = 'Moderate consumption (3-4 times a week)';
  } else if (overallScore >= 50) {
    weeklyFrequency = 'Occasional treat (1-2 times a week)';
  } else if (overallScore >= 35) {
    weeklyFrequency = 'Limit to once a week or less (Rare treat)';
  } else {
    weeklyFrequency = 'Avoid completely or consume at most once a month as a rare treat';
  }

  return {
    dailyLimit,
    weeklyFrequency,
    highRiskGroups,
    hasRedFlags: redFlags.length > 0,
    redFlags,
  };
}
