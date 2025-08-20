import { prisma } from '../prisma';

export interface MatchData {
  eventId: string;
  ename: string;
  bvent: string;
  bmarket: string;
  cname: string;
  stime: string;
  iplay: boolean;
  team1?: string;
  team2?: string;
  score1?: string;
  score2?: string;
  status?: string;
}

export class MatchSyncService {
  private static instance: MatchSyncService;
  private isSyncing = false;

  static getInstance(): MatchSyncService {
    if (!MatchSyncService.instance) {
      MatchSyncService.instance = new MatchSyncService();
    }
    return MatchSyncService.instance;
  }

  async syncMatchesFromBackend(): Promise<{ success: boolean; synced: number; errors: number }> {
    if (this.isSyncing) {
      console.log('🔄 Match sync already in progress, skipping...');
      return { success: false, synced: 0, errors: 0 };
    }

    this.isSyncing = true;
    let syncedCount = 0;
    let errorCount = 0;

    try {
      console.log('🔄 Starting match sync from backend...');

      // Fetch matches from backend API
      const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';
      const response = await fetch(`${backendUrl}/provider/cricketmatches`);
      
      if (!response.ok) {
        throw new Error(`Backend API responded with status: ${response.status}`);
      }

      const fixtures: MatchData[] = await response.json();
      console.log(`📊 Fetched ${fixtures.length} fixtures from backend`);

      // Process each fixture
      for (const fixture of fixtures) {
        try {
          await this.processFixture(fixture);
          syncedCount++;
        } catch (error) {
          console.error(`❌ Error processing fixture ${fixture.eventId}:`, error);
          errorCount++;
        }
      }

      console.log(`✅ Match sync completed: ${syncedCount} synced, ${errorCount} errors`);
      return { success: true, synced: syncedCount, errors: errorCount };

    } catch (error) {
      console.error('❌ Match sync failed:', error);
      return { success: false, synced: syncedCount, errors: errorCount };
    } finally {
      this.isSyncing = false;
    }
  }

  private async processFixture(fixture: MatchData): Promise<void> {
    // Clean the eventId - remove extra characters like (1.246774949)
    const cleanEventId = fixture.eventId?.split('(')[0] || '';
    
    if (!cleanEventId) {
      throw new Error('Invalid event ID');
    }

    // Check if match already exists
    const existingMatch = await prisma.match.findFirst({
      where: {
        OR: [
          { matchId: cleanEventId },
          { bevent: cleanEventId }
        ]
      }
    });

    // Determine match status
    const status = this.determineMatchStatus(fixture);
    
    // Prepare match data
    const matchData = {
      matchId: cleanEventId,
      matchName: fixture.ename || 'Unknown Match',
      sport: 'cricket',
      bevent: fixture.bvent || '',
      bmarket: fixture.bmarket || '',
      tournament: fixture.cname || 'Cricket Tournament',
      status: status,
      startTime: fixture.stime ? new Date(fixture.stime) : null,
      isLive: fixture.iplay || false,
      isActive: true,
      teams: {
        team1: fixture.team1 || 'Team 1',
        team2: fixture.team2 || 'Team 2',
        score1: fixture.score1 || '0-0',
        score2: fixture.score2 || '0-0'
      },
      lastUpdated: new Date()
    };

    if (existingMatch) {
      // Update existing match
      await prisma.match.update({
        where: { id: existingMatch.id },
        data: matchData
      });
      console.log(`🔄 Updated match: ${matchData.matchName} (${cleanEventId})`);
    } else {
      // Create new match
      await prisma.match.create({
        data: matchData
      });
      console.log(`✅ Created match: ${matchData.matchName} (${cleanEventId})`);
    }
  }

  private determineMatchStatus(fixture: MatchData): string {
    if (fixture.status) {
      return fixture.status.toUpperCase();
    }

    if (fixture.iplay) {
      return 'LIVE';
    }

    if (fixture.stime) {
      const startTime = new Date(fixture.stime);
      const now = new Date();
      
      if (startTime > now) {
        return 'UPCOMING';
      } else if (startTime < now && startTime > new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
        // Within 24 hours of start time
        return 'LIVE';
      } else {
        return 'COMPLETED';
      }
    }

    return 'UPCOMING';
  }

  async getMatchCounts(): Promise<{ total: number; live: number; completed: number; upcoming: number }> {
    try {
      const [total, live, completed, upcoming] = await Promise.all([
        prisma.match.count({ where: { isDeleted: false } }),
        prisma.match.count({ where: { status: 'LIVE', isDeleted: false } }),
        prisma.match.count({ where: { status: 'COMPLETED', isDeleted: false } }),
        prisma.match.count({ where: { status: 'UPCOMING', isDeleted: false } })
      ]);

      return { total, live, completed, upcoming };
    } catch (error) {
      console.error('❌ Error getting match counts:', error);
      return { total: 0, live: 0, completed: 0, upcoming: 0 };
    }
  }
}

export default MatchSyncService;
