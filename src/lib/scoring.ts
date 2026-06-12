import { Product, FoodScoreResult, NutrientScore, Nutriments } from './types';
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

    // Base score from Nutri-Score methodology
    const negativePoints = calculateNegativePoints(nutriments);
    const positivePoints = calculatePositivePoints(nutriments);
    const novaScore = getNOVAScore(novaGroup);

    // Calculate overall score (0-100)
    // Formula: 50 (base) + positive - negative + nova bonus
    let overallScore = 50 + positivePoints - negativePoints + novaScore;
    overallScore = Math.max(0, Math.min(100, overallScore));
    if (!isFinite(overallScore)) overallScore = 50;

    const { grade, color, label } = getGrade(overallScore);
    const novaInfo = NOVA_LABELS[novaGroup] ?? NOVA_LABELS[4];
    const nutrientScores = getNutrientScores(nutriments);
    const warnings = generateWarnings(nutriments, novaGroup);
    const positives = generatePositives(nutriments, novaGroup);

    // Generate feedback (combines key positive and warning)
    const feedback = positives.length > 0 && warnings.length > 0
      ? positives[0] + '. ' + warnings[0]
      : positives.length > 0
        ? positives[0]
        : warnings.length > 0
          ? warnings[0]
          : 'No specific feedback.';

    const productName = product?.product_name ?? 'Unknown product';

    // Generate summary
    let summary = productName + ' scores ' + Math.round(overallScore) + '/100 (' + grade + '). ';
    if (positives.length > 0) {
      summary += positives[0] + '. ';
    }
    if (warnings.length > 0) {
      summary += warnings[0];
    }

    return {
      dataSource: usedIfctFallback ? 'ifct_fallback' : 'openfoodfacts',
      product,
      overallScore,
      negativePoints,
      positivePoints,
      grade,
      gradeColor: color,
      gradeLabel: label,
      novaGroup,
      novaLabel: novaInfo.label,
      novaDescription: novaInfo.description,
      novaScore,
      nutrientScores,
      warnings,
      positives,
      feedback,
      summary,
    };
  } catch (err) {
    // Last-resort fallback: return a neutral score so the app never crashes
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
