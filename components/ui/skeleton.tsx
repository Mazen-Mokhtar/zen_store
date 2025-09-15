import React from 'react';
import { cn } from '@/lib/utils';

// Design tokens for consistent skeleton styling
const skeletonTokens = {
  colors: {
    light: 'bg-gray-200',
    dark: 'dark:bg-gray-700',
  },
  animation: 'animate-pulse',
  borderRadius: {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  },
  spacing: {
    xs: 'h-3',
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
    xl: 'h-12',
  },
};

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'spinner';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  width?: string | number;
  height?: string | number;
  lines?: number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  color?: string;
  text?: string;
  'aria-label'?: string;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      variant = 'rectangular',
      size = 'md',
      width,
      height,
      lines = 1,
      rounded = 'md',
      color = 'border-green-500',
      text,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      skeletonTokens.colors.light,
      skeletonTokens.colors.dark,
      skeletonTokens.animation,
      skeletonTokens.borderRadius[rounded]
    );

    const getVariantClasses = () => {
      switch (variant) {
        case 'text':
          return cn(baseClasses, skeletonTokens.spacing[size], 'w-full');
        case 'circular':
          return cn(baseClasses, 'rounded-full aspect-square');
        case 'card':
          return cn(baseClasses, 'w-full h-48');
        case 'spinner':
          const spinnerSizes = {
            xs: 'h-4 w-4',
            sm: 'h-6 w-6', 
            md: 'h-12 w-12',
            lg: 'h-16 w-16',
            xl: 'h-20 w-20'
          };
          return cn(spinnerSizes[size], 'animate-spin rounded-full border-b-2', color);
        default:
          return cn(baseClasses, skeletonTokens.spacing[size]);
      }
    };

    const style: React.CSSProperties = {
      width: width || undefined,
      height: height || undefined,
    };

    // For multiple text lines
    if (variant === 'text' && lines > 1) {
      return (
        <div
          ref={ref}
          className={cn('space-y-2', className)}
          role="status"
          aria-label={ariaLabel || `Loading ${lines} lines of text`}
          {...props}
        >
          {Array.from({ length: lines }, (_, index) => (
            <div
              key={index}
              className={cn(
                getVariantClasses(),
                index === lines - 1 && 'w-3/4' // Last line is shorter
              )}
              style={style}
            />
          ))}
          <span className="sr-only">Loading content...</span>
        </div>
      );
    }

    if (variant === 'spinner') {
      return (
        <div className={cn('flex flex-col items-center justify-center', className)} role="status" aria-live="polite" {...props}>
          <div 
            className={getVariantClasses()}
            aria-hidden="true"
          ></div>
          {text && (
            <p className="text-gray-400 text-sm text-center max-w-xs mt-4">
              <span className="sr-only">Loading: </span>
              {text}
            </p>
          )}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(getVariantClasses(), className)}
        style={style}
        role="status"
        aria-label={ariaLabel || 'Loading content'}
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Preset skeleton components for common use cases
export const SkeletonText = ({ lines = 3, ...props }: Omit<SkeletonProps, 'variant'>) => (
  <Skeleton variant="text" lines={lines} {...props} />
);

export const SkeletonAvatar = ({ size = 'md', ...props }: Omit<SkeletonProps, 'variant'>) => (
  <Skeleton variant="circular" size={size} {...props} />
);

export const SkeletonCard = ({ ...props }: Omit<SkeletonProps, 'variant'>) => (
  <div className="space-y-4 p-4 border rounded-lg">
    <div className="flex items-center space-x-4">
      <SkeletonAvatar size="lg" />
      <div className="flex-1">
        <SkeletonText lines={2} />
      </div>
    </div>
    <Skeleton variant="card" {...props} />
    <SkeletonText lines={3} />
  </div>
);

export const SkeletonButton = ({ ...props }: Omit<SkeletonProps, 'variant'>) => (
  <Skeleton
    variant="rectangular"
    className="w-24 h-10 rounded-md"
    aria-label="Loading button"
    {...props}
  />
);

export const SkeletonImage = ({ ...props }: Omit<SkeletonProps, 'variant'>) => (
  <Skeleton
    variant="rectangular"
    className="w-full aspect-video"
    aria-label="Loading image"
    {...props}
  />
);

export const SkeletonSpinner = ({ size = 'md', text = 'Loading...', ...props }: Omit<SkeletonProps, 'variant'>) => (
  <Skeleton variant="spinner" size={size} text={text} {...props} />
);

export { Skeleton };
export default Skeleton;