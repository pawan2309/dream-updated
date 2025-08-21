const database = require('../utils/database');
const logger = require('../utils/logger');

class AutoMatchSync {
  constructor() {
    this.syncQueue = new Map(); // Track matches being synced
    this.syncInterval = null;
    this.bulkFetchInterval = null;
    this.isRunning = false;
    this.syncCycleCount = 0; // Track number of sync cycles
    this.lastCleanup = null; // Track when last cleanup was performed
    this.lastBulkFetch = null; // Track when last bulk fetch was performed
  }

  /**
   * Start automatic match synchronization
   */
  start() {
    if (this.isRunning) {
      logger.info('[AUTO-SYNC] Already running');
      return;
    }

    logger.info('[AUTO-SYNC] Starting automatic match synchronization...');
    this.isRunning = true;

    // Process sync queue every 5 seconds
    this.syncInterval = setInterval(() => {
      this.processSyncQueue();
    }, 5000);

    // Process individual matches as they come through odds route
    // No bulk fetch needed - matches are queued individually when odds are fetched
    logger.info('[AUTO-SYNC] Service started - processing individual matches from odds route');
  }

  /**
   * Stop automatic match synchronization
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    logger.info('[AUTO-SYNC] Stopping automatic match synchronization...');
    this.isRunning = false;

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    logger.info('[AUTO-SYNC] Service stopped');
  }

  /**
   * Queue a match for synchronization
   * @param {Object} matchData - Match data from API
   */
  async queueMatchForSync(matchData) {
    try {
      // Prioritize eventId from API data (this is the actual external ID like 34626187)
      const eventId = matchData.eventId || matchData.beventId || matchData.id;
      
      if (!eventId) {
        logger.warn('[AUTO-SYNC] Match data missing eventId:', matchData);
        return;
      }

      // Check if already in queue
      if (this.syncQueue.has(eventId)) {
        return;
      }

      // Add to sync queue
      this.syncQueue.set(eventId, {
        data: matchData,
        timestamp: Date.now(),
        retryCount: 0
      });

      logger.info(`[AUTO-SYNC] Queued match ${eventId} for sync`);
    } catch (error) {
      logger.error('[AUTO-SYNC] Error queuing match:', error);
    }
  }

  /**
   * Process the sync queue
   */
  async processSyncQueue() {
    if (this.syncQueue.size === 0) {
      return;
    }

    logger.info(`[AUTO-SYNC] Processing ${this.syncQueue.size} matches in queue`);

    for (const [eventId, queueItem] of this.syncQueue) {
      try {
        await this.syncMatchToDatabase(eventId, queueItem.data);
        
        // Remove from queue on success
        this.syncQueue.delete(eventId);
        logger.info(`[AUTO-SYNC] Successfully synced match ${eventId}`);
        
      } catch (error) {
        logger.error(`[AUTO-SYNC] Failed to sync match ${eventId}:`, error.message);
        
        // Increment retry count
        queueItem.retryCount++;
        
        // Remove from queue after 3 retries
        if (queueItem.retryCount >= 3) {
          this.syncQueue.delete(eventId);
          logger.error(`[AUTO-SYNC] Removed match ${eventId} from queue after ${queueItem.retryCount} failed attempts`);
        }
      }
    }

    // Increment sync cycle counter
    this.syncCycleCount++;

    // Perform automatic ID cleanup after processing queue (runs every 5 sync cycles)
    if (this.syncCycleCount % 5 === 0) {
      await this.performAutomaticIdCleanup();
    }
  }

  /**
   * Sync a single match to the database
   * @param {string} eventId - Event ID from API
   * @param {Object} matchData - Match data from API
   */
  async syncMatchToDatabase(eventId, matchData) {
    try {
      // Check if match already exists
      const existingMatch = await database.findOne('Match', {
        OR: [
          { externalId: eventId.toString() },
          { beventId: eventId.toString() }
        ]
      });

      if (existingMatch) {
        // Check if existing match has incorrect "prov-" prefixed IDs and fix them automatically
        if (this.hasIncorrectIds(existingMatch)) {
          logger.info(`[AUTO-SYNC] Detected incorrect IDs for match ${eventId}, auto-fixing...`);
          await this.fixIncorrectMatchIds(existingMatch, eventId);
        }

        // Update existing match with enhanced data
        await database.update('Match', { id: existingMatch.id }, {
          lastUpdated: new Date(),
          status: this.mapStatus(matchData.status || matchData.iplay, matchData),
          isLive: Boolean(matchData.inPlay || matchData.iplay),
          title: matchData.eventName || matchData.name || existingMatch.title,
          matchName: matchData.eventName || matchData.name || existingMatch.matchName,
          // Enhanced field updates
          tournament: matchData.tournament || matchData.cname || existingMatch.tournament,
          startTime: matchData.startTime || matchData.stime ? new Date(matchData.startTime || matchData.stime) : existingMatch.startTime,
          teams: matchData.teams || matchData.brunners || existingMatch.teams,
          apiSource: matchData.apiSource || 'shamexch.xyz'
        });
        
        logger.info(`[AUTO-SYNC] Updated existing match ${eventId} with enhanced data`);
        return existingMatch;
      }

      // Create new match with all required fields
      const matchDataToInsert = {
        id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: matchData.eventName || matchData.name || `Match ${eventId}`,
        externalId: eventId.toString(),
        beventId: eventId.toString(),
        status: this.mapStatus(matchData.status || matchData.iplay, matchData),
        isActive: true,
        isCricket: true,
        isDeleted: false,
        isLive: Boolean(matchData.inPlay || matchData.iplay),
        createdAt: new Date(),
        lastUpdated: new Date(),
        
        // Enhanced fields as requested
        matchName: matchData.eventName || matchData.name || `Match ${eventId}`,
        tournament: matchData.tournament || matchData.cname || 'Cricket Match',
        startTime: matchData.startTime || matchData.stime ? new Date(matchData.startTime || matchData.stime) : null,
        matchType: matchData.matchType || matchData.gtype || 'match',
        teams: matchData.teams || matchData.brunners || null,
        apiSource: matchData.apiSource || 'shamexch.xyz',
        
        // Additional fields that might be useful
        bmarketId: matchData.bmarketId || matchData.marketId || null
      };

      const newMatch = await database.insert('Match', matchDataToInsert);
      
      logger.info(`[AUTO-SYNC] Created new match ${eventId}: ${newMatch.title} with enhanced data`);
      return newMatch;

    } catch (error) {
      logger.error(`[AUTO-SYNC] Database sync error for match ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a match has incorrect "prov-" prefixed IDs
   * @param {Object} match - Match object from database
   * @returns {boolean} True if IDs are incorrect
   */
  hasIncorrectIds(match) {
    return (
      (match.externalId && match.externalId.toString().startsWith('prov-')) ||
      (match.beventId && match.beventId.toString().startsWith('prov-'))
    );
  }

  /**
   * Automatically fix incorrect match IDs
   * @param {Object} match - Match object from database
   * @param {string} correctEventId - The correct external ID
   */
  async fixIncorrectMatchIds(match, correctEventId) {
    try {
      // Use the provided correct event ID
      let originalId = correctEventId;

      // IMPORTANT: Check if there are any bets referencing this match
      const relatedBets = await database.findMany('Bet', {
        matchId: match.id
      });

      if (relatedBets.length > 0) {
        logger.warn(`[AUTO-SYNC] Match ${match.id} has ${relatedBets.length} related bets - cannot safely change internal ID`);
        logger.warn(`[AUTO-SYNC] Consider creating a new match with correct external ID and migrating bets`);
        return false; // Cannot safely fix this match
      }

      // Safe to update - no foreign key constraints
      await database.update('Match', { id: match.id }, {
        externalId: originalId.toString(),
        beventId: originalId.toString(),
        lastUpdated: new Date()
      });

      logger.info(`[AUTO-SYNC] Auto-fixed incorrect IDs for match ${match.id}: ${match.externalId} → ${originalId}`);
      return true;
    } catch (error) {
      logger.error(`[AUTO-SYNC] Error auto-fixing match IDs for ${match.id}:`, error);
      return false;
    }
  }

  /**
   * Safely handle matches with bets by creating new match and migrating bets
   * @param {Object} oldMatch - Old match with incorrect IDs
   * @param {string} correctEventId - The correct external ID
   * @returns {boolean} Success status
   */
  async safelyMigrateMatchWithBets(oldMatch, correctEventId) {
    try {
      logger.info(`[AUTO-SYNC] Safely migrating match ${oldMatch.id} with bets to new match with correct ID ${correctEventId}`);
      
      // Check if a match with the correct external ID already exists
      const existingCorrectMatch = await database.findOne('Match', {
        OR: [
          { externalId: correctEventId.toString() },
          { beventId: correctEventId.toString() }
        ]
      });

      if (existingCorrectMatch) {
        logger.info(`[AUTO-SYNC] Match with correct ID ${correctEventId} already exists, migrating bets there`);
        return await this.migrateBetsToExistingMatch(oldMatch.id, existingCorrectMatch.id);
      }

      // Create new match with correct external ID
      const newMatchData = {
        id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: oldMatch.title || `Match ${correctEventId}`,
        externalId: correctEventId.toString(),
        beventId: correctEventId.toString(),
        status: oldMatch.status || 'UPCOMING',
        isActive: oldMatch.isActive || true,
        isCricket: oldMatch.isCricket || true,
        isDeleted: false,
        isLive: oldMatch.isLive || false,
        createdAt: new Date(),
        lastUpdated: new Date(),
        matchName: oldMatch.matchName || oldMatch.title || `Match ${correctEventId}`,
        tournament: oldMatch.tournament || 'Cricket Match',
        startTime: oldMatch.startTime,
        matchType: oldMatch.matchType || 'match',
        teams: oldMatch.teams,
        apiSource: oldMatch.apiSource || 'shamexch.xyz',
        bmarketId: oldMatch.bmarketId
      };

      const newMatch = await database.insert('Match', newMatchData);
      logger.info(`[AUTO-SYNC] Created new match ${newMatch.id} with correct external ID ${correctEventId}`);

      // Migrate all bets to the new match
      const migrationSuccess = await this.migrateBetsToExistingMatch(oldMatch.id, newMatch.id);
      
      if (migrationSuccess) {
        // Mark old match as deleted (don't actually delete to preserve audit trail)
        await database.update('Match', { id: oldMatch.id }, {
          isDeleted: true,
          lastUpdated: new Date(),
          notes: `Marked as deleted - bets migrated to new match ${newMatch.id} with correct external ID ${correctEventId}`
        });
        
        logger.info(`[AUTO-SYNC] Successfully migrated match ${oldMatch.id} to ${newMatch.id} and marked old match as deleted`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`[AUTO-SYNC] Error migrating match ${oldMatch.id}:`, error);
      return false;
    }
  }

  /**
   * Migrate bets from old match to new match
   * @param {string} oldMatchId - ID of the old match
   * @param {string} newMatchId - ID of the new match
   * @returns {boolean} Success status
   */
  async migrateBetsToExistingMatch(oldMatchId, newMatchId) {
    try {
      // Find all bets for the old match
      const betsToMigrate = await database.findMany('Bet', {
        matchId: oldMatchId
      });

      if (betsToMigrate.length === 0) {
        logger.info(`[AUTO-SYNC] No bets to migrate from match ${oldMatchId}`);
        return true;
      }

      logger.info(`[AUTO-SYNC] Migrating ${betsToMigrate.length} bets from match ${oldMatchId} to ${newMatchId}`);

      let migratedCount = 0;
      let errorCount = 0;

      for (const bet of betsToMigrate) {
        try {
          // Update bet to reference new match
          await database.update('Bet', { id: bet.id }, {
            matchId: newMatchId,
            lastUpdated: new Date()
          });
          migratedCount++;
        } catch (error) {
          logger.error(`[AUTO-SYNC] Error migrating bet ${bet.id}:`, error);
          errorCount++;
        }
      }

      logger.info(`[AUTO-SYNC] Bet migration completed: ${migratedCount} migrated, ${errorCount} errors`);
      return errorCount === 0; // Success if no errors
    } catch (error) {
      logger.error(`[AUTO-SYNC] Error during bet migration:`, error);
      return false;
    }
  }

  /**
   * Perform automatic cleanup of all matches with incorrect IDs
   * This runs periodically as part of the sync process
   */
  async performAutomaticIdCleanup() {
    try {
      logger.info('[AUTO-SYNC] Performing automatic ID cleanup...');
      
      // Find all matches with "prov-" prefixed IDs
      const matchesWithIncorrectIds = await database.findMany('Match', {
        OR: [
          { externalId: { startsWith: 'prov-' } },
          { beventId: { startsWith: 'prov-' } }
        ]
      });

      if (matchesWithIncorrectIds.length === 0) {
        logger.info('[AUTO-SYNC] No matches with incorrect IDs found');
        return;
      }

      logger.info(`[AUTO-SYNC] Found ${matchesWithIncorrectIds.length} matches with incorrect IDs, analyzing...`);

      let safeToFixCount = 0;
      let hasBetsCount = 0;
      let fixedCount = 0;
      let errorCount = 0;

      for (const match of matchesWithIncorrectIds) {
        try {
          // Check if match has related bets
          const relatedBets = await database.findMany('Bet', {
            matchId: match.id
          });

          if (relatedBets.length > 0) {
            hasBetsCount++;
            logger.info(`[AUTO-SYNC] Match ${match.id} has ${relatedBets.length} bets - attempting safe migration`);
            
            // Try to safely migrate the match with bets using externalId
            const correctId = match.externalId || match.beventId;
            if (correctId && !correctId.toString().startsWith('prov-')) {
              const migrationSuccess = await this.safelyMigrateMatchWithBets(match, correctId);
              if (migrationSuccess) {
                fixedCount++;
                logger.info(`[AUTO-SYNC] Successfully migrated match ${match.id} with bets`);
              } else {
                logger.warn(`[AUTO-SYNC] Failed to migrate match ${match.id} with bets`);
              }
            } else {
              logger.warn(`[AUTO-SYNC] Could not determine correct ID for match ${match.id} with bets, skipping`);
            }
            continue;
          }

          // Safe to fix - no foreign key constraints
          safeToFixCount++;
          const correctId = match.externalId || match.beventId;
          
          if (correctId && !correctId.toString().startsWith('prov-')) {
            const success = await this.fixIncorrectMatchIds(match, correctId);
            if (success) fixedCount++;
          } else {
            logger.warn(`[AUTO-SYNC] Could not determine correct ID for match ${match.id}, skipping`);
          }
        } catch (error) {
          logger.error(`[AUTO-SYNC] Error analyzing match ${match.id}:`, error);
          errorCount++;
        }
      }

      logger.info(`[AUTO-SYNC] ID cleanup analysis completed:`);
      logger.info(`  - Total matches with incorrect IDs: ${matchesWithIncorrectIds.length}`);
      logger.info(`  - Safe to fix (no bets): ${safeToFixCount}`);
      logger.info(`  - Has related bets (skipped): ${hasBetsCount}`);
      logger.info(`  - Successfully fixed: ${fixedCount}`);
      logger.info(`  - Errors: ${errorCount}`);

      this.lastCleanup = new Date(); // Update last cleanup timestamp
    } catch (error) {
      logger.error('[AUTO-SYNC] Error during automatic ID cleanup:', error);
    }
  }

  /**
   * Map API status to database status with time-based logic
   * @param {string} apiStatus - Status from API
   * @param {Object} matchData - Complete match data for time-based logic
   * @returns {string} Database status
   */
  mapStatus(apiStatus, matchData = {}) {
    // First, check API status
    if (apiStatus) {
      const statusMap = {
        'live': 'LIVE',
        'iplay': 'LIVE',
        'inPlay': 'LIVE',
        'upcoming': 'UPCOMING',
        'completed': 'COMPLETED',
        'settled': 'SETTLED',
        'cancelled': 'CANCELED',
        'canceled': 'CANCELED',
        'abandoned': 'ABANDONED',
        'suspended': 'SUSPENDED',
        'postponed': 'POSTPONED'
      };

      const mappedStatus = statusMap[apiStatus.toLowerCase()];
      if (mappedStatus) {
        return mappedStatus;
      }
    }

    // Time-based status logic when API status is not available
    if (matchData.startTime) {
      const now = new Date();
      const startTime = new Date(matchData.startTime);
      const timeDiff = startTime.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff > 1) {
        return 'UPCOMING';
      } else if (hoursDiff > 0) {
        return 'LIVE';
      } else {
        return 'COMPLETED';
      }
    }

    // Default fallback
    return 'UPCOMING';
  }

  /**
   * Enhanced status mapping with suspended/cancelled logic
   * @param {Object} matchData - Complete match data
   * @returns {Object} Enhanced status information
   */
  getEnhancedStatus(matchData) {
    const baseStatus = this.mapStatus(matchData.status || matchData.iplay, matchData);
    
    // Check for suspended/cancelled conditions
    let enhancedStatus = baseStatus;
    let suspensionReason = null;
    let isSuspended = false;

    // Check for explicit suspension in API data
    if (matchData.status === 'suspended' || matchData.suspended) {
      enhancedStatus = 'SUSPENDED';
      isSuspended = true;
      suspensionReason = matchData.suspensionReason || 'Match suspended by API';
    }

    // Check for cancellation
    if (matchData.status === 'cancelled' || matchData.cancelled) {
      enhancedStatus = 'CANCELED';
    }

    // Check for abandonment
    if (matchData.status === 'abandoned' || matchData.abandoned) {
      enhancedStatus = 'ABANDONED';
    }

    // Check for postponement
    if (matchData.status === 'postponed' || matchData.postponed) {
      enhancedStatus = 'POSTPONED';
    }

    return {
      status: enhancedStatus,
      isSuspended,
      suspensionReason,
      originalStatus: baseStatus,
      lastUpdated: new Date()
    };
  }

  /**
   * Get sync queue status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      queueSize: this.syncQueue.size,
      syncCycleCount: this.syncCycleCount,
      queueItems: Array.from(this.syncQueue.entries()).map(([eventId, item]) => ({
        eventId,
        timestamp: item.timestamp,
        retryCount: item.retryCount,
        age: Date.now() - item.timestamp
      })),
      lastCleanup: this.lastCleanup || null,
      nextCleanupIn: this.syncCycleCount ? 5 - (this.syncCycleCount % 5) : 0,
      features: {
        realTimeSync: 'Every 5 seconds',
        individualMatchProcessing: 'From odds route',
        automaticCleanup: 'Every 25 sync cycles',
        foreignKeySafe: true,
        timeBasedStatus: true,
        suspendedCancelledHandling: true
      }
    };
  }

  /**
   * Force sync a specific match
   * @param {string} eventId - Event ID to sync
   * @param {Object} matchData - Match data
   */
  async forceSyncMatch(eventId, matchData) {
    logger.info(`[AUTO-SYNC] Force syncing match ${eventId}`);
    return await this.syncMatchToDatabase(eventId, matchData);
  }

  /**
   * Fetch all matches from external API and queue them for sync
   * @param {string} apiEndpoint - API endpoint to fetch matches from
   * @returns {Promise<number>} Number of matches queued for sync
   */
  async fetchAllMatchesFromAPI(apiEndpoint = null) {
    try {
      logger.info('[AUTO-SYNC] Fetching all matches from external API...');
      
      // Use the same endpoint that the odds route uses successfully
      const endpoint = apiEndpoint || `https://data.shamexch.xyz/getbm?eventId=all`;
      
      // Use the same headers as the working odds route
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0'
        },
        family: 6,
        timeout: 10000
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const apiData = await response.json();
      const matches = apiData.matches || apiData.data || apiData || [];
      
      logger.info(`[AUTO-SYNC] Fetched ${matches.length} matches from external API`);
      
      let queuedCount = 0;
      let skippedCount = 0;
      
      for (const match of matches) {
        try {
          // Queue each match for synchronization
          await this.queueMatchForSync(match);
          queuedCount++;
        } catch (error) {
          logger.warn(`[AUTO-SYNC] Failed to queue match:`, error.message);
          skippedCount++;
        }
      }
      
      logger.info(`[AUTO-SYNC] Match fetching completed: ${queuedCount} queued, ${skippedCount} skipped`);
      return queuedCount;
      
    } catch (error) {
      logger.error('[AUTO-SYNC] Error fetching matches from external API:', error);
      throw error;
    }
  }

  /**
   * Perform bulk match synchronization
   * @param {Array} matches - Array of match data from API
   * @returns {Promise<Object>} Sync results
   */
  async bulkSyncMatches(matches) {
    try {
      logger.info(`[AUTO-SYNC] Starting bulk sync for ${matches.length} matches...`);
      
      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;
      
      for (const match of matches) {
        try {
          const eventId = match.eventId || match.beventId || match.id;
          if (!eventId) {
            skippedCount++;
            continue;
          }
          
          await this.syncMatchToDatabase(eventId, match);
          successCount++;
          
        } catch (error) {
          logger.error(`[AUTO-SYNC] Error syncing match:`, error.message);
          errorCount++;
        }
      }
      
      const results = {
        total: matches.length,
        success: successCount,
        errors: errorCount,
        skipped: skippedCount
      };
      
      logger.info(`[AUTO-SYNC] Bulk sync completed:`, results);
      return results;
      
    } catch (error) {
      logger.error('[AUTO-SYNC] Error during bulk sync:', error);
      throw error;
    }
  }
}

// Create singleton instance
const autoMatchSync = new AutoMatchSync();

module.exports = autoMatchSync;
