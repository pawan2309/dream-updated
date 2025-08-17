const axios = require('axios');
// Simple UUID generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Request Proxy Service
 * Handles HTTP request forwarding with retry logic, transformations, and error handling
 */
class RequestProxyService {
  constructor(cache, logger) {
    this.cache = cache;
    this.logger = logger;
    this.activeRequests = new Map();
    
    // Create axios instance with default configuration
    this.httpClient = axios.create({
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      headers: {
        'User-Agent': 'AWS-IP-Proxy/1.0'
      }
    });

    // Add request interceptor for logging
    this.httpClient.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: Date.now() };
        return config;
      },
      (error) => {
        this.logger.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.httpClient.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.metadata.startTime;
        this.logger.info(`HTTP ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`);
        return response;
      },
      (error) => {
        if (error.config && error.config.metadata) {
          const duration = Date.now() - error.config.metadata.startTime;
          this.logger.error(`HTTP ${error.config.method.toUpperCase()} ${error.config.url} - Error (${duration}ms):`, error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Main proxy request method
   */
  async proxyRequest(provider, endpoint, method, headers, body, queryParams, requestId) {
    const startTime = Date.now();
    const correlationId = requestId || generateUUID();

    try {
      this.logger.info(`🔄 Proxy request started`, {
        correlationId,
        provider: provider.id,
        endpoint,
        method
      });

      // Check cache first for GET requests
      if (method.toLowerCase() === 'get' && provider.cacheTtl > 0) {
        const cachedResponse = await this.getCachedResponse(provider.id, endpoint, queryParams);
        if (cachedResponse) {
          this.logger.info(`💾 Cache hit for ${provider.id}/${endpoint}`, { correlationId });
          return {
            data: cachedResponse.data,
            status: cachedResponse.status,
            headers: cachedResponse.headers,
            cached: true,
            responseTime: Date.now() - startTime,
            correlationId
          };
        }
      }

      // Forward request to external API
      const response = await this.forwardRequest(provider, endpoint, method, headers, body, queryParams, correlationId);

      // Cache successful GET responses
      if (method.toLowerCase() === 'get' && response.status < 400 && provider.cacheTtl > 0) {
        await this.cacheResponse(provider.id, endpoint, queryParams, response, provider.cacheTtl);
      }

      const responseTime = Date.now() - startTime;
      this.logger.info(`✅ Proxy request completed`, {
        correlationId,
        provider: provider.id,
        endpoint,
        status: response.status,
        responseTime
      });

      return {
        data: response.data,
        status: response.status,
        headers: response.headers,
        cached: false,
        responseTime,
        correlationId
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error(`❌ Proxy request failed`, {
        correlationId,
        provider: provider.id,
        endpoint,
        error: error.message,
        responseTime
      });

      // Try to return cached data as fallback for GET requests
      if (method.toLowerCase() === 'get') {
        const fallbackResponse = await this.getFallbackResponse(provider.id, endpoint, queryParams);
        if (fallbackResponse) {
          this.logger.info(`🔄 Returning fallback cached data`, { correlationId });
          return {
            data: fallbackResponse.data,
            status: fallbackResponse.status,
            headers: fallbackResponse.headers,
            cached: true,
            fallback: true,
            responseTime,
            correlationId
          };
        }
      }

      throw this.transformError(error, correlationId);
    }
  }

  /**
   * Forward request to external API with retry logic
   */
  async forwardRequest(provider, endpoint, method, headers, body, queryParams, correlationId) {
    const targetUrl = this.buildTargetUrl(provider, endpoint, queryParams);
    const maxRetries = provider.retries || 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(`🔄 Request attempt ${attempt}/${maxRetries}`, {
          correlationId,
          url: targetUrl,
          method
        });

        const requestOptions = {
          method: method.toLowerCase(),
          url: targetUrl,
          headers: this.mergeHeaders(provider.headers, headers),
          timeout: provider.timeout || 10000,
          data: body,
          params: queryParams
        };

        // Transform request if needed
        const transformedOptions = this.transformRequest(requestOptions, provider);

        const response = await this.httpClient(transformedOptions);

        // Transform response if needed
        const transformedResponse = this.transformResponse(response, provider);

        return transformedResponse;

      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx) or non-retryable errors
        if (this.isNonRetryableError(error)) {
          break;
        }

        if (attempt < maxRetries) {
          const delay = this.calculateRetryDelay(attempt);
          this.logger.warn(`⏳ Retrying request in ${delay}ms (attempt ${attempt}/${maxRetries})`, {
            correlationId,
            error: error.message
          });
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Build target URL from provider config and endpoint
   */
  buildTargetUrl(provider, endpoint, queryParams) {
    let baseUrl = provider.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    
    // Handle endpoint mapping
    if (provider.endpoints && provider.endpoints[endpoint]) {
      endpoint = provider.endpoints[endpoint];
    }
    
    // Ensure endpoint starts with /
    if (!endpoint.startsWith('/')) {
      endpoint = '/' + endpoint;
    }

    return baseUrl + endpoint;
  }

  /**
   * Merge provider headers with request headers
   */
  mergeHeaders(providerHeaders, requestHeaders) {
    const merged = { ...providerHeaders };
    
    // Add request headers, but don't override critical provider headers
    const protectedHeaders = ['authorization', 'user-agent'];
    
    for (const [key, value] of Object.entries(requestHeaders || {})) {
      const lowerKey = key.toLowerCase();
      if (!protectedHeaders.includes(lowerKey) || !merged[key]) {
        merged[key] = value;
      }
    }

    return merged;
  }

  /**
   * Transform request before sending
   */
  transformRequest(requestOptions, provider) {
    // Apply provider-specific transformations
    if (provider.transformations && provider.transformations.request) {
      if (typeof provider.transformations.request === 'function') {
        return provider.transformations.request(requestOptions);
      }
    }

    // Default transformations
    return requestOptions;
  }

  /**
   * Transform response after receiving
   */
  transformResponse(response, provider) {
    // Apply provider-specific transformations
    if (provider.transformations && provider.transformations.response) {
      if (typeof provider.transformations.response === 'function') {
        return provider.transformations.response(response);
      }
    }

    // Default transformations
    return response;
  }

  /**
   * Check if error should not be retried
   */
  isNonRetryableError(error) {
    if (error.response) {
      const status = error.response.status;
      // Don't retry client errors (4xx) except for 429 (rate limit)
      return status >= 400 && status < 500 && status !== 429;
    }
    
    // Don't retry certain error codes
    const nonRetryableCodes = ['ENOTFOUND', 'ECONNREFUSED', 'CERT_HAS_EXPIRED'];
    return nonRetryableCodes.includes(error.code);
  }

  /**
   * Calculate exponential backoff delay
   */
  calculateRetryDelay(attempt) {
    const baseDelay = 1000; // 1 second
    const maxDelay = 10000; // 10 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get cached response
   */
  async getCachedResponse(providerId, endpoint, queryParams) {
    if (!this.cache) return null;

    try {
      const cacheKey = this.generateCacheKey(providerId, endpoint, queryParams);
      return await this.cache.get(cacheKey);
    } catch (error) {
      this.logger.warn('Cache get error:', error);
      return null;
    }
  }

  /**
   * Cache response
   */
  async cacheResponse(providerId, endpoint, queryParams, response, ttl) {
    if (!this.cache) return;

    try {
      const cacheKey = this.generateCacheKey(providerId, endpoint, queryParams);
      const cacheData = {
        data: response.data,
        status: response.status,
        headers: response.headers,
        timestamp: Date.now()
      };
      
      await this.cache.set(cacheKey, cacheData, ttl);
    } catch (error) {
      this.logger.warn('Cache set error:', error);
    }
  }

  /**
   * Get fallback cached response (ignoring TTL)
   */
  async getFallbackResponse(providerId, endpoint, queryParams) {
    if (!this.cache) return null;

    try {
      const cacheKey = this.generateCacheKey(providerId, endpoint, queryParams);
      // Try to get any cached data, even if expired
      return await this.cache.get(cacheKey + ':fallback');
    } catch (error) {
      this.logger.warn('Fallback cache get error:', error);
      return null;
    }
  }

  /**
   * Generate cache key
   */
  generateCacheKey(providerId, endpoint, queryParams) {
    const params = queryParams ? JSON.stringify(queryParams) : '';
    const hash = require('crypto')
      .createHash('md5')
      .update(`${providerId}:${endpoint}:${params}`)
      .digest('hex');
    
    return `proxy:${providerId}:${hash}`;
  }

  /**
   * Transform error for consistent error handling
   */
  transformError(error, correlationId) {
    const transformedError = new Error();
    transformedError.correlationId = correlationId;

    if (error.response) {
      // HTTP error response
      transformedError.name = 'ProxyHttpError';
      transformedError.message = `HTTP ${error.response.status}: ${error.response.statusText}`;
      transformedError.status = error.response.status;
      transformedError.data = error.response.data;
      transformedError.headers = error.response.headers;
    } else if (error.request) {
      // Network error
      transformedError.name = 'ProxyNetworkError';
      transformedError.message = 'Network error: ' + (error.message || 'Request failed');
      transformedError.status = 503;
    } else {
      // Other error
      transformedError.name = 'ProxyError';
      transformedError.message = error.message || 'Unknown proxy error';
      transformedError.status = 500;
    }

    transformedError.originalError = error;
    return transformedError;
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      activeRequests: this.activeRequests.size,
      httpClientDefaults: {
        timeout: this.httpClient.defaults.timeout,
        maxRedirects: this.httpClient.defaults.maxRedirects
      }
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.activeRequests.clear();
  }
}

module.exports = RequestProxyService;