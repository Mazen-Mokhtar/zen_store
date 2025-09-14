'use client';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load the footer section with framer-motion
const FooterSectionDynamic = dynamic(
  () => import('./footer-section').then(module => ({ default: module.Footer })),
  {
    ssr: false,
    loading: () => (
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Skeleton loader for footer sections */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-6 bg-gray-700 rounded animate-pulse w-24"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-4 bg-gray-800 rounded animate-pulse w-20"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    )
  }
);

export default function FooterSectionLazy() {
  return (
    <Suspense fallback={
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-6 bg-gray-700 rounded animate-pulse w-24"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-4 bg-gray-800 rounded animate-pulse w-20"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    }>
      <FooterSectionDynamic />
    </Suspense>
  );
}