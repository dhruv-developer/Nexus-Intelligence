'use client';

import './globals.css';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { metadata, viewport } from './layout-metadata';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/contexts/theme-context';
import { AuthProvider } from '@/contexts/auth-context';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.includes(pathname);
  
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            {isPublicRoute ? (
              <Providers>{children}</Providers>
            ) : (
              <AuthGuard>
                <Providers>
                  <div className="flex h-screen bg-background">
                    <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                    
                    <div className="flex-1 flex flex-col min-h-0">
                      <Header onMenuClick={() => setSidebarOpen(true)} />
                      
                      <main className="flex-1 overflow-y-auto">
                        {children}
                      </main>
                    </div>
                  </div>
                </Providers>
              </AuthGuard>
            )}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
