import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import AuthGuard from '@/components/guards/AuthGuard';

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
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <AuthGuard>
        {children}
      </AuthGuard>
    </ThemeProvider>
  );
}