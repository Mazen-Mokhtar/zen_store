import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import SessionManager from '@/components/SessionManager';
import { Suspense } from 'react';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Endex - Gaming Store',
  description: 'Your ultimate gaming destination',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SessionManager>
              <Suspense fallback={null}>
                {children}
              </Suspense>
              <Toaster position="top-right" richColors />
            </SessionManager>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
