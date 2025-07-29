import { ApiError } from './api-error';
import { getCachedData, setCachedData, CACHE_KEYS, CACHE_TTL } from './cache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Game {
  _id: string;
  name: string;
  image: {
    secure_url: string;
    public_id: string;
  };
  description?: string;
  price?: number;
  category?: string;
  isPopular?: boolean;
  offer?: string;
  isActive?: boolean;
  createdAt?: string;
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log('🌐 Making API request to:', url);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        signal: controller.signal,
        ...options,
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
}

export const apiService = new ApiService(); 