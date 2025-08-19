import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import styles from './packages.module.css';

export const metadata: Metadata = {
  title: 'Packages',
  description: 'Packages page',
};

export default function PackagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="packages-layout">
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