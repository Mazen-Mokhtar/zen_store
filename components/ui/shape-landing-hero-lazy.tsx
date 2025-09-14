'use client';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load the shape landing hero with framer-motion
const ShapeLandingHeroDynamic = dynamic(
  () => import('./shape-landing-hero').then(module => ({ default: module.HeroGeometric })),
  {
    ssr: false,
    loading: () => (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Skeleton loader for hero content */}
        <div className="text-center z-10 px-4">
          <div className="h-16 bg-gray-700 rounded animate-pulse w-96 mx-auto mb-6"></div>
          <div className="h-6 bg-gray-800 rounded animate-pulse w-80 mx-auto mb-4"></div>
          <div className="h-6 bg-gray-800 rounded animate-pulse w-72 mx-auto mb-8"></div>
          <div className="flex gap-4 justify-center">
            <div className="h-12 bg-blue-600 rounded animate-pulse w-32"></div>
            <div className="h-12 bg-gray-700 rounded animate-pulse w-32"></div>
          </div>
        </div>
        
        {/* Static background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-purple-500/10 rounded-full"></div>
          <div className="absolute bottom-20 left-20 w-40 h-40 bg-green-500/10 rounded-full"></div>
          <div className="absolute bottom-40 right-10 w-28 h-28 bg-pink-500/10 rounded-full"></div>
        </div>
      </div>
    )
  }
);

export default function ShapeLandingHeroLazy() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-center z-10 px-4">
          <div className="h-16 bg-gray-700 rounded animate-pulse w-96 mx-auto mb-6"></div>
          <div className="h-6 bg-gray-800 rounded animate-pulse w-80 mx-auto mb-4"></div>
          <div className="h-6 bg-gray-800 rounded animate-pulse w-72 mx-auto mb-8"></div>
          <div className="flex gap-4 justify-center">
            <div className="h-12 bg-blue-600 rounded animate-pulse w-32"></div>
            <div className="h-12 bg-gray-700 rounded animate-pulse w-32"></div>
          </div>
        </div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-purple-500/10 rounded-full"></div>
          <div className="absolute bottom-20 left-20 w-40 h-40 bg-green-500/10 rounded-full"></div>
          <div className="absolute bottom-40 right-10 w-28 h-28 bg-pink-500/10 rounded-full"></div>
        </div>
      </div>
    }>
      <ShapeLandingHeroDynamic />
    </Suspense>
  );
}