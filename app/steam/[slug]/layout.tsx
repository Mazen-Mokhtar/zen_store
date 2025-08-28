import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export const metadata: Metadata = {
  title: 'Steam Games - Endex',
  description: 'Discover and purchase Steam games',
};

export default function SteamGameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0D0E12] text-white flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading Steam game..." />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}