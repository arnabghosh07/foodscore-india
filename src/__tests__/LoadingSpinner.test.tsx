// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import LoadingSpinner from '@/components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render the spinner animation', () => {
    const { container } = render(<LoadingSpinner />);
    // The spinner uses two divs: a base circle and an animated border circle
    const spinnerDivs = container.querySelectorAll('.animate-spin');
    expect(spinnerDivs).toHaveLength(1);
  });

  it('should not render message when message prop is not provided', () => {
    render(<LoadingSpinner />);
    expect(screen.queryByText(/./)).not.toBeInTheDocument();
  });

  it('should render message when provided', () => {
    render(<LoadingSpinner message="Scanning barcode..." />);
    expect(screen.getByText('Scanning barcode...')).toBeInTheDocument();
  });

  it('should apply animate-pulse class to message text', () => {
    const { container } = render(<LoadingSpinner message="Loading..." />);
    const pulsingElement = container.querySelector('.animate-pulse');
    expect(pulsingElement).toBeInTheDocument();
    expect(pulsingElement?.textContent).toBe('Loading...');
  });

  it('should render with empty message without crashing', () => {
    render(<LoadingSpinner message="" />);
    // Empty string message should not render the <p> element
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });
});
