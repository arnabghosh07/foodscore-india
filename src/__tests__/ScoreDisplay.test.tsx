// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ScoreDisplay from '@/components/ScoreDisplay';
import { FoodScoreResult } from '@/lib/types';

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = vi.fn();

// Mock searchProducts to prevent real API calls
const mockSearchProducts = vi.fn().mockResolvedValue([]);
vi.mock('@/lib/api', () => ({
  searchProducts: (...args: unknown[]) => mockSearchProducts(...args),
}));

// Mock ShareCard to avoid clipboard API issues
vi.mock('@/components/ShareCard', () => ({
  default: ({ result }: { result: FoodScoreResult }) => (
    <div data-testid="share-card">ShareCard for {result.product.product_name}</div>
  ),
}));

// Mock FoodChat to avoid DOM issues
vi.mock('@/components/FoodChat', () => ({
  default: () => <div data-testid="food-chat" />,
}));

function createMockResult(overrides?: Partial<FoodScoreResult>): FoodScoreResult {
  return {
    dataSource: 'openfoodfacts',
    product: {
      code: '5901234123457',
      product_name: 'Test Biscuit',
      brands: 'Test Brand',
      categories: 'Biscuits',
      image_front_url: 'https://example.com/img.jpg',
      ingredients_text: 'Flour, sugar, palm oil',
      nutriments: {
        sugars_100g: 15,
        saturated_fat_100g: 5,
        sodium_100g: 0.3,
        proteins_100g: 5,
        fiber_100g: 2,
        energy_100g: 450,
        carbohydrates_100g: 60,
        fat_100g: 12,
      },
    },
    overallScore: 45,
    negativePoints: 20,
    positivePoints: 5,
    grade: 'D',
    gradeColor: '#e67e22',
    gradeLabel: 'Poor',
    novaGroup: 4,
    novaLabel: 'Ultra-Processed',
    novaDescription: 'Highly processed with artificial additives.',
    novaScore: 0,
    nutrientScores: [
      { name: 'Sugar', value: 15, unit: 'g', score: 4, maxScore: 10, color: '#f39c12', label: 'Moderate' },
      { name: 'Saturated Fat', value: 5, unit: 'g', score: 5, maxScore: 10, color: '#f39c12', label: 'Moderate' },
      { name: 'Sodium', value: 300, unit: 'mg', score: 5, maxScore: 10, color: '#f39c12', label: 'Moderate' },
      { name: 'Fiber', value: 2, unit: 'g', score: 3, maxScore: 10, color: '#f39c12', label: 'Moderate' },
      { name: 'Protein', value: 5, unit: 'g', score: 4, maxScore: 10, color: '#f39c12', label: 'Moderate' },
    ],
    warnings: ['High sugar: 15g per 100g'],
    positives: ['Good source of fiber: 2g per 100g'],
    feedback: 'Good source of fiber. High sugar detected.',
    summary: 'Test Biscuit scores 45/100 (D). Good source of fiber. High sugar detected.',
    safetyRecommendation: {
      dailyLimit: 'Max 30g per day (approx. 3 biscuits)',
      weeklyFrequency: 'Limit to once a week or less (Rare treat)',
      highRiskGroups: ['Diabetics', 'Young Children', 'Weight Watchers'],
      hasRedFlags: true,
      redFlags: ['Very High sugar: 15g per 100g'],
    },
    healthyAlternatives: [
      { name: 'Oats Biscuit', grade: 'B', gradeColor: '#27ae60', reason: 'High fiber, lower sugar' },
      { name: 'Roasted Makhana', grade: 'A', gradeColor: '#2ecc71', reason: 'Low calorie, high protein' },
    ],
    ...overrides,
  };
}

describe('ScoreDisplay', () => {
  // Helper: render and flush async effects (useEffect with searchProducts)
  async function renderScore(overrides?: Partial<FoodScoreResult>, onBack = vi.fn()) {
    const result = createMockResult(overrides);
    render(<ScoreDisplay result={result} onBack={onBack} />);
    await waitFor(() => {});
    return { result, onBack };
  }

  describe('product card', () => {
    it('should render product name and brand', async () => {
      const { result } = await renderScore();
      expect(screen.getByText('Test Biscuit')).toBeInTheDocument();
      expect(screen.getByText('Test Brand')).toBeInTheDocument();
    });

    it('should render product image when available', async () => {
      const { result } = await renderScore();
      const img = screen.getByRole('img', { name: 'Test Biscuit' });
      // next/image rewrites src to /_next/image?url=...
      expect(img).toHaveAttribute('src', expect.stringContaining('example.com%2Fimg.jpg'));
    });

    it('should render categories when available', async () => {
      await renderScore();
      expect(screen.getByText('Biscuits')).toBeInTheDocument();
    });

    it('should not render image when image_front_url is missing', async () => {
      await renderScore({
        product: { ...createMockResult().product, image_front_url: undefined },
      });
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('score circle', () => {
    it('should display the score number', async () => {
      await renderScore({ overallScore: 72 });
      expect(screen.getByText('72')).toBeInTheDocument();
      expect(screen.getByText('out of 100')).toBeInTheDocument();
    });

    it('should display grade badge with label', async () => {
      await renderScore({ grade: 'A', gradeLabel: 'Excellent', gradeColor: '#2ecc71' });
      expect(screen.getByText('A — Excellent')).toBeInTheDocument();
    });

    it('should display summary text', async () => {
      await renderScore();
      expect(screen.getByText(/Test Biscuit scores 45\/100/)).toBeInTheDocument();
    });

    it('should show "Score unavailable" when scoringFailed is true', async () => {
      await renderScore({ scoringFailed: true });
      expect(screen.getByText('Score unavailable')).toBeInTheDocument();
      expect(screen.getByText(/health score could not be computed/)).toBeInTheDocument();
    });
  });

  describe('tab switching', () => {
    it('should default to overview tab', async () => {
      await renderScore();
      expect(screen.getByText('Good Points')).toBeInTheDocument();
      expect(screen.getByText('Health Warnings')).toBeInTheDocument();
    });

    it('should switch to details tab', async () => {
      await renderScore();
      fireEvent.click(screen.getByText('Details'));
      expect(screen.getByText('Energy')).toBeInTheDocument();
    });

    it('should switch to about tab', async () => {
      await renderScore();
      fireEvent.click(screen.getByText('About'));
      expect(screen.getByText('How this score works')).toBeInTheDocument();
    });
  });

  describe('overview tab content', () => {
    it('should show red flags when hasRedFlags is true', async () => {
      await renderScore();
      expect(screen.getByText('CRITICAL RED FLAGS')).toBeInTheDocument();
      expect(screen.getByText(/Very High sugar/)).toBeInTheDocument();
    });

    it('should show consumption guidelines', async () => {
      await renderScore();
      expect(screen.getByText('Consumption Guidelines')).toBeInTheDocument();
      expect(screen.getByText('Max 30g per day (approx. 3 biscuits)')).toBeInTheDocument();
      expect(screen.getByText('Limit to once a week or less (Rare treat)')).toBeInTheDocument();
    });

    it('should show high risk groups', async () => {
      await renderScore();
      expect(screen.getByText('Who should limit/avoid:')).toBeInTheDocument();
      expect(screen.getByText('Diabetics')).toBeInTheDocument();
      expect(screen.getByText('Young Children')).toBeInTheDocument();
    });

    it('should show NOVA processing level', async () => {
      await renderScore();
      expect(screen.getByText('Processing Level')).toBeInTheDocument();
      expect(screen.getByText('Ultra-Processed')).toBeInTheDocument();
      expect(screen.getByText('NOVA Group 4')).toBeInTheDocument();
    });

    it('should show positives section', async () => {
      await renderScore();
      const positivesSection = screen.getByText('Good Points').closest('div')!;
      expect(within(positivesSection).getByText(/Good source of fiber/)).toBeInTheDocument();
    });

    it('should show warnings section', async () => {
      await renderScore();
      const warningsSection = screen.getByText('Health Warnings').closest('div')!;
      expect(within(warningsSection).getByText(/High sugar/)).toBeInTheDocument();
    });

    it('should show healthy alternatives', async () => {
      await renderScore();
      expect(screen.getByText('Healthier Alternatives')).toBeInTheDocument();
      expect(screen.getByText('Oats Biscuit')).toBeInTheDocument();
      expect(screen.getByText('Roasted Makhana')).toBeInTheDocument();
    });

    it('should show nutrition panel', async () => {
      await renderScore();
      expect(screen.getByText('Nutrition per 100g')).toBeInTheDocument();
    });

    it('should show ingredients when available', async () => {
      await renderScore();
      expect(screen.getByText('Ingredients')).toBeInTheDocument();
      expect(screen.getByText('Flour, sugar, palm oil')).toBeInTheDocument();
    });
  });

  describe('callbacks', () => {
    it('should call onBack when back button is clicked', async () => {
      const onBack = vi.fn();
      await renderScore(undefined, onBack);
      const header = screen.getByText('Health Score').closest('div')!;
      const backButton = within(header).getByRole('button');
      fireEvent.click(backButton);
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('scoringFailed state', () => {
    it('should not show red flags when scoringFailed', async () => {
      await renderScore({ scoringFailed: true });
      expect(screen.queryByText('CRITICAL RED FLAGS')).not.toBeInTheDocument();
    });

    it('should not show consumption guidelines when scoringFailed', async () => {
      await renderScore({ scoringFailed: true });
      expect(screen.queryByText('Consumption Guidelines')).not.toBeInTheDocument();
    });

    it('should not show NOVA level when scoringFailed', async () => {
      await renderScore({ scoringFailed: true });
      expect(screen.queryByText('Processing Level')).not.toBeInTheDocument();
    });
  });
});
