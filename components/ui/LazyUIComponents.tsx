'use client';

import React, { Suspense } from 'react';
import { SkeletonSpinner } from '@/components/ui/skeleton';

// Type definitions for lazy component props
interface LazyComponentProps {
  [key: string]: any;
}

// Simplified lazy UI components
const LazyNotificationToastComponent = React.lazy(() => import('./notification-toast').then(module => ({ default: module.NotificationToast })));

export const LazyNotificationToast = (props: LazyComponentProps) => (
  <Suspense fallback={<div className="h-16 bg-gray-800 animate-pulse rounded-lg" />}>
    <LazyNotificationToastComponent {...props} />
  </Suspense>
);

// Modal component - using order confirmation modal
const LazyModalComponent = React.lazy(() => import('./order-confirmation-modal').then(module => ({ default: module.OrderConfirmationModal })));

export const LazyModal = (props: any) => (
  <Suspense fallback={
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-48 mb-4" />
        <div className="h-20 bg-gray-700 rounded" />
      </div>
    </div>
  }>
    <LazyModalComponent {...props} />
  </Suspense>
);

// Image gallery - using responsive image component
const LazyImageGalleryComponent = React.lazy(() => import('./responsive-image').then(module => ({ default: module.ResponsiveImage })));

export const LazyImageGallery = (props: any) => (
  <Suspense fallback={
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="aspect-video bg-gray-800 animate-pulse rounded-lg" />
      ))}
    </div>
  }>
    <LazyImageGalleryComponent {...props} />
  </Suspense>
);

// Video player - placeholder using card component
const LazyVideoPlayerComponent = React.lazy(() => import('./card').then(module => ({ default: module.Card })));

export const LazyVideoPlayer = (props: any) => (
  <Suspense fallback={
    <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
      <SkeletonSpinner size="lg" text="Loading video..." />
    </div>
  }>
    <LazyVideoPlayerComponent {...props} />
  </Suspense>
);

// Chart component - placeholder using card component
const LazyChartComponent = React.lazy(() => import('./card').then(module => ({ default: module.Card })));

export const LazyChart = (props: any) => (
  <Suspense fallback={
    <div className="h-64 bg-gray-800 animate-pulse rounded-lg flex items-center justify-center">
      <SkeletonSpinner size="md" text="Loading chart..." />
    </div>
  }>
    <LazyChartComponent {...props} />
  </Suspense>
);

// Heavy component - using glare card demo as placeholder
const LazyHeavyComponentInner = React.lazy(() => import('./glare-card-demo').then(module => ({ default: module.GlareCardDemo })));

export const LazyHeavyComponent = (props: any) => (
  <Suspense fallback={
    <div className="min-h-[400px] flex items-center justify-center">
      <SkeletonSpinner size="lg" text="Loading content..." />
    </div>
  }>
    <LazyHeavyComponentInner {...props} />
  </Suspense>
);