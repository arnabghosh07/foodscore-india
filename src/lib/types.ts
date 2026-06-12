export interface Nutriments {
  energy_100g?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  sugars_100g?: number;
  fat_100g?: number;
  saturated_fat_100g?: number;
  fiber_100g?: number;
  sodium_100g?: number;
  salt_100g?: number;
  fruits_vegetables_nuts_100g?: number;
  [key: string]: number | undefined;
}

export interface Product {
  code: string;
  product_name: string;
  brands?: string;
  image_front_url?: string;
  image_nutrition_url?: string;
  nutriments: Nutriments;
  ingredients_text?: string;
  nova_group?: number;
  nutriscore_grade?: string;
  nutriscore_score?: number;
  categories?: string;
  labels?: string;
  countries_tags?: string[];
}

export interface SafetyRecommendation {
  dailyLimit: string;        // e.g. "Max 30g (approx 2 biscuits)"
  weeklyFrequency: string;   // e.g. "At most once a week"
  highRiskGroups: string[];   // e.g. ["Diabetics", "Heart Patients"]
  hasRedFlags: boolean;
  redFlags: string[];         // e.g. ["Contains Palm Oil", "High Added Sugar"]
}

export interface HealthyAlternative {
  name: string;
  grade: string;
  gradeColor: string;
  reason: string;
}

export interface FoodScoreResult {
  /** Source of nutritional data: 'openfoodfacts' from API, 'ifct_fallback' from Indian food database */
  dataSource: 'openfoodfacts' | 'ifct_fallback';
  product: Product;
  overallScore: number;
  negativePoints: number;
  positivePoints: number;
  novaScore: number;
  feedback: string;
  grade: string;
  gradeColor: string;
  gradeLabel: string;
  novaGroup: number;
  novaLabel: string;
  novaDescription: string;
  nutrientScores: NutrientScore[];
  warnings: string[];
  positives: string[];
  summary: string;
  /** True when scoring algorithm failed — product data is still valid */
  scoringFailed?: boolean;
  safetyRecommendation?: SafetyRecommendation;
  healthyAlternatives?: HealthyAlternative[];
}

export interface NutrientScore {
  name: string;
  value: number;
  unit: string;
  score: number;
  maxScore: number;
  color: string;
  label: string;
}

export interface ScanHistory {
  barcode: string;
  productName: string;
  score: number;
  grade: string;
  timestamp: number;
  imageUrl?: string;
}
