import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchData } = body;

    if (!matchData || !matchData.eventId) {
      return NextResponse.json(
        { success: false, error: 'Missing match data or eventId' },
        { status: 400 }
      );
    }

    console.log(`🔄 [MATCH-SYNC] Syncing match ${matchData.eventId} to database...`);

    // Check if match already exists
    const existingMatch = await prisma.match.findFirst({
      where: {
        OR: [
          { externalId: matchData.eventId.toString() },
          { beventId: matchData.eventId.toString() }
        ]
      }
    });

    let result;
    if (existingMatch) {
      // Update existing match with enhanced data
      result = await prisma.match.update({
        where: { id: existingMatch.id },
        data: {
          lastUpdated: new Date(),
          rawData: matchData,
          status: mapStatus(matchData.status || matchData.iplay),
          isLive: Boolean(matchData.inPlay || matchData.iplay),
          title: matchData.eventName || matchData.name || existingMatch.title,
          matchName: matchData.eventName || matchData.name || existingMatch.matchName,
          
          // Enhanced field updates as requested
          tournament: matchData.tournament || matchData.cname || existingMatch.tournament,
          startTime: matchData.startTime || matchData.stime ? new Date(matchData.startTime || matchData.stime) : existingMatch.startTime,
          teams: matchData.teams || matchData.brunners || existingMatch.teams,
          apiSource: matchData.apiSource || 'shamexch.xyz'
        }
      });
      console.log(`✅ [MATCH-SYNC] Updated existing match ${matchData.eventId} with enhanced data`);
    } else {
      // Create new match with all required fields
      result = await prisma.match.create({
        data: {
          title: matchData.eventName || matchData.name || `Match ${matchData.eventId}`,
          externalId: matchData.eventId.toString(),
          beventId: matchData.eventId.toString(),
          status: mapStatus(matchData.status || matchData.iplay),
          isActive: true,
          isCricket: true,
          isDeleted: false,
          isLive: Boolean(matchData.inPlay || matchData.iplay),
          
          // Enhanced fields as requested
          matchName: matchData.eventName || matchData.name || `Match ${matchData.eventId}`,
          tournament: matchData.tournament || matchData.cname || 'Cricket Match',
          startTime: matchData.startTime || matchData.stime ? new Date(matchData.startTime || matchData.stime) : null,
          matchType: matchData.matchType || matchData.gtype || 'match',
          teams: matchData.teams || matchData.brunners || null,
          apiSource: matchData.apiSource || 'shamexch.xyz',
          
          // Additional fields
          bmarketId: matchData.bmarketId || matchData.marketId || null,
          rawData: matchData
        }
      });
      console.log(`✅ [MATCH-SYNC] Created new match ${matchData.eventId} with enhanced data`);
    }

    return NextResponse.json({
      success: true,
      message: `Match ${matchData.eventId} synced successfully`,
      data: {
        id: result.id,
        externalId: result.externalId,
        beventId: result.beventId,
        title: result.title,
        status: result.status,
        isLive: result.isLive
      }
    });

  } catch (error) {
    console.error('❌ [MATCH-SYNC] Error syncing match:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync match', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to map API status to database status
function mapStatus(apiStatus: string): 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'SETTLED' | 'CANCELED' | 'ABANDONED' {
  if (!apiStatus) return 'UPCOMING';
  
  const statusMap: Record<string, 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'SETTLED' | 'CANCELED' | 'ABANDONED'> = {
    'live': 'LIVE',
    'iplay': 'LIVE',
    'inPlay': 'LIVE',
    'upcoming': 'UPCOMING',
    'completed': 'COMPLETED',
    'settled': 'SETTLED',
    'cancelled': 'CANCELED',
    'canceled': 'CANCELED',
    'abandoned': 'ABANDONED'
  };

  return statusMap[apiStatus.toLowerCase()] || 'UPCOMING';
}
