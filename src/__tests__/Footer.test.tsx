// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Footer from '@/components/Footer';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe('Footer', () => {
  describe('links', () => {
    it('should render the About link', () => {
      render(<Footer />);
      const link = screen.getByText('About');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/about');
    });

    it('should render the Privacy Policy link', () => {
      render(<Footer />);
      const link = screen.getByText('Privacy Policy');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/privacy');
    });

    it('should render the Terms of Service link', () => {
      render(<Footer />);
      const link = screen.getByText('Terms of Service');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/terms');
    });
  });

  describe('copyright', () => {
    it('should render the current year', () => {
      render(<Footer />);
      const year = new Date().getFullYear().toString();
      expect(screen.getByText(new RegExp(`©.*${year}.*FoodScore India`))).toBeInTheDocument();
    });

    it('should include FoodScore India in copyright text', () => {
      render(<Footer />);
      expect(screen.getByText(/FoodScore India/)).toBeInTheDocument();
    });
  });

  describe('structure', () => {
    it('should render as a footer element', () => {
      const { container } = render(<Footer />);
      expect(container.querySelector('footer')).toBeInTheDocument();
    });
  });
});
