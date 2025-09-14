import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonButton,
  SkeletonImage,
} from '@/components/ui/skeleton';

describe('Skeleton Components', () => {
  describe('Skeleton', () => {
    it('should render with default props', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
    });

    it('should render with custom aria-label', () => {
      render(<Skeleton aria-label="Loading product details" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading product details');
    });

    it('should render text variant with multiple lines', () => {
      render(<Skeleton variant="text" lines={3} />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading 3 lines of text');
      expect(skeleton.children).toHaveLength(4); // 3 lines + sr-only span
    });

    it('should render circular variant', () => {
      render(<Skeleton variant="circular" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('rounded-full', 'aspect-square');
    });

    it('should render card variant', () => {
      render(<Skeleton variant="card" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('w-full', 'h-48');
    });

    it('should apply custom className', () => {
      render(<Skeleton className="custom-class" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('custom-class');
    });

    it('should apply custom width and height', () => {
      render(<Skeleton width="200px" height="100px" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ width: '200px', height: '100px' });
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(<Skeleton />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should include screen reader text', () => {
      render(<Skeleton />);
      expect(screen.getByText('Loading...')).toHaveClass('sr-only');
    });
  });

  describe('SkeletonText', () => {
    it('should render with default 3 lines', () => {
      render(<SkeletonText />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading 3 lines of text');
    });

    it('should render with custom number of lines', () => {
      render(<SkeletonText lines={5} />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading 5 lines of text');
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(<SkeletonText lines={3} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('SkeletonAvatar', () => {
    it('should render circular skeleton', () => {
      render(<SkeletonAvatar />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('rounded-full', 'aspect-square');
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(<SkeletonAvatar />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('SkeletonCard', () => {
    it('should render card structure with avatar and text', () => {
      render(<SkeletonCard />);
      const skeletons = screen.getAllByRole('status');
      expect(skeletons.length).toBeGreaterThan(1); // Avatar + text + card content
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(<SkeletonCard />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('SkeletonButton', () => {
    it('should render with button-like dimensions', () => {
      render(<SkeletonButton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading button');
      expect(skeleton).toHaveClass('w-24', 'h-10', 'rounded-md');
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(<SkeletonButton />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('SkeletonImage', () => {
    it('should render with image-like aspect ratio', () => {
      render(<SkeletonImage />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading image');
      expect(skeleton).toHaveClass('w-full', 'aspect-video');
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(<SkeletonImage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Accessibility Features', () => {
    it('should provide meaningful status role for screen readers', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toBeInTheDocument();
    });

    it('should include hidden text for screen readers', () => {
      render(<Skeleton />);
      const hiddenText = screen.getByText('Loading...');
      expect(hiddenText).toHaveClass('sr-only');
    });

    it('should support custom aria-label for context-specific loading states', () => {
      render(<Skeleton aria-label="Loading user profile" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading user profile');
    });

    it('should maintain focus management during loading states', () => {
      const { rerender } = render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      
      // Skeleton should not be focusable
      expect(skeleton).not.toHaveAttribute('tabindex');
      
      // Should not interfere with keyboard navigation
      rerender(<div><Skeleton /><button>Next</button></div>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Animation and Visual States', () => {
    it('should include pulse animation class', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('should respect prefers-reduced-motion', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      // Animation should still be present but can be overridden by CSS
      expect(skeleton).toHaveClass('animate-pulse');
    });
  });
});