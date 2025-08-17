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

      // For now, return mock result data
      // In a real implementation, you would fetch from your casino system
      const mockResult = {
        playerA: { cards: [10, 7, 2] },
        playerB: { cards: [9, 6, 4] },
        winner: 'A' as 'A' | 'B'
      };

      return NextResponse.json({
        success: true,
        result: mockResult,
        message: 'Game result fetched successfully'
      });

    } catch (jwtError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid token'
      }, { status: 401 });
    }

  } catch (error) {
    console.error('Casino result fetch error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

