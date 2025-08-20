import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { matchId } = await request.json();
    
    if (!matchId) {
      return NextResponse.json(
        { success: false, error: 'Match ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 [TEST] Looking for match with ID: ${matchId}`);

    // Check for match using different fields
    const match = await prisma.match.findFirst({
      where: { 
        OR: [
          { id: matchId },
          { bevent: matchId }
        ],
        isDeleted: false
      }
    });

    if (!match) {
      console.log(`❌ [TEST] No match found for ID: ${matchId}`);
      
      // Let's also check what matches exist in the database
      const allMatches = await prisma.match.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          matchId: true,
          bevent: true,
          matchName: true,
          status: true,
          createdAt: true
        },
        take: 5
      });

      return NextResponse.json({
        success: false,
        error: 'Match not found',
        searchedFor: matchId,
        availableMatches: allMatches,
        searchFields: ['id', 'bevent', 'matchId']
      });
    }

    console.log(`✅ [TEST] Match found:`, match);

    return NextResponse.json({
      success: true,
              match: {
          id: match.id,
          matchId: match.matchId,
          bevent: match.bevent,
          matchName: match.matchName,
          status: match.status,
          isActive: match.isActive,
          isDeleted: match.isDeleted,
          createdAt: match.createdAt,
          lastUpdated: match.lastUpdated
        }
    });

  } catch (error) {
    console.error('Error testing match lookup:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
