// Rate limiter for external APIs
interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
}

interface RequestLog {
  timestamp: number;
  count: number;
}

class RateLimiter {
  private requests: Map<string, RequestLog[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  private cleanup(): void {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneMinuteAgo = now - 60 * 1000;

    for (const [key, logs] of this.requests.entries()) {
      // Remove old entries
      const filteredLogs = logs.filter(log => log.timestamp > oneHourAgo);
      
      if (filteredLogs.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, filteredLogs);
      }
    }
  }

  canMakeRequest(apiName: string): boolean {
    this.cleanup();
    
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    const logs = this.requests.get(apiName) || [];
    
    // Count requests in last minute
    const minuteCount = logs.filter(log => log.timestamp > oneMinuteAgo)
      .reduce((sum, log) => sum + log.count, 0);
    
    // Count requests in last hour
    const hourCount = logs.filter(log => log.timestamp > oneHourAgo)
      .reduce((sum, log) => sum + log.count, 0);

    return minuteCount < this.config.requestsPerMinute && 
           hourCount < this.config.requestsPerHour;
  }

  logRequest(apiName: string): void {
    const now = Date.now();
    const logs = this.requests.get(apiName) || [];
    
    logs.push({ timestamp: now, count: 1 });
    this.requests.set(apiName, logs);
  }

  getRemainingRequests(apiName: string): { minute: number; hour: number } {
    this.cleanup();
    
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    const logs = this.requests.get(apiName) || [];
    
    const minuteCount = logs.filter(log => log.timestamp > oneMinuteAgo)
      .reduce((sum, log) => sum + log.count, 0);
    
    const hourCount = logs.filter(log => log.timestamp > oneHourAgo)
      .reduce((sum, log) => sum + log.count, 0);

    return {
      minute: Math.max(0, this.config.requestsPerMinute - minuteCount),
      hour: Math.max(0, this.config.requestsPerHour - hourCount),
    };
  }

  waitForAvailability(apiName: string): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (this.canMakeRequest(apiName)) {
          resolve();
        } else {
          setTimeout(check, 1000); // Check every second
        }
      };
      check();
    });
  }
}

// Create rate limiters for different APIs
export const rateLimiters = {
  sportsData: new RateLimiter({ requestsPerMinute: 60, requestsPerHour: 1000 }),
  paymentGateway: new RateLimiter({ requestsPerMinute: 30, requestsPerHour: 500 }),
  notificationService: new RateLimiter({ requestsPerMinute: 100, requestsPerHour: 2000 }),
  kycService: new RateLimiter({ requestsPerMinute: 20, requestsPerHour: 200 }),
};

export type { RateLimiter, RateLimitConfig }; 