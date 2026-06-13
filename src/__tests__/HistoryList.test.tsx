// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import HistoryList from '@/components/HistoryList';
import { ScanHistory } from '@/lib/types';
import { getHistory, addToHistory, clearHistory, removeFromHistory } from '@/lib/history';

function createHistoryItem(overrides?: Partial<ScanHistory>): ScanHistory {
  return {
    barcode: '5901234123457',
    productName: 'Parle-G Biscuit',
    score: 35,
    grade: 'D',
    timestamp: Date.now() - 3600000, // 1 hour ago
    ...overrides,
  };
}

describe('HistoryList component', () => {
  describe('empty state', () => {
    it('should show "No scans yet" when history is empty', () => {
      render(<HistoryList history={[]} onSelect={vi.fn()} onClear={vi.fn()} />);
      expect(screen.getByText('No scans yet')).toBeInTheDocument();
      expect(screen.getByText('Scan a barcode to get started')).toBeInTheDocument();
    });

    it('should not render the "Clear all" button when empty', () => {
      render(<HistoryList history={[]} onSelect={vi.fn()} onClear={vi.fn()} />);
      expect(screen.queryByText('Clear all')).not.toBeInTheDocument();
    });
  });

  describe('history list rendering', () => {
    it('should render "Recent Scans" heading', () => {
      const items = [createHistoryItem()];
      render(<HistoryList history={items} onSelect={vi.fn()} onClear={vi.fn()} />);
      expect(screen.getByText('Recent Scans')).toBeInTheDocument();
    });

    it('should render product name and barcode', () => {
      const items = [createHistoryItem({ productName: 'Maggi Noodles', barcode: '8901234567890' })];
      render(<HistoryList history={items} onSelect={vi.fn()} onClear={vi.fn()} />);
      expect(screen.getByText('Maggi Noodles')).toBeInTheDocument();
      expect(screen.getByText(/8901234567890/)).toBeInTheDocument();
    });

    it('should render grade badge with correct letter', () => {
      const items = [createHistoryItem({ grade: 'A' })];
      render(<HistoryList history={items} onSelect={vi.fn()} onClear={vi.fn()} />);
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('should render multiple items', () => {
      const items = [
        createHistoryItem({ barcode: '111', productName: 'Product A', grade: 'A' }),
        createHistoryItem({ barcode: '222', productName: 'Product B', grade: 'B' }),
        createHistoryItem({ barcode: '333', productName: 'Product C', grade: 'C' }),
      ];
      render(<HistoryList history={items} onSelect={vi.fn()} onClear={vi.fn()} />);
      expect(screen.getByText('Product A')).toBeInTheDocument();
      expect(screen.getByText('Product B')).toBeInTheDocument();
      expect(screen.getByText('Product C')).toBeInTheDocument();
    });
  });

  describe('grade color mapping', () => {
    it('should apply correct background color for grade A', () => {
      const items = [createHistoryItem({ grade: 'A' })];
      render(<HistoryList history={items} onSelect={vi.fn()} onClear={vi.fn()} />);
      const badge = screen.getByText('A');
      expect(badge).toHaveStyle({ backgroundColor: '#2ecc71' });
    });

    it('should apply correct background color for grade B', () => {
      const items = [createHistoryItem({ grade: 'B' })];
      render(<HistoryList history={items} onSelect={vi.fn()} onClear={vi.fn()} />);
      const badge = screen.getByText('B');
      expect(badge).toHaveStyle({ backgroundColor: '#27ae60' });
    });

    it('should apply correct background color for grade C', () => {
      const items = [createHistoryItem({ grade: 'C' })];
      render(<HistoryList history={items} onSelect={vi.fn()} onClear={vi.fn()} />);
      const badge = screen.getByText('C');
      expect(badge).toHaveStyle({ backgroundColor: '#f39c12' });
    });

    it('should apply correct background color for grade D', () => {
      const items = [createHistoryItem({ grade: 'D' })];
      render(<HistoryList history={items} onSelect={vi.fn()} onClear={vi.fn()} />);
      const badge = screen.getByText('D');
      expect(badge).toHaveStyle({ backgroundColor: '#e67e22' });
    });

    it('should apply correct background color for grade E', () => {
      const items = [createHistoryItem({ grade: 'E' })];
      render(<HistoryList history={items} onSelect={vi.fn()} onClear={vi.fn()} />);
      const badge = screen.getByText('E');
      expect(badge).toHaveStyle({ backgroundColor: '#e74c3c' });
    });

    it('should apply gray color for unknown grade', () => {
      const items = [createHistoryItem({ grade: 'X' })];
      render(<HistoryList history={items} onSelect={vi.fn()} onClear={vi.fn()} />);
      const badge = screen.getByText('X');
      expect(badge).toHaveStyle({ backgroundColor: '#95a5a6' });
    });
  });

  describe('image handling', () => {
    it('should show product image when imageUrl is provided', () => {
      const items = [createHistoryItem({ imageUrl: 'https://example.com/img.jpg' })];
      render(<HistoryList history={items} onSelect={vi.fn()} onClear={vi.fn()} />);
      // <img alt=""> gets presentation role per ARIA spec in jsdom
      const img = screen.getByRole('presentation');
      expect(img).toHaveAttribute('src', 'https://example.com/img.jpg');
    });

    it('should show barcode icon placeholder when no imageUrl', () => {
      const items = [createHistoryItem({ imageUrl: undefined })];
      render(<HistoryList history={items} onSelect={vi.fn()} onClear={vi.fn()} />);
      // Should not have an img element
      expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
    });
  });

  describe('callbacks', () => {
    it('should call onSelect with barcode when item is clicked', () => {
      const onSelect = vi.fn();
      const items = [createHistoryItem({ barcode: '1234567890123' })];
      render(<HistoryList history={items} onSelect={onSelect} onClear={vi.fn()} />);

      fireEvent.click(screen.getByText('Parle-G Biscuit'));
      expect(onSelect).toHaveBeenCalledWith('1234567890123');
    });

    it('should call onClear when "Clear all" is clicked', () => {
      const onClear = vi.fn();
      const items = [createHistoryItem()];
      render(<HistoryList history={items} onSelect={vi.fn()} onClear={onClear} />);

      fireEvent.click(screen.getByText('Clear all'));
      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });
});

describe('history.ts library functions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getHistory', () => {
    it('should return empty array when localStorage is empty', () => {
      expect(getHistory()).toEqual([]);
    });

    it('should return parsed history from localStorage', () => {
      const items = [
        { barcode: '111', productName: 'Item 1', score: 80, grade: 'A', timestamp: 1000 },
        { barcode: '222', productName: 'Item 2', score: 50, grade: 'C', timestamp: 2000 },
      ];
      localStorage.setItem('foodscore-history', JSON.stringify(items));

      const result = getHistory();
      expect(result).toHaveLength(2);
      expect(result[0].barcode).toBe('111');
      expect(result[1].barcode).toBe('222');
    });

    it('should return empty array when localStorage has invalid JSON', () => {
      localStorage.setItem('foodscore-history', 'not-valid-json{{{');
      expect(getHistory()).toEqual([]);
    });
  });

  describe('addToHistory', () => {
    it('should add item to empty history', () => {
      const item = createHistoryItem({ barcode: '111' });
      addToHistory(item);

      const history = getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].barcode).toBe('111');
    });

    it('should add new item to the beginning of existing history', () => {
      addToHistory(createHistoryItem({ barcode: '111' }));
      addToHistory(createHistoryItem({ barcode: '222' }));

      const history = getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].barcode).toBe('222'); // newest first
      expect(history[1].barcode).toBe('111');
    });

    it('should not duplicate items with the same barcode', () => {
      addToHistory(createHistoryItem({ barcode: '111', productName: 'Original' }));
      addToHistory(createHistoryItem({ barcode: '111', productName: 'Updated' }));

      const history = getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].productName).toBe('Updated');
    });

    it('should move updated item to the beginning when duplicate barcode is added', () => {
      addToHistory(createHistoryItem({ barcode: '111' }));
      addToHistory(createHistoryItem({ barcode: '222' }));
      addToHistory(createHistoryItem({ barcode: '111' })); // re-add 111

      const history = getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].barcode).toBe('111'); // moved to front
      expect(history[1].barcode).toBe('222');
    });

    it('should limit history to 50 items', () => {
      for (let i = 0; i < 55; i++) {
        addToHistory(createHistoryItem({ barcode: String(i).padStart(13, '0') }));
      }

      const history = getHistory();
      expect(history).toHaveLength(50);
      // Newest item (54) should be first
      expect(history[0].barcode).toBe('0000000000054');
    });
  });

  describe('clearHistory', () => {
    it('should remove all history items', () => {
      addToHistory(createHistoryItem({ barcode: '111' }));
      addToHistory(createHistoryItem({ barcode: '222' }));

      clearHistory();

      expect(getHistory()).toEqual([]);
    });

    it('should be safe to call on empty history', () => {
      clearHistory();
      expect(getHistory()).toEqual([]);
    });
  });

  describe('removeFromHistory', () => {
    it('should remove item with matching barcode', () => {
      addToHistory(createHistoryItem({ barcode: '111' }));
      addToHistory(createHistoryItem({ barcode: '222' }));
      addToHistory(createHistoryItem({ barcode: '333' }));

      removeFromHistory('222');

      const history = getHistory();
      expect(history).toHaveLength(2);
      expect(history.find(h => h.barcode === '222')).toBeUndefined();
    });

    it('should do nothing when barcode does not exist', () => {
      addToHistory(createHistoryItem({ barcode: '111' }));

      removeFromHistory('999');

      const history = getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].barcode).toBe('111');
    });

    it('should be safe to call on empty history', () => {
      removeFromHistory('111');
      expect(getHistory()).toEqual([]);
    });
  });
});
