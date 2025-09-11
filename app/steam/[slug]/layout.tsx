import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Note: Metadata is handled by the page.tsx generateMetadata function

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