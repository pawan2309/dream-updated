import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest, { params }: { params: { streamingId: string } }) {
  try {
    // Verify JWT token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No authorization token provided' },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { streamingId } = params;

    // Mock Dragon Tiger specific data
    const mockDragonTigerData = {
      gameInfo: {
        name: 'Dragon Tiger',
        type: 'DragonTiger',
        description: 'A fast-paced card game where Dragon and Tiger compete for the highest card value',
        rules: [
          'Two cards are drawn: one for Dragon and one for Tiger',
          'Higher card value wins (Ace = 1, Jack = 11, Queen = 12, King = 13)',
          'If both cards have the same value, it\'s a Tie',
          'Place your bet before the timer runs out'
        ],
        minBet: 100,
        maxBet: 100000,
        houseEdge: 2.5
      },
      currentRound: {
        id: `DT_${Date.now()}`,
        status: 'betting',
        timeLeft: 25,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 30000).toISOString()
      },
      odds: {
        dragon: 1.97,
        tiger: 1.97,
        tie: 8.0
      },
      statistics: {
        totalRounds: 1247,
        dragonWins: 498,
        tigerWins: 499,
        ties: 250,
        averageBet: 2500,
        highestWin: 80000
      },
      recentResults: [
        'dragon', 'tiger', 'dragon', 'tie', 'tiger',
        'dragon', 'tiger', 'dragon', 'dragon', 'tiger'
      ],
      streaming: {
        isLive: true,
        quality: 'HD',
        delay: 2,
        server: 'DT-Server-01'
      },
      limits: {
        minStake: 100,
        maxStake: 100000,
        maxPayout: 500000,
        dailyLimit: 1000000
      }
    };

    return NextResponse.json({
      success: true,
      data: mockDragonTigerData,
      message: 'Dragon Tiger data fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching Dragon Tiger data:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch Dragon Tiger data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
