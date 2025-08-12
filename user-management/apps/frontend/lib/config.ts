// Configuration file for managing hardcoded values
export const config = {
  // Commission defaults
  commission: {
    matchCommission: 2.0,
    sessionCommission: 3.0,
    casinoCommission: 2.0,
  },
  
  // Auto-refresh intervals (in milliseconds)
  refresh: {
    userList: 30000, // 30 seconds
    dashboard: 60000, // 1 minute
  },
  
  // UI constants
  ui: {
    zIndex: {
      dropdown: 3000,
      modal: 2000,
      toast: 1000,
    },
    opacity: {
      modalBackground: 0.3,
      disabled: 0.6,
      hover: 0.8,
    },
  },
  
  // Password generation
  password: {
    minLength: 1000000,
    maxLength: 9999999,
  },
  
  // Default limits for new users
  limits: {
    
    defaultCreditLimit: 0,
  },
  
  // Pagination defaults
  pagination: {
    defaultEntriesPerPage: 10,
    pageSizeOptions: [10, 25, 50, 100],
  },
  
  // Validation rules
  validation: {
    contactNumber: {
      minLength: 10,
      maxLength: 15,
    },
  },
};

// Helper function to get configuration value with fallback
export function getConfigValue<T>(path: string, defaultValue: T): T {
  const keys = path.split('.');
  let value: any = config;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }
  
  return value as T;
}

// Environment-specific overrides
export function getEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return {
      ...config,
      refresh: {
        ...config.refresh,
        userList: 60000, // Slower refresh in production
      },
    };
  }
  
  return config;
} 