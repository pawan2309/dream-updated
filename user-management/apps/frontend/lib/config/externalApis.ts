// External API configurations
import { ExternalApiConfig } from '../externalApi';

// Environment variable helpers
const getEnvVar = (key: string, required = false): string => {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value || '';
};

// External API configurations
export const externalApiConfigs = {
  // Example: Sports data API
  sportsData: {
    baseUrl: getEnvVar('SPORTS_DATA_API_URL', true),
    apiKey: getEnvVar('SPORTS_DATA_API_KEY', true),
    timeout: 15000,
    retries: 3,
  } as ExternalApiConfig,

  // Example: Payment gateway API
  paymentGateway: {
    baseUrl: getEnvVar('PAYMENT_GATEWAY_URL', true),
    apiKey: getEnvVar('PAYMENT_GATEWAY_API_KEY', true),
    timeout: 30000, // Longer timeout for payments
    retries: 2,
  } as ExternalApiConfig,

  // Example: SMS/Notification API
  notificationService: {
    baseUrl: getEnvVar('NOTIFICATION_API_URL', true),
    apiKey: getEnvVar('NOTIFICATION_API_KEY', true),
    timeout: 10000,
    retries: 3,
  } as ExternalApiConfig,

  // Example: KYC/Verification API
  kycService: {
    baseUrl: getEnvVar('KYC_API_URL', true),
    apiKey: getEnvVar('KYC_API_KEY', true),
    timeout: 20000,
    retries: 2,
  } as ExternalApiConfig,

  // New External API Provider (AWS EC2 Elastic API)
  newApiProvider: {
    baseUrl: getEnvVar('NEW_API_PROVIDER_URL', true),
    apiKey: getEnvVar('NEW_API_PROVIDER_API_KEY', true),
    timeout: 25000, // Longer timeout for external routing
    retries: 3,
  } as ExternalApiConfig,
};

// Validation function
export const validateApiConfigs = (): void => {
  const requiredApis = ['sportsData', 'paymentGateway'];
  
  for (const apiName of requiredApis) {
    const config = externalApiConfigs[apiName as keyof typeof externalApiConfigs];
    if (!config?.baseUrl) {
      throw new Error(`Missing configuration for ${apiName} API`);
    }
  }
};

// Rate limiting configuration
export const rateLimitConfig = {
  sportsData: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
  },
  paymentGateway: {
    requestsPerMinute: 30,
    requestsPerHour: 500,
  },
  notificationService: {
    requestsPerMinute: 100,
    requestsPerHour: 2000,
  },
  kycService: {
    requestsPerMinute: 20,
    requestsPerHour: 200,
  },
}; 