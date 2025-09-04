import { notificationService } from './notifications';
import { 
  getCachedApiData, 
  setCachedApiData, 
  getCachedData, 
  setCachedData, 
  CACHE_TTL, 
  CACHE_KEYS,
  invalidateCache,
  CachePriority 
} from './cache';
import type { Order, CreateOrderData } from './types';
import { logger } from './utils';
import { securityManager } from './security';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: string;
}

export interface Game {
  _id: string;
  name: string;
  slug?: string;
  type?: 'steam' | 'games' | 'subscription';
  image: {
    secure_url: string;
    public_id: string;
  };
  images?: {
    secure_url: string;
    public_id: string;
  }[];
  video?: {
    secure_url: string;
    public_id: string;
  };
  backgroundImage?: {
    secure_url: string;
    public_id: string;
  };
  description?: string;
  price?: number;
  originalPrice?: number;
  isOffer?: boolean;
  finalPrice?: number;
  discountPercentage?: number;
  category?: string;
  isPopular?: boolean;
  offer?: string;
  isActive?: boolean;
  createdAt?: string;
  accountInfoFields?: { fieldName: string; isRequired: boolean }[];
  tags?: string[];
}

export interface Package {
  _id: string;
  title: string;
  price: number;
  originalPrice?: number;
  finalPrice?: number;
  discountPercentage?: number;
  isOffer?: boolean;
  currency?: string;
  gameId: string;
  isActive: boolean;
  image?: {
    secure_url: string;
    public_id: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Import shared types from types module
export type { Order, CreateOrderData } from './types';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  timeout?: number;
  retry?: number;
  skipAuth?: boolean;
}

class ApiService {
  private readonly timeout = 10000; // 10 seconds
  private readonly retryAttempts = 3;
  private readonly retryDelay = 1000; // 1 second

  // Get CSRF token from session storage or generate new one
  private getCSRFToken(): string {
    if (typeof window !== 'undefined') {
      let token = sessionStorage.getItem('csrf_token');
      const generatedAt = sessionStorage.getItem('csrf_generated_at');
      
      // Check if token exists and is not expired (30 minutes)
      if (token && generatedAt) {
        const tokenAge = Date.now() - parseInt(generatedAt);
        if (tokenAge < 30 * 60 * 1000) { // 30 minutes
          return token;
        }
      }
      
      // Generate new token
      token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('csrf_token', token);
      sessionStorage.setItem('csrf_generated_at', Date.now().toString());
      return token;
    }
    
    // Fallback for server-side rendering
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Base request method with timeout and error handling
  private async request<T>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<T> {
    const { timeout = this.timeout, retry = 0, skipAuth = false, ...fetchOptions } = options;
    
    const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        // Prefer Next.js API proxy for same-origin cookie forwarding when using relative '/api' endpoints
        let url = endpoint.startsWith('http') ? endpoint : (endpoint.startsWith('/api') ? endpoint : `${API_BASE_URL}${endpoint}`);
        
        const headers = new Headers({
          'X-CSRF-Token': this.getCSRFToken(),
          'X-Requested-With': 'XMLHttpRequest',
        });

        // Only set Content-Type to application/json if we're not sending FormData
        if (!(fetchOptions.body instanceof FormData)) {
          headers.set('Content-Type', 'application/json');
        }

      if (fetchOptions.headers) {
        const incoming = new Headers(fetchOptions.headers as HeadersInit);
        incoming.forEach((value, key) => headers.set(key, value));
      }

      // Do not attach Authorization header when using httpOnly cookie
      if (!skipAuth) {
        // We no longer attach Authorization tokens client-side.
        // All authenticated requests must go through relative Next.js API routes (/api/*)
        // which automatically include httpOnly cookies.
      }

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
        credentials: url.startsWith('/api') ? 'include' : 'same-origin',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response, retry, endpoint, options);
      }

      return await this.parseResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiError) {
        throw error; // Re-throw ApiError instances
      }
      
      // Handle network/timeout errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError(408, 'Request timeout');
        }
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          throw new ApiError(0, 'No internet connection');
        }
        if (retry < this.retryAttempts && this.isRetryableError(error)) {
          await this.delay(this.retryDelay * (retry + 1));
          return this.request<T>(endpoint, { ...options, retry: retry + 1 });
        }
        throw new ApiError(0, `Network error: ${error.message}`);
      }
      throw new ApiError(500, 'Unknown error occurred');
    }
  }

  private async handleErrorResponse(
    response: Response, 
    retry: number, 
    endpoint: string, 
    options: RequestOptions
  ): Promise<never> {
    let errorData: any;
    
    try {
      errorData = await response.json();
    } catch {
      // If JSON parsing fails, try to get text
      try {
        const text = await response.text();
        
        // Check if we received a multipart response
        if (text.includes('------WebK') || text.includes('boundary=')) {
          errorData = { 
            message: 'Server returned multipart response instead of JSON. This may indicate a server configuration issue.' 
          };
        } else {
          errorData = { message: text || 'Unknown server error' };
        }
      } catch {
        errorData = { message: 'Unknown server error' };
      }
    }

    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      await this.handleAuthError(response.status, errorData);
    }

    // Retry logic for server errors (5xx)
    if (response.status >= 500 && retry < this.retryAttempts) {
      await this.delay(this.retryDelay * (retry + 1));
      return this.request(endpoint, { ...options, retry: retry + 1 });
    }

    const message = errorData?.message || `HTTP ${response.status}`;
    throw new ApiError(response.status, message, errorData);
  }

  private async handleAuthError(status: number, errorData: any): Promise<void> {
    const { authService } = await import('./auth');
    
    logger.warn(`Authentication error ${status}:`, errorData);
    
    if (status === 401) {
      // Clear auth and redirect immediately without notifications
      authService.logout();
      
      // Redirect to signin page if we're in browser
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const returnUrl = encodeURIComponent(currentPath + window.location.search);
        window.location.replace(`/signin?returnUrl=${returnUrl}`);
      }
    } else if (status === 403) {
      // Access denied - don't clear auth, just notify
      notificationService.error(
        'وصول مرفوض',
        'ليس لديك الصلاحية للوصول إلى هذا المورد'
      );
    }
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch (error) {
        // If JSON parsing fails, try to get text and check for multipart boundary issues
        const text = await response.text();
        if (text.includes('------WebK') || text.includes('boundary=')) {
          throw new ApiError(500, 'Server returned malformed multipart response instead of JSON');
        }
        throw new ApiError(500, `Invalid JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // For non-JSON responses, return text as data
    const text = await response.text();
    
    // Check if we received a multipart response when we expected something else
    if (text.includes('------WebK') || text.includes('boundary=')) {
      throw new ApiError(500, 'Server returned unexpected multipart response');
    }
    
    return { data: text } as unknown as T;
  }

  private isRetryableError(error: Error): boolean {
    // Network errors that are worth retrying
    const retryableErrors = [
      'fetch',
      'network',
      'timeout',
      'connection',
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED'
    ];
    
    return retryableErrors.some(keyword => 
      error.message.toLowerCase().includes(keyword)
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Authenticated request wrapper
  async authenticatedRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    // Ensure we have a valid token before making the request
    const { authService } = await import('./auth');
    
    if (!authService.isAuthenticated()) {
      // Redirect to signin immediately without showing error message
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const returnUrl = encodeURIComponent(currentPath + window.location.search);
        window.location.replace(`/signin?returnUrl=${returnUrl}`);
      }
      throw new ApiError(401, 'Authentication required');
    }

    return this.request<T>(endpoint, { ...options, skipAuth: false });
  }

  // Public endpoints that don't require auth
  async publicRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, skipAuth: true });
  }

  // Convenience methods
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    // Add CSRF token to request body for POST requests
    const requestData = {
      ...data,
      csrf_token: this.getCSRFToken()
    };
    
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: requestData ? JSON.stringify(requestData) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    // Add CSRF token to request body for PUT requests
    const requestData = {
      ...data,
      csrf_token: this.getCSRFToken()
    };
    
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: requestData ? JSON.stringify(requestData) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': this.getCSRFToken(),
        ...options?.headers
      },
      ...options,
    });
  }

  // Public methods for unauthenticated endpoints
  async getPublic<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    // Only cache idempotent GET requests
    const method = (options?.method || 'GET').toUpperCase();
    if (method === 'GET') {
      const cacheKey = `GET:${endpoint}`;
      const cached = getCachedData<T>(cacheKey);
      if (cached) return cached;

      const res = await this.publicRequest<T>(endpoint, { ...options, method: 'GET' });
      // Heuristic TTL: longer for catalog endpoints
      const ttl = endpoint.includes('/game') || endpoint.includes('/packages')
        ? CACHE_TTL.MEDIUM
        : CACHE_TTL.SHORT;
      setCachedData(cacheKey, res as any, ttl);
      return res;
    }

    return this.publicRequest<T>(endpoint, { ...options, method });
  }

  // Legacy compatibility methods for existing pages
  async getGameById(gameId: string): Promise<{ success: boolean; data: Game }> {
    try {
      const cacheKey = `${CACHE_KEYS.GAMES}:${gameId}`;
      const cached = getCachedApiData<{ success: boolean; data: Game }>(cacheKey);
      if (cached) return cached;

      const result = await this.getPublic<{ success: boolean; data: Game }>(`/game/${gameId}`);
      setCachedApiData(cacheKey, result, CACHE_TTL.LONG);
      return result;
    } catch (error) {
      logger.error('Failed to get game by id:', error);
      return { success: false, data: null as any };
    }
  }

  async getPackagesByGameId(gameId: string): Promise<{ success: boolean; data: Package[] }> {
    try {
      const cacheKey = `${CACHE_KEYS.PACKAGES}:game:${gameId}`;
      const cached = getCachedApiData<{ success: boolean; data: Package[] }>(cacheKey);
      if (cached) return cached;

      const result = await this.getPublic<{ success: boolean; data: Package[] }>(`/packages?gameId=${gameId}`);
      setCachedApiData(cacheKey, result, CACHE_TTL.MEDIUM);
      return result;
    } catch (error) {
      logger.error('Failed to get packages by game id:', error);
      return { success: false, data: [] };
    }
  }

  async getCategoryWithPackages(categoryId: string): Promise<{ success: boolean; data: Game[]; packages: Package[] }> {
    try {
      const cacheKey = `category-with-packages:${categoryId}`;
      const cached = getCachedData<{ success: boolean; data: Game[]; packages: Package[] }>(cacheKey);
      if (cached) return cached;

      const response = await this.getPublic<{
        success: boolean;
        data: Game[] | { games?: Game[]; packages?: Package[] };
      }>(`/game/category/${categoryId}/with-packages`);

      const normalized = Array.isArray(response.data)
        ? { success: response.success, data: response.data, packages: [] }
        : {
            success: response.success,
            data: (response as any).data?.games || [],
            packages: (response as any).data?.packages || [],
          };

      setCachedData(cacheKey, normalized, CACHE_TTL.MEDIUM);
      return normalized;
    } catch (error) {
      logger.error('Failed to get category with packages:', error);
      return { success: false, data: [], packages: [] };
    }
  }

  async getPaidGamesByCategory(categoryId: string): Promise<{ success: boolean; data: Game[] }> {
    try {
      const cacheKey = `paid-games:${categoryId}`;
      const cached = getCachedData<{ success: boolean; data: Game[] }>(cacheKey);
      if (cached) return cached;

      const response = await this.getPublic<{ success: boolean; data: Game[] }>(`/game/category/${categoryId}/paid`);
      setCachedData(cacheKey, response, CACHE_TTL.MEDIUM);
      return response;
    } catch (error) {
      logger.error('Failed to get paid games by category:', error);
      return { success: false, data: [] };
    }
  }

  async getGamesByCategory(categoryId: string): Promise<{ success: boolean; data: Game[] }> {
    try {
      const cacheKey = `games-by-category:${categoryId}`;
      const cached = getCachedData<{ success: boolean; data: Game[] }>(cacheKey);
      if (cached) return cached;

      const response = await this.getPublic<{ success: boolean; data: Game[] }>(`/game/category/${categoryId}`);
      setCachedData(cacheKey, response, CACHE_TTL.MEDIUM);
      return response;
    } catch (error) {
      logger.error('Failed to get games by category:', error);
      return { success: false, data: [] };
    }
  }

  // Generic API methods with enhanced caching
  async getGames(): Promise<any> {
    const cacheKey = CACHE_KEYS.GAMES;
    const cached = getCachedApiData(cacheKey);
    if (cached) return cached;

    const result = await this.getPublic('/game');
    setCachedApiData(cacheKey, result, CACHE_TTL.MEDIUM);
    return result;
  }

  async getGamePackages(gameId: string): Promise<any> {
    const cacheKey = `${CACHE_KEYS.PACKAGES}:${gameId}`;
    const cached = getCachedApiData(cacheKey);
    if (cached) return cached;

    const result = await this.getPublic(`/game/${gameId}/packages`);
    setCachedApiData(cacheKey, result, CACHE_TTL.SHORT);
    return result;
  }

  // Steam game specific methods
  async getSteamGameBySlug(slug: string): Promise<{ success: boolean; data: any }> {
    try {
      return await this.getPublic<{ success: boolean; data: any }>(`/game/steam/${slug}`);
    } catch (error) {
      logger.error('Failed to get Steam game by slug:', error);
      return { success: false, data: null };
    }
  }

  async getSteamGameById(gameId: string): Promise<{ success: boolean; data: any }> {
    try {
      return await this.getPublic<{ success: boolean; data: any }>(`/game/steam/${gameId}`);
    } catch (error) {
      logger.error('Failed to get Steam game by id:', error);
      return { success: false, data: null };
    }
  }
}

// Order-specific API service
class OrderApiService {
  private api: ApiService;

  constructor() {
    this.api = new ApiService();
  }

  async getUserOrders(): Promise<{ success: boolean; data: Order[] }> {
    try {
      // Create a user-scoped cache key
      const { authService } = await import('./auth');
      const user = authService.getUser();

      if (!user) {
        return { success: false, data: [] };
      }

      const cacheKey = `user-orders:${user._id}`;
      const cached = getCachedData<{ success: boolean; data: Order[] }>(cacheKey);
      if (cached) return cached;

      const response = await this.api.authenticatedRequest<{ success: boolean; data: Order[] }>(
        '/api/order'
      );

      // Short TTL for authenticated data
      setCachedData(cacheKey, response, CACHE_TTL.SHORT);
      return response;
    } catch (error) {
      logger.error('Failed to get user orders:', error);
      
      // Handle authentication errors - redirect handled by authenticatedRequest
      if (error instanceof ApiError && error.status === 401) {
        // Silent handling - redirect already handled
        return { success: false, data: [] };
      }
      
      return { success: false, data: [] };
    }
  }

  async createOrder(orderData: CreateOrderData): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.api.authenticatedRequest<any>('/api/order', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });

      // Invalidate user orders cache after creating an order
      try {
        const { authService } = await import('./auth');
        const user = authService.getUser();
        if (user) {
          const cacheKey = `user-orders:${user._id}`;
          invalidateCache(cacheKey);
        }
      } catch (e) {
        logger.warn('Failed to invalidate user orders cache after createOrder:', e);
      }

      return { success: true, data: response.data || response };
    } catch (error) {
      logger.error('Failed to create order:', error);
      
      // Handle authentication errors - redirect handled by authenticatedRequest
      if (error instanceof ApiError && error.status === 401) {
        // Silent return - redirect already handled
        return {
          success: false,
          error: ''
        };
      }
      
      // Handle validation errors (400 Bad Request)
      if (error instanceof ApiError && error.status === 400) {
        // Check if the error data contains validation error info
        const errorMessage = error.data?.error || error.message;
        return {
          success: false,
          error: errorMessage
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      };
    }
  }

  async getOrderDetails(orderId: string): Promise<{ success: boolean; data?: Order; error?: string }> {
    try {
      const cacheKey = `order-details:${orderId}`;
      const cached = getCachedData<{ success: boolean; data: Order }>(cacheKey);
      if (cached) return cached;

      const response = await this.api.authenticatedRequest<{ success: boolean; data: Order }>(
        `/api/order/${orderId}`
      );

      // Cache order details with short TTL
      setCachedData(cacheKey, response, CACHE_TTL.SHORT);
      return response;
    } catch (error) {
      logger.error('Failed to get order details:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'فشل في جلب تفاصيل الطلب'
      };
    }
  }

  async checkout(orderId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.api.authenticatedRequest<{ success: boolean; data: any }>(
        `/api/order/${orderId}/checkout`,
        {
          method: 'POST',
        }
      );

      // Invalidate caches affected by checkout
      try {
        const { authService } = await import('./auth');
        const user = authService.getUser();
        if (user) {
          invalidateCache(`user-orders:${user._id}`);
        }
        invalidateCache(`order-details:${orderId}`);
      } catch (e) {
        logger.warn('Failed to invalidate caches after checkout:', e);
      }

      return response;
    } catch (error) {
      logger.error('Failed to checkout:', error);
      
      // Handle authentication errors - redirect handled by authenticatedRequest
       if (error instanceof ApiError && error.status === 401) {
         // Silent return - redirect already handled
         return {
           success: false,
           error: ''
         };
       }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'فشل في إتمام الدفع'
      };
    }
  }

  async createSteamOrder(gameId: string, accountInfo: { fieldName: string; value: string }[]): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const orderData = {
        gameId,
        accountInfo,
        paymentMethod: 'card',
        note: 'Steam game purchase'
        // packageId is intentionally omitted for Steam games
      };

      const response = await this.api.authenticatedRequest<any>('/api/order', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });

      // Invalidate user orders cache after creating an order
      try {
        const { authService } = await import('./auth');
        const user = authService.getUser();
        if (user) {
          const cacheKey = `user-orders:${user._id}`;
          invalidateCache(cacheKey);
        }
      } catch (e) {
        logger.warn('Failed to invalidate user orders cache after createSteamOrder:', e);
      }

      return { success: true, data: response.data || response };
    } catch (error) {
      logger.error('Failed to create Steam order:', error);
      
      // Handle authentication errors - redirect handled by authenticatedRequest
      if (error instanceof ApiError && error.status === 401) {
        // Silent return - redirect already handled
        return {
          success: false,
          error: ''
        };
      }
      
      // Handle validation errors (400 Bad Request)
      if (error instanceof ApiError && error.status === 400) {
        // Check if the error data contains validation error info
        const errorMessage = error.data?.error || error.message;
        return {
          success: false,
          error: errorMessage
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      };
    }
  }

  async createOrderWithWalletTransfer(
    orderData: CreateOrderData,
    walletTransferData: {
      walletTransferNumber: string;
      nameOfInsta?: string;
    },
    walletTransferImage: File
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      logger.info('🚀 [OrderAPI] Creating order with wallet transfer', {
        gameId: orderData.gameId,
        packageId: orderData.packageId,
        paymentMethod: orderData.paymentMethod,
        walletTransferNumber: walletTransferData.walletTransferNumber
      });

      // First create the order
      const orderResult = await this.createOrder(orderData);
      if (!orderResult.success || !orderResult.data?._id) {
        throw new Error(orderResult.error || 'Failed to create order');
      }

      const orderId = orderResult.data._id;
      logger.info('✅ [OrderAPI] Order created successfully', { orderId });

      // Then submit wallet transfer
      const transferResult = await this.submitWalletTransfer(orderId, walletTransferData, walletTransferImage);
      if (!transferResult.success) {
        throw new Error(transferResult.error || 'Failed to submit wallet transfer');
      }

      logger.info('✅ [OrderAPI] Order with wallet transfer created successfully', { orderId });
      return { success: true, data: { orderId, ...transferResult.data } };
    } catch (error) {
      logger.error('❌ [OrderAPI] Error creating order with wallet transfer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء الطلب مع بيانات التحويل'
      };
    }
  }

  async submitWalletTransfer(
    orderId: string, 
    walletTransferData: {
      walletTransferNumber: string;
      nameOfInsta?: string;
    },
    walletTransferImage: File
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🚀 [API] بدء إرسال بيانات تحويل المحفظة');
      console.log('📋 [API] معرف الطلب:', orderId);
      console.log('💳 [API] رقم التحويل:', walletTransferData.walletTransferNumber);
      console.log('📱 [API] اسم إنستا:', walletTransferData.nameOfInsta || 'غير محدد');
      console.log('🖼️ [API] حجم الصورة:', walletTransferImage.size, 'بايت');
      console.log('📄 [API] نوع الصورة:', walletTransferImage.type);
      
      const formData = new FormData();
      formData.append('walletTransferNumber', walletTransferData.walletTransferNumber);
      if (walletTransferData.nameOfInsta) {
        formData.append('nameOfInsta', walletTransferData.nameOfInsta);
      }
      formData.append('walletTransferImage', walletTransferImage);

      console.log('🌐 [API] إرسال الطلب إلى:', `/api/order/${orderId}/wallet-transfer`);
      
      const response = await this.api.authenticatedRequest<any>(
        `/api/order/${orderId}/wallet-transfer`,
        {
          method: 'POST',
          body: formData,
          // Don't set Content-Type header - let browser set it automatically with boundary
          headers: {},
          // Increase timeout for file upload requests (e.g., wallet transfer image)
          timeout: 120000 // 120 seconds
        }
      );
      


      // Invalidate user orders cache after submitting wallet transfer
      try {
        const { authService } = await import('./auth');
        const user = authService.getUser();
        if (user) {
          const cacheKey = `user-orders:${user._id}`;
          invalidateCache(cacheKey);
        }
        invalidateCache(`order-details:${orderId}`);
      } catch (e) {
        logger.warn('Failed to invalidate caches after submitWalletTransfer:', e);
      }

      return { success: true, data: response.data || response };
    } catch (error) {
      logger.error('Failed to submit wallet transfer:', error);
      
      // Handle authentication errors - redirect handled by authenticatedRequest
      if (error instanceof ApiError && error.status === 401) {
        // Silent return - redirect already handled
        return {
          success: false,
          error: ''
        };
      }
      
      // Handle validation errors (400 Bad Request)
      if (error instanceof ApiError && error.status === 400) {
        const errorMessage = error.data?.error || error.message;
        return {
          success: false,
          error: errorMessage
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'فشل في إرسال بيانات التحويل'
      };
    }
  }
}

// Export service instances
export const apiService = new ApiService();
export const orderApiService = new OrderApiService();

// Export error handling utilities
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

export const isAuthError = (error: unknown): boolean => {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
};

export const isNetworkError = (error: unknown): boolean => {
  return error instanceof ApiError && error.status === 0;
};