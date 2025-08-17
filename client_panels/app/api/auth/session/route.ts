import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        authenticated: false,
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
          authenticated: false,
          message: 'Invalid token'
        }, { status: 401 });
      }

      // Fetch current user data from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || !user.isActive) {
        return NextResponse.json({
          success: false,
          authenticated: false,
          message: 'User not found or inactive'
        }, { status: 401 });
      }

      // Return user data
      const userData = {
        id: user.id,
        code: user.code,
        name: user.name || user.username,
        username: user.username,
        role: user.role,
        balance: user.balance,
        creditLimit: user.creditLimit,
        exposure: user.exposure,
        contactno: user.contactno,
        isActive: user.isActive
      };

      return NextResponse.json({
        success: true,
        authenticated: true,
        user: userData,
        message: 'Session valid'
      });

    } catch (jwtError) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'Invalid token'
      }, { status: 401 });
    }

  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({
      success: false,
      authenticated: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
