import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Packages',
  description: 'Packages page',
};

export default function PackagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="packages-layout">
      {children}
    </div>
  );
} 