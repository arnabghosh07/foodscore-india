// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ScoreDisplay from '@/components/ScoreDisplay';
import { FoodScoreResult } from '@/lib/types';

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = vi.fn();

// Mock searchProducts to prevent real API calls
vi.mock('@/lib/api', () => ({
  searchProducts: vi.fn().mockResolvedValue([]),
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
  describe('product card', () => {
    it('should render product name and brand', () => {
      const result = createMockResult();
      render(<ScoreDisplay result={result} onBack={vi.fn()} />);
      expect(screen.getByText('Test Biscuit')).toBeInTheDocument();
      expect(screen.getByText('Test Brand')).toBeInTheDocument();
    });

    it('should render product image when available', () => {
      const result = createMockResult();
      render(<ScoreDisplay result={result} onBack={vi.fn()} />);
      // img has alt={product_name} so it gets role="img" not "presentation"
      const img = screen.getByRole('img', { name: 'Test Biscuit' });
      expect(img).toHaveAttribute('src', 'https://example.com/img.jpg');
    });

    it('should render categories when available', () => {
      const result = createMockResult();
      render(<ScoreDisplay result={result} onBack={vi.fn()} />);
      expect(screen.getByText('Biscuits')).toBeInTheDocument();
    });

    it('should not render image when image_front_url is missing', () => {
      const result = createMockResult({
        product: { ...createMockResult().product, image_front_url: undefined },
      });
      render(<ScoreDisplay result={result} onBack={vi.fn()} />);
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('score circle', () => {
    it('should display the score number', () => {
      const result = createMockResult({ overallScore: 72 });
      render(<ScoreDisplay result={result} onBack={vi.fn()} />);
      expect(screen.getByText('72')).toBeInTheDocument();
      expect(screen.getByText('out of 100')).toBeInTheDocument();
    });

    it('should display grade badge with label', () => {
      const result = createMockResult({ grade: 'A', gradeLabel: 'Excellent', gradeColor: '#2ecc71' });
      render(<ScoreDisplay result={result} onBack={vi.fn()} />);
      expect(screen.getByText('A — Excellent')).toBeInTheDocument();
    });

    it('should display summary text', () => {
      const result = createMockResult();
      render(<ScoreDisplay result={result} onBack={vi.fn()} />);
      expect(screen.getByText(/Test Biscuit scores 45\/100/)).toBeInTheDocument();
    });

    it('should show "Score unavailable" when scoringFailed is true', () => {
      const result = createMockResult({ scoringFailed: true });
      render(<ScoreDisplay result={result} onBack={vi.fn()} />);
      expect(screen.getByText('Score unavailable')).toBeInTheDocument();
      expect(screen.getByText(/health score could not be computed/)).toBeInTheDocument();
    });
  });

  describe('tab switching', () => {
    it('should default to overview tab', () => {
      const result = createMockResult();
      render(<ScoreDisplay result={result} onBack={vi.fn()} />);
      expect(screen.getByText('Good Points')).toBeInTheDocument();
      expect(screen.getByText('Health Warnings')).toBeInTheDocument();
    });

    it('should switch to details tab', () => {
      const result = createMockResult();
      render(<ScoreDisplay result={result} onBack={vi.fn()} />);
      fireEvent.click(screen.getByText('Details'));
      expect(screen.getByText('Energy')).toBeInTheDocument();
    });

    it('should switch to about tab', () => {
      const result = createMockResult();
      render(<ScoreDisplay result={result} onBack={vi.fn()} />);
      fireEvent.click(screen.getByText('About'));
      expect(screen.getByText('How this score works')).toBeInTheDocument();
    });
  });

  describe('overview tab content', () => {
    it('should show red flags when hasRedFlags is true', () => {
      const result = createMockResult();
      render(<ScoreDisplay result={result} onBack={vi.fn()} />);
      expect(screen.getByText('CRITICAL RED FLAGS')).toBeInTheDocument();
      expect(screen.getByText(/Very High sugar/)).toBeInTheDocument();
    });

    it('should show consumption guidelines', () => {
      const result = createMockResult();
      render(<ScoreDisplay result={result} onBack={vi.fn()} />);
      expect(screen.getByText('Consumption Guidelines')).toBeInTheDocument();
      expect(screen.getByText('Max 30g per day (approx. 3 biscuits)')).toBeInTheDocument();
      expect(screen.getByText('Limit to once a week or less (Rare treat)')).toBeInTheDocument();
    });

    it('should show high risk groups', () => {
      const result = createMockResult();
      render(<ScoreDisplay result={result} onBack={vi.fn()} />);
      expect(screen.getByText('Who should limit/avoid:')).toBeInTheDocument();
      expect(screen.getByText('Diabetics')).toBeInTheDocument();
      expect(screen.getByText('Young Children')).toBeInTheDocument();
    });

    it('should show NOVA processing level', () => {
      const result = createMockResult();
      render(<ScoreDisplay result={result} onBack={vi.fn()} />);
      expect(screen.getByText('Processing Level')).toBeInTheDocument();
      expect(screen.getByText('Ultra-Processed')).toBeInTheDocument();
      expect(screen.getByText('NOVA Group 4')).toBeInTheDocument();
    });

    it('should show positives section', async () => {
      const result = createMockResult();
      await act(async () => {
        render(<ScoreDisplay result={result} onBack={vi.fn()} />);
      });
      expect(screen.getByText('Good Points')).toBeInTheDocument();
      // Check the li element containing the positive (not the summary)
      const positivesHeading = screen.getByText('Good Points');
      const positivesList = positivesHeading.closest('div')!.querySelector('ul');
      expect(positivesList).toBeTruthy();
      expect(positivesList!.textContent).toContain('Good source of fiber');
    });

    it('should show warnings section', async () => {
      const result = createMockResult();
      await act(async () => {
        render(<ScoreDisplay result={result} onBack={vi.fn()} />);
      });
      expect(screen.getByText('Health Warnings')).toBeInTheDocument();
      // Check the li element containing the warning (not the summary)
      const warningsHeading = screen.getByText('Health Warnings');
      const warningsList = warningsHeading.closest('div')!.querySelector('ul');
      expect(warningsList).toBeTruthy();
      expect(warningsList!.textContent).toContain('High sugar');
    });

    it('should show healthy alternatives', () => {
      const result = createMockResult();
      render(<ScoreDisplay result={result} onBack={vi.fn()} />);
      expect(screen.getByText('Healthier Alternatives')).toBeInTheDocument();
      expect(screen.getByText('Oats Biscuit')).toBeInTheDocument();
      expect(screen.getByText('Roasted Makhana')).toBeInTheDocument();
    });

    it('should show nutrition panel', () => {
      const result = createMockResult();
      render(<ScoreDisplay result={result} onBack={vi.fn()} />);
      expect(screen.getByText('Nutrition per 100g')).toBeInTheDocument();
    });

    it('should show ingredients when available', () => {
      const result = createMockResult();
      render(<ScoreDisplay result={result} onBack={vi.fn()} />);
      expect(screen.getByText('Ingredients')).toBeInTheDocument();
      expect(screen.getByText('Flour, sugar, palm oil')).toBeInTheDocument();
    });
  });

  describe('callbacks', () => {
    it('should call onBack when back button is clicked', () => {
      const onBack = vi.fn();
      const result = createMockResult();
      render(<ScoreDisplay result={result} onBack={onBack} />);
      // The back button is the first button in the header with the chevron SVG
      const header = screen.getByText('Health Score').closest('div')!;
      const backButton = header.querySelector('button')!;
      fireEvent.click(backButton);
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('scoringFailed state', () => {
    it('should not show red flags when scoringFailed', () => {
      const result = createMockResult({ scoringFailed: true });
      render(<ScoreDisplay result={result} onBack={vi.fn()} />);
      expect(screen.queryByText('CRITICAL RED FLAGS')).not.toBeInTheDocument();
    });

    it('should not show consumption guidelines when scoringFailed', () => {
      const result = createMockResult({ scoringFailed: true });
      render(<ScoreDisplay result={result} onBack={vi.fn()} />);
      expect(screen.queryByText('Consumption Guidelines')).not.toBeInTheDocument();
    });

    it('should not show NOVA level when scoringFailed', () => {
      const result = createMockResult({ scoringFailed: true });
      render(<ScoreDisplay result={result} onBack={vi.fn()} />);
      expect(screen.queryByText('Processing Level')).not.toBeInTheDocument();
    });
  });
});
