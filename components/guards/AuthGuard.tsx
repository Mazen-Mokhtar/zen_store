"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/auth";
import { notificationService } from "@/lib/notifications";
import { securityManager } from "@/lib/security";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
  fallbackUrl?: string;
}

export default function AuthGuard({ 
  children, 
  requiredRole = 'user',
  fallbackUrl = '/signin' 
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [checked, setChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Security monitoring callback
  const logSecurityEvent = useCallback((eventType: string, details: any) => {
    console.warn('Security event:', eventType, {
      ...details,
      pathname,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    });
  }, [pathname]);

  // Enhanced token validation
  const validateToken = useCallback(async (token: string | null): Promise<boolean> => {
    if (!token) return false;
    
    try {
      // Check if token is expired
      if (authService.isTokenExpired(token)) {
        logSecurityEvent('token_expired', { token: token.substring(0, 10) + '...' });
        return false;
      }
      
      // Validate token payload
      const payload = authService.getTokenPayload(token);
      if (!payload || !payload.userId) {
        logSecurityEvent('invalid_token_payload', { hasPayload: !!payload });
        return false;
      }
      
      // Check role authorization
      if (requiredRole && payload.role !== requiredRole && payload.role !== 'admin' && payload.role !== 'superAdmin') {
        logSecurityEvent('insufficient_permissions', { 
          required: requiredRole, 
          actual: payload.role 
        });
        return false;
      }
      
      return true;
    } catch (error) {
      logSecurityEvent('token_validation_error', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }, [requiredRole, logSecurityEvent]);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const verify = async () => {
      try {
        // Security: Clear any potential XSS attempts in URL
        const urlParams = new URLSearchParams(window.location.search);
        const userDataParam = urlParams.get('userData');
        
        if (userDataParam) {
          try {
            // Sanitize and validate user data from URL
            const sanitizedData = securityManager.sanitizeInput(decodeURIComponent(userDataParam));
            const userData = JSON.parse(sanitizedData);
            
            // Validate user data structure
            if (userData && typeof userData === 'object' && userData.email) {
              localStorage.setItem('auth_user', JSON.stringify(userData));
              
              authService.setAuthState({
                user: userData,
                token: null,
                isAuthenticated: true
              });
              
              // Clean up URL to prevent replay attacks
              urlParams.delete('userData');
              const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
              window.history.replaceState({}, '', newUrl);
              
              if (mounted) {
                setIsAuthorized(true);
                setChecked(true);
              }
              return;
            }
          } catch (error) {
            logSecurityEvent('oauth_data_parse_error', { error: error instanceof Error ? error.message : 'Parse failed' });
            setAuthError('بيانات المصادقة غير صحيحة');
          }
        }
        
        // Check authentication status with enhanced security
        const currentToken = authService.getToken();
        
        // Check if user has a valid session (for Google OAuth users)
        const sessionCheckResponse = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (sessionCheckResponse.ok) {
          // User has valid session - extract and save user data
          const sessionData = await sessionCheckResponse.json();
          if (sessionData.success && sessionData.data?.user) {
            // Save user data to auth service
            authService.setAuthState({
              user: sessionData.data.user,
              token: null,
              isAuthenticated: true
            });
            
            // Save to localStorage for persistence
            localStorage.setItem('auth_user', JSON.stringify(sessionData.data.user));
          }
          
          if (mounted) {
            setIsAuthorized(true);
            setChecked(true);
            logSecurityEvent('auth_success', { pathname, authMethod: 'session' });
          }
        } else {
          // Try to extend/refresh session first
          try {
            const extendResponse = await fetch('/api/auth/extend-session', {
              method: 'POST',
              credentials: 'include'
            });
            
            if (extendResponse.ok) {
              // Session extended successfully, retry validation
              const retryResponse = await fetch('/api/auth/session', {
                method: 'GET',
                credentials: 'include'
              });
              
              if (retryResponse.ok) {
                // Extract and save user data from extended session
                const sessionData = await retryResponse.json();
                if (sessionData.success && sessionData.data?.user) {
                  authService.setAuthState({
                    user: sessionData.data.user,
                    token: null,
                    isAuthenticated: true
                  });
                  localStorage.setItem('auth_user', JSON.stringify(sessionData.data.user));
                }
                
                if (mounted) {
                  setIsAuthorized(true);
                  setChecked(true);
                  logSecurityEvent('auth_success', { pathname, authMethod: 'session_extended' });
                }
                return;
              }
            }
          } catch (extendError) {
            console.log('Session extension failed:', extendError);
          }
          
          // Fallback to token validation
          const isTokenValid = await validateToken(currentToken);
          
          if (isTokenValid) {
            const isServerValid = await authService.checkAuthStatus();
            
            if (mounted) {
              if (isServerValid) {
                setIsAuthorized(true);
                setChecked(true);
                logSecurityEvent('auth_success', { pathname, authMethod: 'token' });
              } else {
                logSecurityEvent('server_auth_failed', { pathname });
                setAuthError('فشل في التحقق من الخادم');
                handleAuthFailure();
              }
            }
          } else {
            if (mounted) {
              logSecurityEvent('client_auth_failed', { pathname, hasToken: !!currentToken, hasSession: false });
              setAuthError('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');
              handleAuthFailure();
            }
          }
        }
      } catch (error) {
        if (mounted) {
          logSecurityEvent('auth_verification_error', { 
            error: error instanceof Error ? error.message : 'Unknown error',
            pathname 
          });
          setAuthError('خطأ في التحقق من الهوية');
          handleAuthFailure();
        }
      }
    };

    const handleAuthFailure = () => {
      // Clear potentially compromised auth data
      authService.clearAuth();
      
      // Set timeout to prevent infinite loops
      timeoutId = setTimeout(() => {
        if (mounted) {
          const returnUrl = encodeURIComponent(`${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
          router.push(`${fallbackUrl}?returnUrl=${returnUrl}`);
        }
      }, 100);
    };

    // Start verification
    verify();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pathname, router, searchParams, validateToken, logSecurityEvent, fallbackUrl]);

  useEffect(() => {
    // Cross-tab/session sync: since token is not in localStorage anymore, listen to user changes
    const onStorage = (e: StorageEvent) => {
      if (e.key === "auth_user" || e.key === null) {
        const isAuthed = authService.isAuthenticated();
        if (!isAuthed) {
          const search = searchParams?.toString();
          const returnUrl = encodeURIComponent(`${pathname}${search ? `?${search}` : ""}`);
          try {
            notificationService.warning("انتهت الجلسة", "تم تسجيل خروجك. يرجى تسجيل الدخول مرة أخرى");
          } catch {}
          router.replace(`/signin?returnUrl=${returnUrl}`);
        }
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [pathname, searchParams, router]);

  // Loading state with security considerations
  if (!checked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-400 text-sm">جاري التحقق من الهوية...</p>
        {authError && (
          <p className="mt-2 text-red-400 text-sm">{authError}</p>
        )}
      </div>
    );
  }

  // Authorization check
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">غير مصرح بالوصول</h2>
          <p className="text-gray-400 mb-4">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}