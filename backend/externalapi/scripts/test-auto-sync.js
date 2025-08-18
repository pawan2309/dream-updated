const autoMatchSync = require('../services/autoMatchSync');
const logger = require('../utils/logger');

async function testAutoSync() {
  try {
    logger.info('🧪 [TEST] Starting auto-sync test...');
    
    // Start the service
    autoMatchSync.start();
    logger.info('✅ [TEST] Auto-sync service started');
    
    // Wait a moment for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get initial status
    const initialStatus = autoMatchSync.getStatus();
    logger.info('📊 [TEST] Initial status:', JSON.stringify(initialStatus, null, 2));
    
    // Test fetching matches from API
    logger.info('🔄 [TEST] Testing bulk match fetch...');
    const fetchResult = await autoMatchSync.fetchAllMatchesFromAPI();
    logger.info(`✅ [TEST] Bulk fetch completed: ${fetchResult} matches queued`);
    
    // Wait for processing
    logger.info('⏳ [TEST] Waiting for sync queue processing...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Get final status
    const finalStatus = autoMatchSync.getStatus();
    logger.info('📊 [TEST] Final status:', JSON.stringify(finalStatus, null, 2));
    
    // Stop the service
    autoMatchSync.stop();
    logger.info('✅ [TEST] Auto-sync service stopped');
    
    logger.info('🎉 [TEST] Auto-sync test completed successfully!');
    
  } catch (error) {
    logger.error('❌ [TEST] Auto-sync test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testAutoSync();
}

module.exports = testAutoSync;
