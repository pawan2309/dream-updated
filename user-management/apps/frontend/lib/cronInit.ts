import CronScheduler from './services/cronScheduler';

// Initialize cron scheduler when this module is imported
let isInitialized = false;

export function initializeCronScheduler(): void {
  if (isInitialized) {
    console.log('🔄 Cron scheduler already initialized');
    return;
  }

  try {
    console.log('🚀 Initializing cron scheduler...');
    
    // Start the cron scheduler
    const scheduler = CronScheduler.getInstance();
    scheduler.start();
    
    isInitialized = true;
    console.log('✅ Cron scheduler initialized successfully');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('🛑 Received SIGINT, stopping cron scheduler...');
      scheduler.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('🛑 Received SIGTERM, stopping cron scheduler...');
      scheduler.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to initialize cron scheduler:', error);
  }
}

// Auto-initialize when this module is imported (for server-side)
if (typeof window === 'undefined') {
  // Server-side only
  initializeCronScheduler();
}

export default CronScheduler;
