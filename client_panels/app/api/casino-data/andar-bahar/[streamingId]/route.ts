import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(
  request: NextRequest,
  { params }: { params: { streamingId: string } }
) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: 'No token provided'
      }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      if (!decoded || !decoded.userId) {
        return NextResponse.json({
          success: false,
          message: 'Invalid token'
        }, { status: 401 });
      }

      const { streamingId } = params;

      // For now, return mock Andar Bahar data
      // In a real implementation, you would fetch from your casino system
      const mockAndarBaharData = {
        gameName: 'Andar Bahar',
        gameType: 'AndarBahar',
        streamingId,
        isActive: true,
        currentRound: {
          id: `AB${Date.now()}`,
          status: 'betting' as const,
          timeLeft: 30,
          totalBets: 1850,
          andarBets: 950,
          baharBets: 900
        },
        jokerCard: 'A♠',
        drawnCards: {
          andar: ['K♥', '7♦'],
          bahar: ['Q♣', '2♠']
        },
        winner: null,
        odds: {
          andar: 1.97,
          bahar: 1.97
        },
        userBalance: 5000,
        statistics: {
          totalGames: 89,
          andarWins: 45,
          baharWins: 44,
          averageBet: 1500
        },
        recentResults: ['andar', 'bahar', 'andar', 'andar', 'bahar', 'bahar', 'andar', 'bahar', 'andar', 'bahar'],
        settings: {
          minBet: 100,
          maxBet: 10000,
          maxExposure: 50000
        }
      };

      return NextResponse.json({
        success: true,
        data: mockAndarBaharData,
        message: 'Andar Bahar data fetched successfully'
      });

    } catch (jwtError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid token'
      }, { status: 401 });
    }

  } catch (error) {
    console.error('Andar Bahar data fetch error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
