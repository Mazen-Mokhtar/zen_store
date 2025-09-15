import { Suspense } from 'react';
import { SkeletonSpinner } from '@/components/ui/skeleton';

// Enable ISR with 1 hour revalidation for better performance
export const revalidate = 3600;

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
          <SkeletonSpinner size="lg" text="Loading Steam game..." />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}