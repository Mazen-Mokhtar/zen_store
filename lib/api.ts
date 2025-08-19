import { notificationService } from './notifications';
import { getCachedData, setCachedData, CACHE_TTL, invalidateCache } from './cache';
import type { Order, CreateOrderData } from './types';
import { logger } from './utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: string;
}

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

  // Base request method with timeout and error handling
  private async request<T>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<T> {
    const { timeout = this.timeout, retry = 0, skipAuth = false, ...fetchOptions } = options;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
      
      const headers = new Headers({
        'Content-Type': 'application/json',
      });

      if (fetchOptions.headers) {
        const incoming = new Headers(fetchOptions.headers as HeadersInit);
        incoming.forEach((value, key) => headers.set(key, value));
      }

      // Add authentication headers only if not skipped
      if (!skipAuth) {
        // Dynamic import to avoid circular dependencies and ensure fresh token
        const { authService } = await import('./auth');
        const token = authService.getToken();
        const user = authService.getUser();
        
        if (token && user) {
          // Backend expects Authorization in format: "{role} {actualToken}"
          // The token from authService includes role prefix already
          headers.set('Authorization', token);
          headers.set('token', token);
        }
      }

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle response
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
        
        // Check for network connectivity
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          throw new ApiError(0, 'No internet connection');
        }
        
        // Retry logic for network errors
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
        errorData = { message: await response.text() };
      } catch {
        errorData = { message: 'Unknown server error' };
      }
    }

    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      // On 401, try to extend session once before handling as auth error
      if (response.status === 401 && retry === 0) {
        try {
          const { authService } = await import('./auth');
          const refreshed = await authService.extendSession();
          if (refreshed) {
            // Retry original request with incremented retry to avoid loops
            return this.request(endpoint, { ...options, retry: retry + 1 });
          }
        } catch (e) {
          // ignore and fall through to default auth error handling
        }
      }
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
      // Session expired - clear auth and redirect
      notificationService.warning(
        'انتهت الجلسة',
        'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'
      );
      
      authService.logout();
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
      return await response.json();
    }
    
    // For non-JSON responses, return text as data
    const text = await response.text();
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
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
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
      return await this.getPublic<{ success: boolean; data: Game }>(`/game/${gameId}`);
    } catch (error) {
      logger.error('Failed to get game by id:', error);
      return { success: false, data: null as any };
    }
  }

  async getPackagesByGameId(gameId: string): Promise<{ success: boolean; data: Package[] }> {
    try {
      return await this.getPublic<{ success: boolean; data: Package[] }>(`/packages?gameId=${gameId}`);
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

  // Generic API methods
  async getGames(): Promise<any> {
    return this.getPublic('/game');
  }

  async getGamePackages(gameId: string): Promise<any> {
    return this.getPublic(`/game/${gameId}/packages`);
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
        '/order'
      );

      // Short TTL for authenticated data
      setCachedData(cacheKey, response, CACHE_TTL.SHORT);
      return response;
    } catch (error) {
      logger.error('Failed to get user orders:', error);
      return { success: false, data: [] };
    }
  }

  async createOrder(orderData: CreateOrderData): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.api.authenticatedRequest<any>('/order', {
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
        `/order/${orderId}`
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
        `/order/${orderId}/checkout`,
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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'فشل في إتمام الدفع'
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