import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SkeletonSpinner } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Gaming Dashboard - Zen Store',
  description: 'Discover the best gaming packages and deals. Browse popular games, mobile games, and exclusive offers with secure payment.',
  keywords: 'gaming dashboard, mobile games, game packages, gaming deals, online gaming, game store',
  openGraph: {
    title: 'Gaming Dashboard - Zen Store',
    description: 'Discover the best gaming packages and deals',
    type: 'website',
    siteName: 'Zen Store',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'Gaming Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gaming Dashboard - Zen Store',
    description: 'Discover the best gaming packages and deals',
    images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: '/dashboard',
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-layout min-h-screen">
      <Suspense
        fallback={
          <div className="bg-[#0D0E12] min-h-screen text-white flex items-center justify-center">
            <SkeletonSpinner size="lg" text="Loading dashboard..." />
          </div>
        }
      >
        {children}
      </Suspense>
    </div>
  );
}