import { createExternalApiService, ApiResponse } from '../externalApi';
import { externalApiConfigs } from '../config/externalApis';

// Types for the new API provider
interface NewApiProviderRequest {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
  useCache?: boolean;
  cacheTTL?: number;
}

interface NewApiProviderResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
  timestamp: string;
}

class NewApiProviderService {
  private api = createExternalApiService(externalApiConfigs.newApiProvider);

  /**
   * Generic method to make requests to the new API provider
   */
  async makeRequest<T>(request: NewApiProviderRequest): Promise<NewApiProviderResponse<T>> {
    try {
      const { endpoint, method = 'GET', data, headers = {}, useCache = false, cacheTTL } = request;

      let response: ApiResponse<T>;

      switch (method) {
        case 'GET':
          response = await this.api.get<T>(endpoint, useCache);
          break;
        case 'POST':
          response = await this.api.post<T>(endpoint, data);
          break;
        case 'PUT':
          response = await this.api.put<T>(endpoint, data);
          break;
        case 'DELETE':
          response = await this.api.delete<T>(endpoint);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'API request failed',
          status: response.status,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data: response.data,
        status: response.status,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get data from the new API provider
   */
  async get<T>(endpoint: string, useCache = false): Promise<NewApiProviderResponse<T>> {
    return this.makeRequest<T>({ endpoint, method: 'GET', useCache });
  }

  /**
   * Post data to the new API provider
   */
  async post<T>(endpoint: string, data: any): Promise<NewApiProviderResponse<T>> {
    return this.makeRequest<T>({ endpoint, method: 'POST', data });
  }

  /**
   * Put data to the new API provider
   */
  async put<T>(endpoint: string, data: any): Promise<NewApiProviderResponse<T>> {
    return this.makeRequest<T>({ endpoint, method: 'PUT', data });
  }

  /**
   * Delete data from the new API provider
   */
  async delete<T>(endpoint: string): Promise<NewApiProviderResponse<T>> {
    return this.makeRequest<T>({ endpoint, method: 'DELETE' });
  }

  /**
   * Clear the API cache
   */
  clearCache(): void {
    this.api.clearCache();
  }

  /**
   * Clean up expired cache entries
   */
  cleanupCache(): void {
    this.api.cleanupCache();
  }
}

// Export singleton instance
export const newApiProviderService = new NewApiProviderService();

// Export types
export type { NewApiProviderRequest, NewApiProviderResponse }; 