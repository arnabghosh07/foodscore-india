// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import NotFound from '@/components/NotFound';

describe('NotFound', () => {
  describe('rendering', () => {
    it('should render the product not found heading', () => {
      render(<NotFound onRetry={vi.fn()} />);
      expect(screen.getByText('Product Not Found')).toBeInTheDocument();
    });

    it('should render the description text', () => {
      render(<NotFound onRetry={vi.fn()} />);
      expect(screen.getByText(/This product is not in the Open Food Facts database/)).toBeInTheDocument();
    });

    it('should render the Try Another Barcode button', () => {
      render(<NotFound onRetry={vi.fn()} />);
      expect(screen.getByRole('button', { name: /try another barcode/i })).toBeInTheDocument();
    });

    it('should show barcode when provided', () => {
      render(<NotFound barcode="5901234123457" onRetry={vi.fn()} />);
      expect(screen.getByText('Barcode: 5901234123457')).toBeInTheDocument();
    });

    it('should not show barcode when not provided', () => {
      render(<NotFound onRetry={vi.fn()} />);
      expect(screen.queryByText(/Barcode:/)).not.toBeInTheDocument();
    });
  });

  describe('retry button', () => {
    it('should call onRetry when button is clicked', () => {
      const onRetry = vi.fn();
      render(<NotFound onRetry={onRetry} />);
      fireEvent.click(screen.getByRole('button', { name: /try another barcode/i }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry on each click', () => {
      const onRetry = vi.fn();
      render(<NotFound onRetry={onRetry} />);
      const button = screen.getByRole('button', { name: /try another barcode/i });
      fireEvent.click(button);
      fireEvent.click(button);
      expect(onRetry).toHaveBeenCalledTimes(2);
    });
  });

  describe('icon', () => {
    it('should render the sad face SVG icon', () => {
      const { container } = render(<NotFound onRetry={vi.fn()} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });
});
