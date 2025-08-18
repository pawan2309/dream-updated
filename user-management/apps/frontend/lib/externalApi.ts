// External API service layer
interface ExternalApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  success: boolean;
  error?: string;
}

class ExternalApiService {
  private config: ExternalApiConfig;
  private cache = new Map<string, { data: any; timestamp: number }>();

  constructor(config: ExternalApiConfig) {
    this.config = {
      timeout: 10000,
      retries: 3,
      ...config,
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers ? (options.headers as Record<string, string>) : {}),
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
        success: true,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      return {
        data: null as T,
        status: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useCache = false,
    cacheTTL = 300000 // 5 minutes
  ): Promise<ApiResponse<T>> {
    const cacheKey = `${endpoint}-${JSON.stringify(options)}`;

    // Check cache first
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTTL) {
        return {
          data: cached.data,
          status: 200,
          success: true,
        };
      }
    }

    // Retry logic
    let lastError: string | undefined;
    for (let attempt = 1; attempt <= this.config.retries!; attempt++) {
      const result = await this.makeRequest<T>(endpoint, options);
      
      if (result.success) {
        // Cache successful response
        if (useCache) {
          this.cache.set(cacheKey, {
            data: result.data,
            timestamp: Date.now(),
          });
        }
        return result;
      }

      lastError = result.error;
      
      // Don't retry on client errors (4xx)
      if (result.status >= 400 && result.status < 500) {
        break;
      }

      // Wait before retry (exponential backoff)
      if (attempt < this.config.retries!) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return {
      data: null as T,
      status: 0,
      success: false,
      error: lastError || 'Max retries exceeded',
    };
  }

  // Convenience methods
  async get<T>(endpoint: string, useCache = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' }, useCache);
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Clear expired cache entries
  cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > 300000) { // 5 minutes
        this.cache.delete(key);
      }
    }
  }
}

// Export factory function
export const createExternalApiService = (config: ExternalApiConfig) => {
  return new ExternalApiService(config);
};

// Export types
export type { ExternalApiConfig, ApiResponse }; 