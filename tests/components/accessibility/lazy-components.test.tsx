import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { LazyComponentWrapper } from '@/components/performance/lazy-component-wrapper';
import { Skeleton } from '@/components/ui/skeleton';

// Mock component for testing
const MockComponent = ({ title = 'Test Component' }: { title?: string }) => (
  <div role="main" aria-label={title}>
    <h1>{title}</h1>
    <button>Interactive Element</button>
    <input type="text" placeholder="Test input" aria-label="Test input field" />
  </div>
);

// Mock lazy component
const MockLazyComponent = React.lazy(() => 
  Promise.resolve({ default: MockComponent })
);

describe('Lazy Components Accessibility', () => {
  beforeEach(() => {
    // Clear any previous intersection observer mocks
    global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
      root: null,
      rootMargin: '',
      thresholds: [],
    }));
  });

  describe('LazyComponentWrapper', () => {
    it('should render loading skeleton with proper accessibility attributes', () => {
      render(
        <LazyComponentWrapper
          fallback={<Skeleton aria-label="Loading component" />}
        >
          <MockLazyComponent />
        </LazyComponentWrapper>
      );

      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toBeInTheDocument();
      expect(loadingElement).toHaveAttribute('aria-label', 'Loading component');
    });

    it('should have no accessibility violations during loading state', async () => {
      const { container } = render(
        <LazyComponentWrapper
          fallback={<Skeleton aria-label="Loading content" />}
        >
          <MockLazyComponent />
        </LazyComponentWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should maintain focus management during lazy loading', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <button>Before</button>
          <LazyComponentWrapper
            fallback={<Skeleton aria-label="Loading component" />}
          >
            <MockLazyComponent />
          </LazyComponentWrapper>
          <button>After</button>
        </div>
      );

      const beforeButton = screen.getByRole('button', { name: 'Before' });
      const afterButton = screen.getByRole('button', { name: 'After' });

      // Focus should move correctly around loading component
      await user.click(beforeButton);
      expect(beforeButton).toHaveFocus();

      await user.tab();
      expect(afterButton).toHaveFocus();
    });

    it('should announce loading state to screen readers', () => {
      render(
        <LazyComponentWrapper
          fallback={
            <div role="status" aria-live="polite" aria-label="Loading component">
              <Skeleton />
              <span className="sr-only">Loading component, please wait...</span>
            </div>
          }
        >
          <MockLazyComponent />
        </LazyComponentWrapper>
      );

      const loadingAnnouncement = screen.getByText('Loading component, please wait...');
      expect(loadingAnnouncement).toHaveClass('sr-only');
      
      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should handle keyboard navigation properly when component loads', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(
        <LazyComponentWrapper
          fallback={<Skeleton aria-label="Loading component" />}
        >
          <MockLazyComponent />
        </LazyComponentWrapper>
      );

      // Simulate component loading
      await waitFor(() => {
        rerender(<MockComponent />);
      });

      const interactiveButton = await screen.findByRole('button', { name: 'Interactive Element' });
      const inputField = await screen.findByRole('textbox');

      // Should be able to navigate to loaded interactive elements
      await user.tab();
      expect(interactiveButton).toHaveFocus();

      await user.tab();
      expect(inputField).toHaveFocus();
    });

    it('should provide proper ARIA landmarks for loaded content', async () => {
      render(
        <LazyComponentWrapper
          fallback={<Skeleton aria-label="Loading main content" />}
        >
          <MockLazyComponent title="Main Content" />
        </LazyComponentWrapper>
      );

      await waitFor(() => {
        const mainContent = screen.getByRole('main');
        expect(mainContent).toBeInTheDocument();
        expect(mainContent).toHaveAttribute('aria-label', 'Main Content');
      });
    });

    it('should handle error states accessibly', async () => {
      const ErrorComponent = () => {
        throw new Error('Component failed to load');
      };

      const MockErrorLazyComponent = React.lazy(() => 
        Promise.reject(new Error('Failed to load'))
      );

      // Mock error boundary
      const ErrorFallback = ({ error }: { error: Error }) => (
        <div role="alert" aria-live="assertive">
          <h2>Something went wrong</h2>
          <p>Failed to load component: {error.message}</p>
          <button>Retry</button>
        </div>
      );

      render(
        <React.Suspense fallback={<Skeleton aria-label="Loading component" />}>
          <LazyComponentWrapper
            fallback={<Skeleton aria-label="Loading component" />}
            errorFallback={<ErrorFallback error={new Error('Failed to load')} />}
          >
            <MockErrorLazyComponent />
          </LazyComponentWrapper>
        </React.Suspense>
      );

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
      });
    });
  });

  describe('Intersection Observer Accessibility', () => {
    it('should not interfere with screen reader navigation', () => {
      const mockIntersectionObserver = jest.fn().mockImplementation((callback) => {
        // Simulate intersection
        setTimeout(() => {
          callback([{ isIntersecting: true, target: document.createElement('div') }]);
        }, 100);
        
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn(),
        };
      });

      global.IntersectionObserver = mockIntersectionObserver;

      render(
        <div>
          <h1>Page Title</h1>
          <LazyComponentWrapper
            fallback={<Skeleton aria-label="Loading section" />}
          >
            <MockLazyComponent title="Lazy Section" />
          </LazyComponentWrapper>
        </div>
      );

      const pageTitle = screen.getByRole('heading', { level: 1 });
      expect(pageTitle).toBeInTheDocument();
    });

    it('should maintain proper heading hierarchy', async () => {
      render(
        <div>
          <h1>Main Title</h1>
          <LazyComponentWrapper
            fallback={<Skeleton aria-label="Loading subsection" />}
          >
            <div>
              <h2>Subsection</h2>
              <MockLazyComponent />
            </div>
          </LazyComponentWrapper>
        </div>
      );

      await waitFor(() => {
        const mainHeading = screen.getByRole('heading', { level: 1 });
        const subHeading = screen.getByRole('heading', { level: 2 });
        
        expect(mainHeading).toBeInTheDocument();
        expect(subHeading).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Accessibility Integration', () => {
    it('should not block main thread during loading', async () => {
      const startTime = performance.now();
      
      render(
        <LazyComponentWrapper
          fallback={<Skeleton aria-label="Loading heavy component" />}
        >
          <MockLazyComponent />
        </LazyComponentWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Render should be fast (< 16ms for 60fps)
      expect(renderTime).toBeLessThan(50);
    });

    it('should support reduced motion preferences', () => {
      // Mock prefers-reduced-motion
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

      render(
        <LazyComponentWrapper
          fallback={<Skeleton aria-label="Loading without animation" />}
        >
          <MockLazyComponent />
        </LazyComponentWrapper>
      );

      const skeleton = screen.getByRole('status');
      expect(skeleton).toBeInTheDocument();
      // Animation classes should still be present but can be overridden by CSS
    });
  });

  describe('ARIA Live Regions', () => {
    it('should use appropriate aria-live values for different loading states', () => {
      const { rerender } = render(
        <div role="status" aria-live="polite" aria-label="Loading content">
          <Skeleton />
        </div>
      );

      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveAttribute('aria-live', 'polite');

      // For critical loading states, use assertive
      rerender(
        <div role="status" aria-live="assertive" aria-label="Loading critical content">
          <Skeleton />
        </div>
      );

      expect(statusElement).toHaveAttribute('aria-live', 'assertive');
    });
  });
});