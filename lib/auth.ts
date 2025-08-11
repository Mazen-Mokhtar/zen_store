// إدارة حالة تسجيل الدخول والتوكن
export interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false
  };

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          this.authState = {
            user,
            token,
            isAuthenticated: true
          };
        } catch (error) {
          this.clearAuth();
        }
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      if (this.authState.token && this.authState.user) {
        localStorage.setItem('auth_token', this.authState.token);
        localStorage.setItem('auth_user', JSON.stringify(this.authState.user));
      } else {
        this.clearStorage();
      }
    }
  }

  private clearStorage() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }

  setAuth(token: string, user: User) {
    this.authState = {
      user,
      token,
      isAuthenticated: true
    };
    this.saveToStorage();
  }

  clearAuth() {
    this.authState = {
      user: null,
      token: null,
      isAuthenticated: false
    };
    this.clearStorage();
  }

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  getToken(): string | null {
    return this.authState.token;
  }

  getUser(): User | null {
    return this.authState.user;
  }

  // دالة تسجيل الدخول
  async login(email: string, password: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // تحديد عنوان API بشكل صريح من متغيرات البيئة لتجنب إرسال الطلب إلى تطبيق Next.js
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const apiUrl = `${apiBase}/auth/login`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        // نستخدم include فقط إذا كان الخادم يعتمد على الكوكيز، وإلا يمكن حذف هذا السطر
        // وفي حالتنا نستقبل accessToken في الـ body لذا لسنا بحاجة إلى الكوكيز
        // credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'فشل في تسجيل الدخول'
        };
      }

      // حفظ بيانات المستخدم والتوكن
      const accessToken = data.data?.accessToken;
      
      if (!accessToken) {
        return {
          success: false,
          error: 'لم يتم العثور على رمز الوصول في الاستجابة'
        };
      }

      // استخدام المستخدم القادم من الخادم إن وجد، وإلا فfallback بسيط
      const serverUser: Partial<User> | undefined = data.data?.user;
      const user: User = {
        _id: serverUser?._id ?? '',
        email: serverUser?.email ?? email,
        name: serverUser?.name ?? (email.includes('@') ? email.split('@')[0] : email),
        role: serverUser?.role ?? 'user'
      };

      // حفظ التوكن والمستخدم في حالة المصادقة
      this.setAuth(accessToken, user);

      // إرجاع البيانات للاستخدام الفوري
      return {
        success: true,
        data: {
          ...data,
          user // إضافة بيانات المستخدم للاستخدام الفوري
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'حدث خطأ في الاتصال بالخادم'
      };
    }
  }

  // دالة تسجيل الخروج
  logout() {
    this.clearAuth();
  }
}

export const authService = AuthService.getInstance();

