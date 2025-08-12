const axios = require('axios');
const logger = require('./logger');

class ApiFetcher {
    constructor() {
        this.defaultTimeout = 10000; // 10 seconds
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
    }

    // Create axios instance with default configuration
    createInstance(config = {}) {
        return axios.create({
            timeout: config.timeout || this.defaultTimeout,
            headers: {
                'User-Agent': 'Betting-ExternalAPI/1.0',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...config.headers
            },
            ...config
        });
    }

    // Retry logic
    async retryRequest(requestFn, retries = this.maxRetries, delay = this.retryDelay) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await requestFn();
            } catch (error) {
                const isLastAttempt = attempt === retries;
                const shouldRetry = this.shouldRetry(error);

                if (isLastAttempt || !shouldRetry) {
                    throw error;
                }

                logger.warn(`🔄 API request failed (attempt ${attempt}/${retries}), retrying in ${delay}ms...`);
                await this.sleep(delay);
                delay *= 2; // Exponential backoff
            }
        }
    }

    // Determine if request should be retried
    shouldRetry(error) {
        // Retry on network errors, 5xx server errors, and specific 4xx errors
        if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
            return true;
        }

        if (error.response) {
            const status = error.response.status;
            return status >= 500 || status === 429 || status === 408;
        }

        return false;
    }

    // Sleep utility
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // GET request
    async get(url, config = {}) {
        const instance = this.createInstance(config);
        
        return await this.retryRequest(async () => {
            const startTime = Date.now();
            logger.debug(`🌐 GET ${url}`);
            
            const response = await instance.get(url);
            
            const duration = Date.now() - startTime;
            logger.debug(`✅ GET ${url} completed in ${duration}ms`);
            
            return response;
        }, config.retries || this.maxRetries, config.retryDelay || this.retryDelay);
    }

    // POST request
    async post(url, data = {}, config = {}) {
        const instance = this.createInstance(config);
        
        return await this.retryRequest(async () => {
            const startTime = Date.now();
            logger.debug(`🌐 POST ${url}`);
            
            const response = await instance.post(url, data);
            
            const duration = Date.now() - startTime;
            logger.debug(`✅ POST ${url} completed in ${duration}ms`);
            
            return response;
        }, config.retries || this.maxRetries, config.retryDelay || this.retryDelay);
    }

    // PUT request
    async put(url, data = {}, config = {}) {
        const instance = this.createInstance(config);
        
        return await this.retryRequest(async () => {
            const startTime = Date.now();
            logger.debug(`🌐 PUT ${url}`);
            
            const response = await instance.put(url, data);
            
            const duration = Date.now() - startTime;
            logger.debug(`✅ PUT ${url} completed in ${duration}ms`);
            
            return response;
        }, config.retries || this.maxRetries, config.retryDelay || this.retryDelay);
    }

    // DELETE request
    async delete(url, config = {}) {
        const instance = this.createInstance(config);
        
        return await this.retryRequest(async () => {
            const startTime = Date.now();
            logger.debug(`🌐 DELETE ${url}`);
            
            const response = await instance.delete(url);
            
            const duration = Date.now() - startTime;
            logger.debug(`✅ DELETE ${url} completed in ${duration}ms`);
            
            return response;
        }, config.retries || this.maxRetries, config.retryDelay || this.retryDelay);
    }

    // Generic request method
    async request(config) {
        const instance = this.createInstance(config);
        
        return await this.retryRequest(async () => {
            const startTime = Date.now();
            logger.debug(`🌐 ${config.method?.toUpperCase()} ${config.url}`);
            
            const response = await instance.request(config);
            
            const duration = Date.now() - startTime;
            logger.debug(`✅ ${config.method?.toUpperCase()} ${config.url} completed in ${duration}ms`);
            
            return response;
        }, config.retries || this.maxRetries, config.retryDelay || this.retryDelay);
    }

    // Batch requests
    async batch(requests, concurrency = 5) {
        const results = [];
        const errors = [];

        for (let i = 0; i < requests.length; i += concurrency) {
            const batch = requests.slice(i, i + concurrency);
            const batchPromises = batch.map(async (request, index) => {
                try {
                    const result = await this.request(request);
                    return { index: i + index, success: true, data: result };
                } catch (error) {
                    return { index: i + index, success: false, error };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            
            batchResults.forEach(result => {
                if (result.success) {
                    results.push(result);
                } else {
                    errors.push(result);
                    logger.error(`❌ Batch request ${result.index} failed:`, result.error.message);
                }
            });
        }

        return { results, errors };
    }

    // Health check for external APIs
    async healthCheck(url, timeout = 5000) {
        try {
            const response = await this.get(url, { timeout });
            return {
                url,
                status: 'healthy',
                responseTime: response.headers['x-response-time'] || 'unknown',
                statusCode: response.status
            };
        } catch (error) {
            return {
                url,
                status: 'unhealthy',
                error: error.message,
                statusCode: error.response?.status || 'unknown'
            };
        }
    }

    // Rate limiting helper
    createRateLimitedFetcher(requestsPerSecond = 10) {
        const queue = [];
        let lastRequestTime = 0;
        const minInterval = 1000 / requestsPerSecond;

        const processQueue = async () => {
            if (queue.length === 0) return;

            const now = Date.now();
            const timeSinceLastRequest = now - lastRequestTime;

            if (timeSinceLastRequest < minInterval) {
                await this.sleep(minInterval - timeSinceLastRequest);
            }

            const { resolve, reject, requestFn } = queue.shift();
            lastRequestTime = Date.now();

            try {
                const result = await requestFn();
                resolve(result);
            } catch (error) {
                reject(error);
            }

            // Process next request
            setImmediate(processQueue);
        };

        return {
            async request(requestFn) {
                return new Promise((resolve, reject) => {
                    queue.push({ resolve, reject, requestFn });
                    processQueue();
                });
            }
        };
    }
}

// Create singleton instance
const apiFetcher = new ApiFetcher();

// Export functions
async function get(url, config) {
    return await apiFetcher.get(url, config);
}

async function post(url, data, config) {
    return await apiFetcher.post(url, data, config);
}

async function put(url, data, config) {
    return await apiFetcher.put(url, data, config);
}

async function del(url, config) {
    return await apiFetcher.delete(url, config);
}

async function request(config) {
    return await apiFetcher.request(config);
}

async function batch(requests, concurrency) {
    return await apiFetcher.batch(requests, concurrency);
}

async function healthCheck(url, timeout) {
    return await apiFetcher.healthCheck(url, timeout);
}

function createRateLimitedFetcher(requestsPerSecond) {
    return apiFetcher.createRateLimitedFetcher(requestsPerSecond);
}

function createInstance(config) {
    return apiFetcher.createInstance(config);
}

module.exports = {
    get,
    post,
    put,
    delete: del,
    request,
    batch,
    healthCheck,
    createRateLimitedFetcher,
    createInstance,
    apiFetcher
}; 