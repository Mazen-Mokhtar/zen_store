import { ApiError } from './api-error';

// تحديد عنوان API بناءً على بيئة التشغيل
let API_BASE_URL: string;

// في بيئة المتصفح، استخدم نفس المنفذ لتجنب مشكلة CORS
if (typeof window !== 'undefined') {
  const baseUrl = window.location.origin;
  API_BASE_URL = baseUrl.includes('localhost') 
    ? 'http://localhost:3000' 
    : baseUrl;
} else {
  // في بيئة الخادم، استخدم القيمة من متغيرات البيئة أو القيمة الافتراضية
  API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
}

console.log('🌐 API Base URL:', API_BASE_URL);

export interface Game {
  _id: string;
  name: string;
  image: {
    secure_url: string;
    public_id: string;
  };
  description?: string;
  price?: number;
  originalPrice?: number;
  category?: string;
  isPopular?: boolean;
  offer?: string;
  isActive?: boolean;
  createdAt?: string;
  accountInfoFields?: { fieldName: string; isRequired: boolean }[];
}

export interface Package {
  _id: string;
  title: string; // عنوان الباقة (مثل "100 Diamonds", "500 Coins")
  price: number; // سعر الباقة
  originalPrice?: number; // السعر الأصلي قبل الخصم
  finalPrice?: number; // السعر النهائي بعد الخصم
  discountPercentage?: number; // نسبة الخصم
  isOffer?: boolean; // هل الباقة عرض
  currency?: string; // العملة (مثل "EGP", "USD")
  gameId: string; // معرف اللعبة
  isActive: boolean; // هل الباقة مفعلة
  image?: {
    secure_url: string;
    public_id: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log('🌐 Making API request to:', url);
    
    // Create headers ensuring all values are strings and preserve provided headers
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    
    // Add token from authService if available
    if (typeof window !== 'undefined') {
      // استيراد authService بطريقة ديناميكية لتجنب مشاكل التدوير الدائري
      const { authService } = require('./auth');
      const token = authService.getToken();
      if (token) {
        // Backend expects raw token; send in both Authorization and token headers for compatibility
        if (!headers.has('Authorization')) headers.set('Authorization', token);
        if (!headers.has('token')) headers.set('token', token);
      }
    }
    
    // Ensure options do not contain an obsolete headers object that would override our merged headers
    const { headers: _omitHeaders, ...restOptions } = options;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        ...restOptions,
        headers,
        signal: controller.signal,
        credentials: 'same-origin', // إضافة خيار credentials لتجنب مشكلة CORS
      });

      clearTimeout(timeoutId);
      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        console.error('❌ خطأ في API:', response.status, response.statusText);
        throw ApiError.fromResponse(response);
      }

      const data = await response.json();
      console.log('✅ API Response data:', data);
      return data;
    } catch (error) {
      console.error('❌ خطأ في طلب API:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408, 'TIMEOUT');
      }
      throw ApiError.networkError();
    }
  }

  async getGamesByCategory(categoryId: string) {
    try {
      console.log('🎮 getGamesByCategory called with categoryId:', categoryId);
      
      const response = await this.request<{ 
        success: boolean; 
        data: Game[]; 
        total: number; 
        category: { id: string; name: string; logo: any } 
      }>(`/game/category/${categoryId}`);
      
      console.log('✅ getGamesByCategory response:', {
        success: response.success,
        dataLength: response.data?.length || 0,
        total: response.total,
        category: response.category
      });
      
      return {
        success: response.success,
        data: response.data || []
      };
    } catch (error) {
      console.error('❌ فشل في جلب الألعاب حسب الفئة:', error);
      return {
        success: false,
        data: []
      };
    }
  }

  async getPackagesByGameId(gameId: string) {
    try {
      console.log('📦 getPackagesByGameId called with gameId:', gameId);
      
      const response = await this.request<{ 
        success: boolean; 
        data: Package[] 
      }>(`/packages?gameId=${gameId}`);
      
      console.log('✅ getPackagesByGameId response:', {
        success: response.success,
        dataLength: response.data?.length || 0
      });
      
      return {
        success: response.success,
        data: response.data || []
      };
    } catch (error) {
      console.error('❌ فشل في جلب الباقات حسب اللعبة:', error);
      return {
        success: false,
        data: []
      };
    }
  }

  async getGameById(gameId: string) {
    try {
      console.log('🎮 getGameById called with gameId:', gameId);
      
      const response = await this.request<{ 
        success: boolean; 
        data: Game 
      }>(`/game/${gameId}`);
      
      console.log('✅ getGameById response:', {
        success: response.success,
        game: response.data
      });
      
      return {
        success: response.success,
        data: response.data
      };
    } catch (error) {
      console.error('❌ فشل في جلب اللعبة:', error);
      return {
        success: false,
        data: null
      };
    }
  }

  // New: get paid games by category (for category-dashboard)
  async getPaidGamesByCategory(categoryId: string) {
    try {
      console.log('🎮 getPaidGamesByCategory called with categoryId:', categoryId);

      const response = await this.request<{
        success: boolean;
        data: Game[];
        total?: number;
        category?: { id: string; name: string; logo: any };
      }>(`/game/category/${categoryId}/paid`);

      console.log('✅ getPaidGamesByCategory response:', {
        success: response.success,
        dataLength: Array.isArray(response.data) ? response.data.length : 0,
        total: (response as any).total,
        category: (response as any).category
      });

      return {
        success: response.success,
        data: Array.isArray(response.data) ? response.data : []
      } as { success: boolean; data: Game[] };
    } catch (error) {
      console.error('❌ فشل في جلب ألعاب الفئة المدفوعة:', error);
      return {
        success: false,
        data: []
      } as { success: boolean; data: Game[] };
    }
  }

  // New: get category with packages (for dashboard)
  async getCategoryWithPackages(categoryId: string) {
    try {
      console.log('🎮 getCategoryWithPackages called with categoryId:', categoryId);

      const response = await this.request<{
        success: boolean;
        data: { games?: Game[]; packages?: Package[] } | Game[];
        total?: number;
        category?: { id: string; name: string; logo: any };
      }>(`/game/category/${categoryId}/with-packages`);

      const games = Array.isArray(response.data)
        ? response.data
        : (response.data?.games || []);
      const packages = Array.isArray(response.data)
        ? []
        : (response.data?.packages || []);

      console.log('✅ getCategoryWithPackages response:', {
        success: response.success,
        gamesLength: games.length,
        packagesLength: packages.length,
        total: (response as any).total,
        category: (response as any).category
      });

      return {
        success: response.success,
        data: games,
        packages
      } as { success: boolean; data: Game[]; packages: Package[] };
    } catch (error) {
      console.error('❌ فشل في جلب الفئة مع الباقات:', error);
      return {
        success: false,
        data: [],
        packages: []
      } as { success: boolean; data: Game[]; packages: Package[] };
    }
  }
}

export const apiService = new ApiService();

// Order related interfaces and functions
export interface Order {
  _id: string;
  gameId: {
    _id: string;
    name: string;
    image: {
      secure_url: string;
    };
  };
  packageId: {
    _id: string;
    title: string;
    price: number;
    currency: string;
  };
  accountInfo: { fieldName: string; value: string }[];
  status: 'pending' | 'paid' | 'delivered' | 'rejected';
  paymentMethod: 'card' | 'cash';
  totalAmount: number;
  adminNote?: string;
  createdAt: string;
  paidAt?: string;
  refundAmount?: number;
  refundDate?: string;
}

export interface CreateOrderData {
  gameId: string;
  packageId: string;
  accountInfo: { fieldName: string; value: string }[];
  paymentMethod: 'card' | 'cash';
  note?: string;
}

// Add order methods to ApiService
class OrderApiService extends ApiService {
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    try {
      // استيراد authService بطريقة ديناميكية
      const { authService } = require('./auth');
      return authService.getToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      // Fallback to localStorage in case of error
      return localStorage.getItem('auth_token');
    }
  }
  
  private async authenticatedRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const token = this.getAuthToken();
      // If endpoint is an internal Next.js API route, don't prefix with API_BASE_URL
      const isInternalApi = endpoint.startsWith('/api/');
      const fullUrl = isInternalApi ? endpoint : `${API_BASE_URL}${endpoint}`;
      
      console.log('🔍 Request Details:', {
        url: fullUrl,
        method: options.method || 'GET',
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 10)}...` : 'No token',
        timestamp: new Date().toISOString(),
        // Do not attempt to JSON.parse unknown body shapes; safely stringify for logs
        bodyPreview: (() => {
          try {
            if (!options.body) return undefined;
            if (typeof options.body === 'string') return JSON.parse(options.body);
            // FormData/URLSearchParams/Blob/ArrayBuffer are not previewed
            return '[non-string body]';
          } catch {
            return '[unparseable body]';
          }
        })()
      });
      
      // Create headers ensuring all values are strings and preserve provided headers
      const headers = new Headers(options.headers || {});
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      
      if (token) {
        // Backend expects raw token; send in both Authorization and token headers for compatibility
        headers.set('Authorization', token);
        headers.set('token', token);
        
        // Also include the token in the request body for APIs that might expect it there
        if (options.body && typeof options.body === 'string') {
          try {
            const parsed = JSON.parse(options.body);
            options.body = JSON.stringify({ ...parsed, token });
          } catch (e) {
            console.warn('Could not add token to request body:', e);
          }
        }
      }
      
      // Ensure options do not contain an obsolete headers object that would override our merged headers
      const { headers: _omitHeaders2, ...restOptions } = options;
      
      // Create fetch options with proper headers
      const fetchOptions: RequestInit = {
        ...restOptions,
        headers,
        credentials: 'same-origin' as RequestCredentials, // تغيير من 'include' إلى 'same-origin' لتجنب مشكلة CORS
      };
      
      // Log the final request before sending
      console.log('🚀 Sending request:', {
        url: fullUrl,
        method: fetchOptions.method,
        headers: Object.fromEntries(headers.entries()),
        credentials: fetchOptions.credentials,
        timestamp: new Date().toISOString()
      });
      
      // Make the request
      const response = await fetch(fullUrl, fetchOptions);
      
      // Log response details
      console.log('📡 Response received:', {
        url: fullUrl,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        redirected: response.redirected,
        type: response.type,
        timestamp: new Date().toISOString()
      });
      
      // Handle non-OK responses
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('❌ API Error Response:', {
            status: response.status,
            error: errorData,
            timestamp: new Date().toISOString()
          });
        } catch (parseError) {
          const text = await response.text();
          console.error('❌ Failed to parse error response:', {
            status: response.status,
            responseText: text,
            timestamp: new Date().toISOString()
          });
          errorData = { message: text || 'Unknown error occurred' };
        }
        
        throw ApiError.fromResponse(new Response(JSON.stringify(errorData), {
          status: response.status,
          statusText: response.statusText
        }));
      }
      
      // Parse and return successful response
      try {
        const data = await response.json();
        return data as T;
      } catch (parseError) {
        console.error('❌ Failed to parse successful response:', parseError);
        throw new Error('Failed to parse API response');
      }
    } catch (error) {
      console.error('🔥 Request failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      if (error instanceof TypeError && typeof navigator !== 'undefined' && error.message.includes('fetch')) {
        console.error('🌐 Network error detected. Please check:', {
          isOnline: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
          apiUrl: `${API_BASE_URL}${endpoint}`,
          timestamp: new Date().toISOString()
        });
      }
      
      throw error;
    }
  }
  async getUserOrders(): Promise<{ success: boolean; data: Order[] }> {
    try {
      console.log('📦 getUserOrders called');
      
      const response = await this.authenticatedRequest<{ 
        success: boolean; 
        data: Order[] 
      }>('/api/order');
      
      console.log('✅ getUserOrders response:', {
        success: response.success,
        dataLength: response.data?.length || 0
      });
      
      return {
        success: response.success,
        data: response.data || []
      };
    } catch (error) {
      console.error('❌ فشل في جلب الطلبات:', error);
      return {
        success: false,
        data: []
      };
    }
  }

  async createOrder(orderData: CreateOrderData): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Get the token to include in the request
      const token = this.getAuthToken();
      
      // Log the order data being sent
      console.log('📝 Order data being sent:', JSON.stringify(orderData, null, 2));
      console.log('🔑 Using token:', token ? `${token.substring(0, 10)}...` : 'No token found');
      
      // Prepare headers with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      // Add token to headers if available
      if (token) {
        // Backend expects raw token; include both Authorization and token headers
        headers['Authorization'] = token;
        headers['token'] = token;
      }
      
      // Include credentials for same-origin requests
      const requestOptions: RequestInit = {
        method: 'POST',
        headers,
        body: JSON.stringify(token ? { ...orderData, token } : orderData),
        credentials: 'same-origin' as RequestCredentials // تغيير من 'include' إلى 'same-origin' لتجنب مشكلة CORS
      };
      
      // Make the request
      // Use internal Next route to ensure the request passes through app/api/order/route.ts
      const response = await this.authenticatedRequest<any>('/api/order', requestOptions);
      
      console.log('✅ Order created successfully:', response);
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('❌ Error in createOrder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      };
    }
  }

  async cancelOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📦 cancelOrder called with orderId:', orderId);
      
      const response = await this.authenticatedRequest<{ 
        success: boolean; 
        data: string 
      }>(`/api/order/${orderId}/cancel`, {
        method: 'PATCH'
      });
      
      console.log('✅ cancelOrder response:', response);
      
      return {
        success: response.success
      };
    } catch (error) {
      console.error('❌ فشل في إلغاء الطلب:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'فشل في إلغاء الطلب'
      };
    }
  }

  async getOrderDetails(orderId: string): Promise<{ success: boolean; data?: Order; error?: string }> {
    try {
      console.log('📦 getOrderDetails called with orderId:', orderId);
      
      const response = await this.authenticatedRequest<{ 
        success: boolean; 
        data: Order 
      }>(`/api/order/${orderId}`);
      
      console.log('✅ getOrderDetails response:', response);
      
      return {
        success: response.success,
        data: response.data
      };
    } catch (error) {
      console.error('❌ فشل في جلب تفاصيل الطلب:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'فشل في جلب تفاصيل الطلب'
      };
    }
  }

  async checkout(orderId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('📦 checkout called with orderId:', orderId);
      
      const response = await this.authenticatedRequest<{ 
        success: boolean; 
        data: any 
      }>(`/api/order/${orderId}/checkout`, {
        method: 'POST'
      });
      
      console.log('✅ checkout response:', response);
      
      return {
        success: response.success,
        data: response.data
      };
    } catch (error) {
      console.error('❌ فشل في إتمام الدفع:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'فشل في إتمام الدفع'
      };
    }
  }
}

export const orderApiService = new OrderApiService();