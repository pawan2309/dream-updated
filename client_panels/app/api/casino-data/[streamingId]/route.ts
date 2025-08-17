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

      // For now, return mock casino data
      // In a real implementation, you would fetch from your casino system
      const mockCasinoData = {
        gameName: 'Teen Patti 20-20',
        gameType: 'Teen20',
        streamingId,
        isActive: true,
        currentRound: {
          id: `R${Date.now()}`,
          status: 'betting' as const,
          timeLeft: 20,
          totalBets: 1250,
          playerABets: 650,
          playerBBets: 600
        },
        statistics: {
          totalRounds: 156,
          playerAWins: 78,
          playerBWins: 78,
          averageBet: 1200
        },
        settings: {
          minBet: 100,
          maxBet: 10000,
          maxExposure: 50000
        }
      };

      return NextResponse.json({
        success: true,
        data: mockCasinoData,
        message: 'Casino data fetched successfully'
      });

    } catch (jwtError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid token'
      }, { status: 401 });
    }

  } catch (error) {
    console.error('Casino data fetch error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
