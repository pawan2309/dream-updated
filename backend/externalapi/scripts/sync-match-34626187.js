const autoMatchSync = require('../services/autoMatchSync');
const database = require('../utils/database');

async function syncMatch34626187() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Connect to database first
    await database.connect();
    console.log('✅ Database connected successfully');
    
    console.log('🔄 Manually syncing match 34626187...');
    
    const matchData = {
      eventId: '34626187',
      eventName: 'Antigua And Barbuda Falcons vs St. Lucia Kings',
      status: 'live',
      iplay: true,
      inPlay: true,
      tournament: 'Cricket Match',
      startTime: new Date(),
      teams: ['Antigua And Barbuda Falcons', 'St. Lucia Kings'],
      raw: {
        eventId: '34626187',
        eventName: 'Antigua And Barbuda Falcons vs St. Lucia Kings',
        status: 'live',
        iplay: true
      }
    };
    
    const result = await autoMatchSync.forceSyncMatch('34626187', matchData);
    
    console.log('✅ Match 34626187 synced successfully:', {
      id: result.id,
      externalId: result.externalId,
      title: result.title,
      status: result.status
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Failed to sync match 34626187:', error);
    throw error;
  } finally {
    // Disconnect from database
    try {
      await database.disconnect();
      console.log('✅ Database disconnected');
    } catch (disconnectError) {
      console.warn('⚠️ Error disconnecting from database:', disconnectError.message);
    }
  }
}

// Run the script if called directly
if (require.main === module) {
  syncMatch34626187()
    .then(() => {
      console.log('🎯 Manual sync completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Manual sync failed:', error);
      process.exit(1);
    });
}

module.exports = { syncMatch34626187 };
