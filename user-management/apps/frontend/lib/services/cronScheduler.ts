import cron from 'node-cron';
import CricketFixtureService from './cricketFixtureService';

class CronScheduler {
  private static instance: CronScheduler;
  private isRunning: boolean = false;
  private syncJob: cron.ScheduledTask | null = null;

  private constructor() {}

  public static getInstance(): CronScheduler {
    if (!CronScheduler.instance) {
      CronScheduler.instance = new CronScheduler();
    }
    return CronScheduler.instance;
  }

  /**
   * Start the cron scheduler
   */
  public start(): void {
    if (this.isRunning) {
      console.log('🔄 Cron scheduler is already running');
      return;
    }

    console.log('🚀 Starting cron scheduler...');

    // Schedule match sync every 5 minutes
    this.syncJob = cron.schedule('*/5 * * * *', async () => {
      console.log('⏰ Running scheduled match sync...');
      await this.syncMatches();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    // Run initial sync immediately
    this.syncMatches();

    this.isRunning = true;
    console.log('✅ Cron scheduler started successfully');
    console.log('📅 Match sync scheduled every 5 minutes');
  }

  /**
   * Stop the cron scheduler
   */
  public stop(): void {
    if (!this.isRunning) {
      console.log('🔄 Cron scheduler is not running');
      return;
    }

    if (this.syncJob) {
      this.syncJob.stop();
      this.syncJob = null;
    }

    this.isRunning = false;
    console.log('🛑 Cron scheduler stopped');
  }

  /**
   * Get scheduler status
   */
  public getStatus(): { isRunning: boolean; nextRun?: Date } {
    if (!this.syncJob) {
      return { isRunning: false };
    }

    try {
      // Check if nextDate method exists
      if (typeof this.syncJob.nextDate === 'function') {
        return {
          isRunning: this.isRunning,
          nextRun: this.syncJob.nextDate().toDate()
        };
      } else {
        // Fallback if nextDate is not available
        return {
          isRunning: this.isRunning,
          nextRun: undefined
        };
      }
    } catch (error) {
      console.warn('⚠️ Could not get next run time:', error);
      return {
        isRunning: this.isRunning,
        nextRun: undefined
      };
    }
  }

  /**
   * Manually trigger match sync
   */
  public async manualSync(): Promise<void> {
    console.log('🔄 Manual match sync triggered');
    await this.syncMatches();
  }

  /**
   * Sync matches from fixture API
   */
  private async syncMatches(): Promise<void> {
    try {
      console.log('🔄 Starting scheduled match sync...');
      
      // Use the correct backend URL
      const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';
      const fixtureResponse = await fetch(`${backendUrl}/provider/cricketmatches`);
      
      if (!fixtureResponse.ok) {
        throw new Error(`Failed to fetch fixtures: ${fixtureResponse.status}`);
      }

      const fixtures = await fixtureResponse.json();
      console.log(`📊 Fetched ${fixtures.length} fixtures from API`);

      // Transform fixtures to match our expected format
      const transformedFixtures = fixtures.map((fixture: any) => {
        // Clean the eventId - remove extra characters like (1.246774949)
        const cleanEventId = (fixture.eventId || fixture.id || fixture.matchId || '').split('(')[0];
        
        return {
          eventId: cleanEventId,
          ename: fixture.ename || fixture.eventName || fixture.name || 'Unknown Match',
          bvent: fixture.bvent || fixture.bevent || '',
          bmarket: fixture.bmarket || fixture.bmarketId || '',
          cname: fixture.cname || fixture.tournament || 'Cricket Tournament',
          stime: fixture.stime || fixture.startTime || fixture.date,
          iplay: fixture.iplay || fixture.inPlay || false,
          team1: fixture.team1 || fixture.brunners?.[0] || 'Team 1',
          team2: fixture.team2 || fixture.brunners?.[1] || 'Team 2',
          score1: fixture.score1 || '0-0',
          score2: fixture.score2 || '0-0'
        };
      });

      // Save matches to database using the service
      const savedMatches = await CricketFixtureService.saveMatchesFromFixtures(transformedFixtures);

      console.log(`✅ Scheduled sync completed: ${savedMatches.length} matches processed`);
      
    } catch (error) {
      console.error('❌ Scheduled match sync failed:', error);
    }
  }
}

export default CronScheduler;
