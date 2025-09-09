import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import styles from './packages.module.css';

export const metadata: Metadata = {
  title: 'Game Packages - Zen Store',
  description: 'Choose from various game packages with secure payment and instant delivery. Best prices and exclusive offers.',
  keywords: 'game packages, gaming, mobile games, in-app purchases, secure payment',
  openGraph: {
    title: 'Game Packages - Zen Store',
    description: 'Choose from various game packages with secure payment and instant delivery',
    type: 'website',
    siteName: 'Zen Store',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Game Packages - Zen Store',
    description: 'Choose from various game packages with secure payment and instant delivery',
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
  keywords: 'game packages, gaming, mobile games, in-app purchases, secure payment',
  openGraph: {
    title: 'Game Packages - Zen Store',
    description: 'Choose from various game packages with secure payment and instant delivery',
    type: 'website',
    siteName: 'Zen Store',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Game Packages - Zen Store',
    description: 'Choose from various game packages with secure payment and instant delivery',
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
};

export default function PackagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="packages-layout min-h-screen">
      <Suspense
        fallback={
          <div className={styles.customPackagesBg + ' min-h-screen text-white flex items-center justify-center'}>
            <LoadingSpinner size="lg" text="جاري تحميل الباقات..." />
          </div>
        }
      >
        {children}
      </Suspense>
    </div>
  );
}