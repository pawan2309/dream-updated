const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

/**
 * Provider Configuration Manager
 * Handles loading, validation, and hot-reloading of provider configurations
 */
class ProviderConfigManager extends EventEmitter {
  constructor(configPath) {
    super();
    this.configPath = configPath;
    this.config = null;
    this.lastLoaded = 0;
    this.watcherActive = false;
    this.fileWatcher = null;
  }

  /**
   * Load configuration from file
   */
  loadConfig() {
    try {
      if (!fs.existsSync(this.configPath)) {
        this.createDefaultConfig();
      }

      const configData = fs.readFileSync(this.configPath, 'utf8');
      const newConfig = JSON.parse(configData);
      
      // Validate configuration structure
      this.validateConfigStructure(newConfig);
      
      // Validate each provider
      for (const [providerId, provider] of Object.entries(newConfig.providers || {})) {
        this.validateProviderConfig(providerId, provider);
      }

      this.config = newConfig;
      this.lastLoaded = Date.now();
      
      this.emit('configLoaded', this.config);
      return this.config;
    } catch (error) {
      this.emit('configError', error);
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  /**
   * Get provider configuration by ID
   */
  getProviderConfig(providerId) {
    if (!this.config) {
      this.loadConfig();
    }

    const provider = this.config.providers[providerId];
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found`);
    }

    return {
      ...provider,
      id: providerId
    };
  }

  /**
   * Get all provider configurations
   */
  getAllProviders() {
    if (!this.config) {
      this.loadConfig();
    }

    const providers = {};
    for (const [id, config] of Object.entries(this.config.providers)) {
      providers[id] = {
        ...config,
        id
      };
    }

    return providers;
  }

  /**
   * Validate if provider exists
   */
  validateProvider(providerId) {
    if (!this.config) {
      this.loadConfig();
    }

    return this.config.providers.hasOwnProperty(providerId);
  }

  /**
   * Get global configuration
   */
  getGlobalConfig() {
    if (!this.config) {
      this.loadConfig();
    }

    return this.config.global || {};
  }

  /**
   * Reload configuration from file
   */
  reloadConfig() {
    try {
      const oldConfig = this.config;
      this.loadConfig();
      
      this.emit('configReloaded', {
        old: oldConfig,
        new: this.config
      });
      
      return this.config;
    } catch (error) {
      this.emit('configError', error);
      throw error;
    }
  }

  /**
   * Start watching configuration file for changes
   */
  startWatching() {
    if (this.watcherActive) {
      return;
    }

    try {
      this.fileWatcher = fs.watchFile(this.configPath, { interval: 1000 }, (curr, prev) => {
        if (curr.mtime > prev.mtime) {
          try {
            this.reloadConfig();
            this.emit('configChanged', this.config);
          } catch (error) {
            this.emit('configError', error);
          }
        }
      });

      this.watcherActive = true;
      this.emit('watcherStarted');
    } catch (error) {
      this.emit('configError', error);
      throw new Error(`Failed to start file watcher: ${error.message}`);
    }
  }

  /**
   * Stop watching configuration file
   */
  stopWatching() {
    if (this.fileWatcher) {
      fs.unwatchFile(this.configPath);
      this.fileWatcher = null;
      this.watcherActive = false;
      this.emit('watcherStopped');
    }
  }

  /**
   * Validate configuration structure
   */
  validateConfigStructure(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('Configuration must be an object');
    }

    if (!config.providers || typeof config.providers !== 'object') {
      throw new Error('Configuration must have a providers object');
    }

    if (Object.keys(config.providers).length === 0) {
      throw new Error('At least one provider must be configured');
    }

    return true;
  }

  /**
   * Validate individual provider configuration
   */
  validateProviderConfig(providerId, provider) {
    if (!provider || typeof provider !== 'object') {
      throw new Error(`Provider '${providerId}' configuration must be an object`);
    }

    // Required fields
    const required = ['name', 'baseUrl'];
    for (const field of required) {
      if (!provider[field]) {
        throw new Error(`Provider '${providerId}' missing required field: ${field}`);
      }
    }

    // Validate URL format
    try {
      new URL(provider.baseUrl);
    } catch (error) {
      throw new Error(`Provider '${providerId}' has invalid baseUrl: ${provider.baseUrl}`);
    }

    // Validate numeric fields
    const numericFields = ['timeout', 'retries', 'cacheTtl'];
    for (const field of numericFields) {
      if (provider[field] !== undefined && (!Number.isInteger(provider[field]) || provider[field] < 0)) {
        throw new Error(`Provider '${providerId}' field '${field}' must be a non-negative integer`);
      }
    }

    // Validate rate limit configuration
    if (provider.rateLimit) {
      if (!Number.isInteger(provider.rateLimit.windowMs) || provider.rateLimit.windowMs <= 0) {
        throw new Error(`Provider '${providerId}' rateLimit.windowMs must be a positive integer`);
      }
      if (!Number.isInteger(provider.rateLimit.max) || provider.rateLimit.max <= 0) {
        throw new Error(`Provider '${providerId}' rateLimit.max must be a positive integer`);
      }
    }

    // Validate headers
    if (provider.headers && typeof provider.headers !== 'object') {
      throw new Error(`Provider '${providerId}' headers must be an object`);
    }

    return true;
  }

  /**
   * Create default configuration file
   */
  createDefaultConfig() {
    const defaultConfig = {
      providers: {
        'cricket-api': {
          name: 'Cricket API',
          baseUrl: 'https://marketsarket.qnsports.live',
          timeout: 10000,
          retries: 3,
          cacheTtl: 300,
          rateLimit: {
            windowMs: 60000,
            max: 100
          },
          headers: {
            'User-Agent': 'Betting-Proxy/1.0',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          endpoints: {
            'cricketmatches': '/cricketmatches',
            'odds': '/odds',
            'casinoresult': '/casinoresult'
          }
        },
        'casino-api': {
          name: 'Casino Results API',
          baseUrl: 'https://marketsarket.qnsports.live',
          timeout: 15000,
          retries: 2,
          cacheTtl: 60,
          rateLimit: {
            windowMs: 60000,
            max: 50
          },
          headers: {
            'User-Agent': 'Betting-Proxy/1.0',
            'Accept': 'application/json'
          },
          endpoints: {
            'results': '/casinoresult'
          }
        }
      },
      global: {
        maxCacheSize: 1000,
        defaultTimeout: 10000,
        defaultRetries: 3,
        logLevel: 'info',
        enableMetrics: true,
        enableHealthChecks: true
      }
    };

    // Ensure directory exists
    const configDir = path.dirname(this.configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }

  /**
   * Get configuration statistics
   */
  getStats() {
    if (!this.config) {
      this.loadConfig();
    }

    return {
      providersCount: Object.keys(this.config.providers).length,
      lastLoaded: new Date(this.lastLoaded).toISOString(),
      watcherActive: this.watcherActive,
      configPath: this.configPath,
      providers: Object.keys(this.config.providers)
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stopWatching();
    this.removeAllListeners();
    this.config = null;
  }
}

module.exports = ProviderConfigManager;