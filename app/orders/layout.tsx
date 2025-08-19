import type { Metadata } from 'next';
import AuthGuard from '@/components/guards/AuthGuard';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'طلباتي - Endex',
  description: 'إدارة ومتابعة طلباتك',
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <AuthGuard>
        {children}
      </AuthGuard>
    </Suspense>
  );
}