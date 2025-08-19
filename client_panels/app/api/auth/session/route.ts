import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import { prisma } from '../../../../lib/prisma';

interface JWTPayload {
  userId: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

export async function GET(request: NextRequest) {
  try {
    // Check for token in multiple places: cookies, Authorization header
    let token = request.cookies.get('token')?.value;
    
    if (!token) {
      // Try Authorization header as fallback
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { success: false, authenticated: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate JWT_SECRET environment variable
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET || JWT_SECRET === 'fallback-secret') {
      console.error('JWT_SECRET not properly configured');
      return NextResponse.json(
        { success: false, authenticated: false, error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Verify JWT token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      
      // Validate JWT payload
      if (!decoded.userId || !decoded.username || !decoded.role) {
        console.log('❌ Invalid JWT payload structure');
        return NextResponse.json(
          { 
            success: false, 
            authenticated: false, 
            error: 'Invalid authentication',
            code: 'INVALID_TOKEN'
          },
          { status: 401 }
        );
      }

      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTime) {
        console.log('❌ JWT token expired');
        return NextResponse.json(
          { 
            success: false, 
            authenticated: false, 
            error: 'Token expired',
            code: 'TOKEN_EXPIRED'
          },
          { status: 401 }
        );
      }

      // Fetch full user data from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          name: true,
          code: true,
          role: true,
          balance: true,
          creditLimit: true,
          exposure: true,
          contactno: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        return NextResponse.json(
          { 
            success: false, 
            authenticated: false, 
            error: 'User not found or inactive',
            code: 'USER_NOT_FOUND'
          },
          { status: 401 }
        );
      }

      // Create user data response with proper fallbacks
      const userData = {
        id: user.id,
        code: user.code || user.username || 'N/A',
        name: user.name || user.username || 'User',
        username: user.username,
        role: user.role,
        balance: user.balance || 0,
        creditLimit: user.creditLimit || 0,
        exposure: user.exposure || 0,
        contactno: user.contactno || 'N/A',
        isActive: user.isActive
      };

      console.log('🔍 Session API returning user data:', userData);
      
      // Return user data and token for WebSocket authentication
      const response = NextResponse.json({ 
        success: true, 
        authenticated: true, 
        user: userData,
        token: token // Include token for WebSocket
      });

      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');

      return response;
    } catch (error) {
      // Token is invalid or expired
      return NextResponse.json(
        { success: false, authenticated: false, error: 'Invalid authentication' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { success: false, authenticated: false, error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }
}
