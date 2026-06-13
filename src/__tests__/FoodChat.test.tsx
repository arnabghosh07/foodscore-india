// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import FoodChat from '@/components/FoodChat';
import { FoodScoreResult } from '@/lib/types';

function createMockResult(overrides?: Partial<FoodScoreResult>): FoodScoreResult {
  return {
    dataSource: 'openfoodfacts',
    product: {
      code: '5901234123457',
      product_name: 'Test Biscuit',
      brands: 'Test Brand',
      nutriments: {
        sugars_100g: 15,
        saturated_fat_100g: 5,
        sodium_100g: 0.3,
        proteins_100g: 5,
        fiber_100g: 2,
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
    positives: [],
    feedback: 'High sugar detected.',
    summary: 'Test Biscuit scores 45/100 (D).',
    ...overrides,
  };
}

// Mock scrollIntoView (not available in jsdom)
Element.prototype.scrollIntoView = vi.fn();

// Mock fetch globally
const mockFetch = vi.fn();
beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('FoodChat', () => {
  describe('Markdown rendering in bot messages', () => {
    it('should render the initial greeting with the product name', () => {
      const result = createMockResult();
      render(<FoodChat result={result} />);

      // Open the chat by clicking the FAB
      fireEvent.click(screen.getByLabelText('Toggle Chat'));

      // The greeting should contain the product name
      expect(screen.getByText(/Ask me anything about/)).toBeInTheDocument();
    });

    it('should render bold text from markdown in bot messages', async () => {
      const result = createMockResult();
      render(<FoodChat result={result} />);

      // Open chat
      fireEvent.click(screen.getByLabelText('Toggle Chat'));

      // Mock fetch to return a response with bold markdown
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reply: 'This product has **high sugar** content.',
        }),
      });

      // Type and send a message
      const input = screen.getByPlaceholderText('Ask a question...');
      fireEvent.change(input, { target: { value: 'Tell me about sugar' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        const boldElement = screen.getByText('high sugar');
        expect(boldElement).toBeInTheDocument();
        expect(boldElement.tagName).toBe('STRONG');
      });
    });

    it('should render italic text from markdown in bot messages', async () => {
      const result = createMockResult();
      render(<FoodChat result={result} />);

      fireEvent.click(screen.getByLabelText('Toggle Chat'));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reply: 'This is *italic text* in the response.',
        }),
      });

      const input = screen.getByPlaceholderText('Ask a question...');
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        const italicElement = screen.getByText('italic text');
        expect(italicElement).toBeInTheDocument();
        expect(italicElement.tagName).toBe('EM');
      });
    });

    it('should render bullet lists from markdown in bot messages', async () => {
      const result = createMockResult();
      render(<FoodChat result={result} />);

      fireEvent.click(screen.getByLabelText('Toggle Chat'));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reply: '- Item one\n- Item two\n- Item three',
        }),
      });

      const input = screen.getByPlaceholderText('Ask a question...');
      fireEvent.change(input, { target: { value: 'List ingredients' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('Item one')).toBeInTheDocument();
        expect(screen.getByText('Item two')).toBeInTheDocument();
        expect(screen.getByText('Item three')).toBeInTheDocument();
        // Lists should render as <ul> or <li> elements
        expect(screen.getByText('Item one').closest('li')).toBeInTheDocument();
      });
    });

    it('should render links from markdown in bot messages', async () => {
      const result = createMockResult();
      render(<FoodChat result={result} />);

      fireEvent.click(screen.getByLabelText('Toggle Chat'));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reply: 'For more info, visit [WHO guidelines](https://www.who.int).',
        }),
      });

      const input = screen.getByPlaceholderText('Ask a question...');
      fireEvent.change(input, { target: { value: 'More info' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        const link = screen.getByText('WHO guidelines');
        expect(link).toBeInTheDocument();
        expect(link.tagName).toBe('A');
        expect(link).toHaveAttribute('href', 'https://www.who.int');
      });
    });
  });

  describe('Chat UI interactions', () => {
    it('should render the FAB button with "ASK AI" text', () => {
      const result = createMockResult();
      render(<FoodChat result={result} />);
      expect(screen.getByText('ASK AI')).toBeInTheDocument();
    });

    it('should toggle chat open and closed', () => {
      const result = createMockResult();
      render(<FoodChat result={result} />);

      // Initially closed — chat panel should not be visible
      expect(screen.queryByPlaceholderText('Ask a question...')).not.toBeInTheDocument();

      // Open chat
      fireEvent.click(screen.getByLabelText('Toggle Chat'));
      expect(screen.getByPlaceholderText('Ask a question...')).toBeInTheDocument();

      // Close chat
      fireEvent.click(screen.getByLabelText('Toggle Chat'));
      expect(screen.queryByPlaceholderText('Ask a question...')).not.toBeInTheDocument();
    });

    it('should display quick question chips on initial state', () => {
      const result = createMockResult();
      render(<FoodChat result={result} />);

      fireEvent.click(screen.getByLabelText('Toggle Chat'));

      expect(screen.getByText('Is this safe for children?')).toBeInTheDocument();
      expect(screen.getByText('What are the main health risks?')).toBeInTheDocument();
      expect(screen.getByText('Why is it graded this way?')).toBeInTheDocument();
      expect(screen.getByText('What are some healthy swaps?')).toBeInTheDocument();
    });

    it('should hide quick questions after sending a message', async () => {
      const result = createMockResult();
      render(<FoodChat result={result} />);

      fireEvent.click(screen.getByLabelText('Toggle Chat'));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reply: 'Here is my answer.',
        }),
      });

      const input = screen.getByPlaceholderText('Ask a question...');
      fireEvent.change(input, { target: { value: 'Test question' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(screen.queryByText('Is this safe for children?')).not.toBeInTheDocument();
      });
    });

    it('should display the disclaimer text', () => {
      const result = createMockResult();
      render(<FoodChat result={result} />);

      fireEvent.click(screen.getByLabelText('Toggle Chat'));

      expect(screen.getByText(/AI info; not medical advice/)).toBeInTheDocument();
    });
  });

  describe('Chat messaging', () => {
    it('should display user message after sending', async () => {
      const result = createMockResult();
      render(<FoodChat result={result} />);

      fireEvent.click(screen.getByLabelText('Toggle Chat'));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reply: 'Bot reply here.',
        }),
      });

      const input = screen.getByPlaceholderText('Ask a question...');
      fireEvent.change(input, { target: { value: 'Hello bot' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('Hello bot')).toBeInTheDocument();
        expect(screen.getByText('Bot reply here.')).toBeInTheDocument();
      });
    });

    it('should clear input after sending', async () => {
      const result = createMockResult();
      render(<FoodChat result={result} />);

      fireEvent.click(screen.getByLabelText('Toggle Chat'));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reply: 'Reply.',
        }),
      });

      const input = screen.getByPlaceholderText('Ask a question...');
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });

    it('should show error message when fetch fails', async () => {
      const result = createMockResult();
      render(<FoodChat result={result} />);

      fireEvent.click(screen.getByLabelText('Toggle Chat'));

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'API rate limit exceeded',
        }),
      });

      const input = screen.getByPlaceholderText('Ask a question...');
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(screen.getByText(/API rate limit exceeded/)).toBeInTheDocument();
      });
    });

    it('should send product context with the request', async () => {
      const result = createMockResult();
      render(<FoodChat result={result} />);

      fireEvent.click(screen.getByLabelText('Toggle Chat'));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reply: 'OK',
        }),
      });

      const input = screen.getByPlaceholderText('Ask a question...');
      fireEvent.change(input, { target: { value: 'Question' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Test Biscuit'),
        });
      });
    });
  });

  describe('Product name in greeting', () => {
    it('should show "Analyzing {product}" in the header', () => {
      const result = createMockResult();
      render(<FoodChat result={result} />);

      fireEvent.click(screen.getByLabelText('Toggle Chat'));

      expect(screen.getByText(/Analyzing/).closest('p')).toHaveTextContent(/Test Biscuit/);
    });

    it('should fall back to "Product" when product_name is empty', () => {
      const result = createMockResult({
        product: {
          code: '0000000000000',
          product_name: '',
          nutriments: {},
        },
      });
      render(<FoodChat result={result} />);

      fireEvent.click(screen.getByLabelText('Toggle Chat'));

      expect(screen.getByText(/Analyzing/).closest('p')).toHaveTextContent(/Product/);
    });
  });
});
