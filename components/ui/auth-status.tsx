"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService, User } from '@/lib/auth';
import Image from 'next/image';

interface AuthStatusProps {
  className?: string;
  // Controls visual density; 'default' is existing layout, 'compact' is simpler and smaller
  variant?: 'default' | 'compact';
  // Optional explicit avatar image URL
  avatarUrl?: string;
}

export function AuthStatus({ className = "", variant = 'default', avatarUrl }: AuthStatusProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  
  // Ensure crisp avatar on all screens: if Cloudinary URL is provided, request proper transforms
  const buildAvatarUrl = (url?: string, displaySize: number = 32) => {
    if (!url) return '';
    try {
      const isCloudinary = url.includes('/image/upload/');
      if (!isCloudinary) return url; // fallback for non-cloudinary
      // Request double-size with DPR 2, smart crop to face, auto format/quality
      const desired = `f_auto,q_auto,c_fill,g_face,w_${displaySize * 2},h_${displaySize * 2},dpr_2`;
      return url.replace('/upload/', `/upload/${desired}/`);
    } catch {
      return url;
    }
  };

  useEffect(() => {
    const authState = authService.getAuthState();
    setUser(authState.user);
    setIsAuthenticated(authState.isAuthenticated);
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    router.push('/signin');
  };

  const handleLogin = () => {
    const current = typeof window !== 'undefined' 
      ? window.location.pathname + window.location.search 
      : '/';
    const returnUrl = encodeURIComponent(current);
    router.push(`/signin?returnUrl=${returnUrl}`);
  };

  const goOrders = () => {
    router.push('/orders');
  };

  if (isAuthenticated && user) {
    // Compact visual with avatar and small text, suitable for tight headers
    if (variant === 'compact') {
      const size = 36;
      const src = buildAvatarUrl(avatarUrl, size);
      return (
        <div className={`flex items-center gap-3 ${className}`}>
          <div
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 transition-colors rounded-full ps-2 pe-3 py-1 cursor-pointer"
            onClick={goOrders}
            role="button"
            tabIndex={0}
            title="طلباتي"
          >
            {avatarUrl ? (
              <div className="w-9 h-9 rounded-full overflow-hidden ring-0 hover:ring-2 hover:ring-emerald-400 transition-shadow">
                <Image
                  src={src || avatarUrl}
                  alt={user.name || 'Avatar'}
                  width={size}
                  height={size}
                  sizes={`${size}px`}
                  className="rounded-full object-cover shrink-0"
                  priority
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">
                  {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </span>
              </div>
            )}
            <div className="leading-tight">
              <div className="text-sm font-medium text-white truncate max-w-[140px]">
                {user.name || user.email}
              </div>
              <div className="text-[11px] text-gray-400">
                {user.role === 'user' ? 'مستخدم' : 'مدير'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs md:text-sm text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-full px-3 py-1 transition-colors"
            aria-label="تسجيل الخروج"
            title="خروج"
          >
            خروج
          </button>
        </div>
      );
    }

    // Default (existing) visual
    const defaultSize = 32;
    const defaultSrc = buildAvatarUrl(avatarUrl, defaultSize);
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={goOrders}
          role="button"
          tabIndex={0}
          title="طلباتي"
        >
          {avatarUrl ? (
            <div className="w-8 h-8 rounded-full overflow-hidden ring-0 hover:ring-2 hover:ring-emerald-400 transition-shadow">
              <Image
                src={defaultSrc || avatarUrl}
                alt={user.name || 'Avatar'}
                width={defaultSize}
                height={defaultSize}
                sizes={`${defaultSize}px`}
                className="rounded-full object-cover"
                priority
                unoptimized
              />
            </div>
          ) : (
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </span>
            </div>
          )}
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-white">
              {user.name || user.email}
            </div>
            <div className="text-xs text-gray-400">
              {user.role === 'user' ? 'مستخدم' : 'مدير'}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          خروج
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <button
        onClick={handleLogin}
        className="border border-[#00e6c0] text-[#00e6c0] px-6 py-2 rounded hover:bg-[#00e6c0] hover:text-[#151e2e] transition"
      >
        دخول
      </button>
    </div>
  );
}











