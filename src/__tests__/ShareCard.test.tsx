// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ShareCard from '@/components/ShareCard';
import { FoodScoreResult } from '@/lib/types';

// ── Canvas mock via document.createElement interception ───────────────────
// We intercept document.createElement('canvas') to return a fully mocked
// canvas object, avoiding prototype mutation which jsdom rejects.

function mockCanvasContext() {
  return {
    scale: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillRect: vi.fn(),
    fillStyle: '',
    fill: vi.fn(),
    beginPath: vi.fn(),
    roundRect: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '',
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    fillText: vi.fn(),
    font: '',
    textAlign: '',
    textBaseline: '',
    measureText: vi.fn(() => ({ width: 100 })),
  };
}

let mockToBlob: ReturnType<typeof vi.fn>;
let originalCreateElement: typeof document.createElement;

beforeEach(() => {
  mockToBlob = vi.fn((cb: BlobCallback) => {
    cb(new Blob(['fake'], { type: 'image/png' }));
  });

  originalCreateElement = document.createElement.bind(document);

  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'canvas') {
      const canvas = originalCreateElement('canvas');
      vi.spyOn(canvas, 'getContext').mockReturnValue(mockCanvasContext() as unknown as CanvasRenderingContext2D);
      canvas.toBlob = mockToBlob as typeof canvas.toBlob;
      return canvas;
    }
    return originalCreateElement(tag);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// ── Mock result factory ─────────────────────────────────────────────────
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
    nutrientScores: [],
    warnings: ['High sugar: 15g per 100g'],
    positives: ['Good source of fiber: 2g per 100g'],
    feedback: 'Good source of fiber. High sugar detected.',
    summary: 'Test Biscuit scores 45/100 (D). Good source of fiber. High sugar detected.',
    safetyRecommendation: {
      dailyLimit: 'Max 30g per day',
      weeklyFrequency: 'Limit to once a week',
      highRiskGroups: ['Diabetics'],
      hasRedFlags: true,
      redFlags: ['Very High sugar'],
    },
    healthyAlternatives: [],
    ...overrides,
  };
}

describe('ShareCard', () => {
  describe('rendering', () => {
    it('should render the share button with default text', () => {
      render(<ShareCard result={createMockResult()} />);
      expect(screen.getByText('Share Result on WhatsApp')).toBeInTheDocument();
    });

    it('should render the share button with id for external targeting', () => {
      render(<ShareCard result={createMockResult()} />);
      expect(screen.getByRole('button', { name: /share result/i })).toHaveAttribute('id', 'share-result-btn');
    });

    it('should not render the fallback panel initially', () => {
      render(<ShareCard result={createMockResult()} />);
      expect(screen.queryByText('Save Image')).not.toBeInTheDocument();
      expect(screen.queryByText('Copy Text')).not.toBeInTheDocument();
    });
  });

  describe('share flow with Web Share API', () => {
    let mockShare: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', { value: mockShare, writable: true, configurable: true });
      Object.defineProperty(navigator, 'canShare', {
        value: vi.fn().mockReturnValue(true),
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      // @ts-expect-error deleting non-configurable property in test
      delete navigator.share;
      // @ts-expect-error deleting non-configurable property in test
      delete navigator.canShare;
    });

    it('should call navigator.share when share button is clicked', async () => {
      render(<ShareCard result={createMockResult()} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Share Result on WhatsApp'));
      });
      expect(mockShare).toHaveBeenCalledTimes(1);
      expect(mockShare).toHaveBeenCalledWith(
        expect.objectContaining({ text: expect.stringContaining('Test Biscuit') })
      );
    });

    it('should show "Generating card…" while sharing', async () => {
      let resolveShare: () => void;
      mockShare.mockImplementation(() => new Promise<void>((r) => { resolveShare = r; }));

      render(<ShareCard result={createMockResult()} />);
      fireEvent.click(screen.getByText('Share Result on WhatsApp'));

      await waitFor(() => {
        expect(screen.getByText('Generating card…')).toBeInTheDocument();
      });

      act(() => { resolveShare!(); });

      await waitFor(() => {
        expect(screen.getByText('Share Result on WhatsApp')).toBeInTheDocument();
      });
    });

    it('should include grade emoji in share text', async () => {
      render(<ShareCard result={createMockResult({ grade: 'A', gradeLabel: 'Excellent' })} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Share Result on WhatsApp'));
      });
      const shareText = mockShare.mock.calls[0][0].text;
      expect(shareText).toContain('🟢');
      expect(shareText).toContain('A — Excellent');
    });
  });

  describe('clipboard fallback', () => {
    let mockWriteText: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      });
      // Remove Web Share API
      // @ts-expect-error deleting non-configurable property in test
      delete navigator.share;
    });

    it('should copy text to clipboard when share API is unavailable', async () => {
      render(<ShareCard result={createMockResult()} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Share Result on WhatsApp'));
      });
      expect(mockWriteText).toHaveBeenCalledTimes(1);
      expect(mockWriteText.mock.calls[0][0]).toContain('Test Biscuit');
    });

    it('should show fallback panel after clipboard copy', async () => {
      render(<ShareCard result={createMockResult()} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Share Result on WhatsApp'));
      });
      // Panel shows with "Save Image" and "Copied!" (copied is true initially)
      await waitFor(() => {
        expect(screen.getByText('Save Image')).toBeInTheDocument();
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    it('should show "Text copied to clipboard!" after copy', async () => {
      render(<ShareCard result={createMockResult()} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Share Result on WhatsApp'));
      });
      await waitFor(() => {
        expect(screen.getByText('✅ Text copied to clipboard!')).toBeInTheDocument();
      });
    });

    it('should dismiss the fallback panel', async () => {
      render(<ShareCard result={createMockResult()} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Share Result on WhatsApp'));
      });
      await waitFor(() => {
        expect(screen.getByText('Dismiss')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Dismiss'));
      expect(screen.queryByText('Save Image')).not.toBeInTheDocument();
    });

    it('should copy text again when Copy Text button is clicked', async () => {
      render(<ShareCard result={createMockResult()} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Share Result on WhatsApp'));
      });
      // Wait for panel, then advance past the 3s copied timeout
      await waitFor(() => {
        expect(screen.getByText('Save Image')).toBeInTheDocument();
      });
      act(() => { vi.advanceTimersByTime(3000); });
      await waitFor(() => {
        expect(screen.getByText('Copy Text')).toBeInTheDocument();
      });
      mockWriteText.mockClear();
      fireEvent.click(screen.getByText('Copy Text'));
      expect(mockWriteText).toHaveBeenCalledTimes(1);
    });

    it('should show "Copied!" after clicking Copy Text', async () => {
      render(<ShareCard result={createMockResult()} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Share Result on WhatsApp'));
      });
      // Wait for panel, then advance past the 3s copied timeout
      await waitFor(() => {
        expect(screen.getByText('Save Image')).toBeInTheDocument();
      });
      act(() => { vi.advanceTimersByTime(3000); });
      await waitFor(() => {
        expect(screen.getByText('Copy Text')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Copy Text'));
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });
  });

  describe('download', () => {
    let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
    let mockCreateObjectURL: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockRevokeObjectURL = vi.fn();
      mockCreateObjectURL = vi.fn(() => 'blob:fake-url');
      Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL, writable: true, configurable: true });
      Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL, writable: true, configurable: true });

      // Remove Web Share API so we fall through to panel
      // @ts-expect-error deleting non-configurable property in test
      delete navigator.share;
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        writable: true,
        configurable: true,
      });
    });

    it('should create a download link and trigger click', async () => {
      render(<ShareCard result={createMockResult()} />);
      // Trigger the panel to appear
      await act(async () => {
        fireEvent.click(screen.getByText('Share Result on WhatsApp'));
      });
      await waitFor(() => {
        expect(screen.getByText('Save Image')).toBeInTheDocument();
      });
      // Click Save Image
      fireEvent.click(screen.getByText('Save Image'));
      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled();
      });
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:fake-url');
    });

    it('should use product name in download filename', async () => {
      // Track the anchor created for download by wrapping click
      let capturedDownload = '';
      const originalSpy = vi.spyOn(document, 'createElement');
      const originalImpl = originalSpy.getMockImplementation()!;
      originalSpy.mockImplementation((tag: string) => {
        const el = originalImpl(tag);
        if (tag === 'a') {
          const anchor = el as unknown as HTMLAnchorElement;
          const origClick = anchor.click.bind(anchor);
          anchor.click = () => {
            capturedDownload = anchor.download;
            origClick();
          };
        }
        return el;
      });

      render(<ShareCard result={createMockResult({ product: { ...createMockResult().product, product_name: 'Masala Chips' } })} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Share Result on WhatsApp'));
      });
      await waitFor(() => {
        expect(screen.getByText('Save Image')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Save Image'));
      await waitFor(() => {
        expect(capturedDownload).toContain('masala-chips');
      });
    });
  });

  describe('share text builder', () => {
    let mockWriteText: ReturnType<typeof vi.fn>;
    let mockShare: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockWriteText = vi.fn().mockResolvedValue(undefined);
      mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      });
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(navigator, 'canShare', {
        value: vi.fn().mockReturnValue(true),
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      // @ts-expect-error deleting non-configurable property in test
      delete navigator.share;
      // @ts-expect-error deleting non-configurable property in test
      delete navigator.canShare;
    });

    it('should include product name in share text', async () => {
      render(<ShareCard result={createMockResult()} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Share Result on WhatsApp'));
      });
      const text = mockShare.mock.calls[0][0].text;
      expect(text).toContain('Test Biscuit');
    });

    it('should include score and grade in share text', async () => {
      render(<ShareCard result={createMockResult({ overallScore: 72, grade: 'B', gradeLabel: 'Good' })} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Share Result on WhatsApp'));
      });
      const text = mockShare.mock.calls[0][0].text;
      expect(text).toContain('72/100');
      expect(text).toContain('B — Good');
    });

    it('should include first warning in share text', async () => {
      render(<ShareCard result={createMockResult()} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Share Result on WhatsApp'));
      });
      const text = mockShare.mock.calls[0][0].text;
      expect(text).toContain('⚠');
      expect(text).toContain('High sugar: 15g per 100g');
    });

    it('should include first positive when no warnings', async () => {
      render(<ShareCard result={createMockResult({ warnings: [] })} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Share Result on WhatsApp'));
      });
      const text = mockShare.mock.calls[0][0].text;
      expect(text).toContain('✓');
      expect(text).toContain('Good source of fiber');
    });

    it('should include FoodScore branding in share text', async () => {
      render(<ShareCard result={createMockResult()} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Share Result on WhatsApp'));
      });
      const text = mockShare.mock.calls[0][0].text;
      expect(text).toContain('FoodScore India');
      expect(text).toContain('foodscore-india.vercel.app');
    });

    it('should show "?" score when scoringFailed', async () => {
      render(<ShareCard result={createMockResult({ scoringFailed: true })} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Share Result on WhatsApp'));
      });
      const text = mockShare.mock.calls[0][0].text;
      expect(text).toContain('Health Score: *?/100');
    });
  });

  describe('grade emojis', () => {
    let mockShare: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(navigator, 'canShare', {
        value: vi.fn().mockReturnValue(true),
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      // @ts-expect-error deleting non-configurable property in test
      delete navigator.share;
      // @ts-expect-error deleting non-configurable property in test
      delete navigator.canShare;
    });

    const gradeEmojis: [string, string][] = [
      ['A', '🟢'],
      ['B', '🟩'],
      ['C', '🟡'],
      ['D', '🟠'],
      ['E', '🔴'],
    ];

    it.each(gradeEmojis)('should use %s emoji for grade %s', async (grade, emoji) => {
      render(<ShareCard result={createMockResult({ grade })} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Share Result on WhatsApp'));
      });
      const text = mockShare.mock.calls[0][0].text;
      expect(text).toContain(emoji);
    });
  });
});
