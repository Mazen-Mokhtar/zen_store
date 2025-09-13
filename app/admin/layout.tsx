'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';
import { FiHome, FiShoppingCart, FiUsers, FiSettings, FiLogOut } from 'react-icons/fi';
import { useAuth } from '@/lib/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Logo } from '@/components/ui/logo';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen" suppressHydrationWarning>
        <LoadingSpinner />
      </div>
    );
  }

  // Removed admin authentication checks - open access

  const handleLogout = async () => {
    await logout();
    router.push('/signin');
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full z-40">
        <Sidebar
          collapsed={collapsed}
          width="280px"
          collapsedWidth="80px"
          backgroundColor="#1f2937"
          className="h-full"
        >
          <div className="p-4 border-b border-gray-700 flex items-center justify-center">
            <Logo 
              size={collapsed ? "sm" : "lg"} 
              showText={false} 
              className="text-white"
              clickable={false}
            />
          </div>
          
          <Menu
            menuItemStyles={{
              button: {
                color: '#e5e7eb',
                '&:hover': {
                  backgroundColor: '#374151',
                  color: '#ffffff',
                },
                '&.active': {
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                },
              },
            }}
          >
            <MenuItem 
              icon={<FiHome />} 
              onClick={() => router.push('/admin')}
            >
              لوحة التحكم
            </MenuItem>
            
            <MenuItem 
              icon={<FiShoppingCart />} 
              onClick={() => router.push('/admin/orders')}
            >
              إدارة الطلبات
            </MenuItem>
            
            <MenuItem 
              icon={<FiUsers />} 
              onClick={() => router.push('/admin/users')}
            >
              إدارة المستخدمين
            </MenuItem>
            
            <MenuItem 
              icon={<FiSettings />} 
              onClick={() => router.push('/admin/settings')}
            >
              الإعدادات
            </MenuItem>
            
            <MenuItem 
              icon={<FiLogOut />} 
              onClick={handleLogout}
            >
              تسجيل الخروج
            </MenuItem>
          </Menu>
        </Sidebar>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-72'}`}>
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                مرحباً، {user?.name || user?.email || 'زائر'}
              </span>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {(user?.name || user?.email || 'زائر').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}