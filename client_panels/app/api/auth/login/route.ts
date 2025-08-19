import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    // Validate request method
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Validate content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    // Input validation
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return NextResponse.json(
        { error: 'Valid client code is required' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
      return NextResponse.json(
        { error: 'Valid password is required' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedUsername = username.trim();
    const sanitizedPassword = password;

    // Validate JWT_SECRET environment variable
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET environment variable not configured');
      console.error('❌ Please set JWT_SECRET in your .env.local file');
      return NextResponse.json(
        { error: 'Server configuration error - JWT_SECRET not set' },
        { status: 503 }
      );
    }
    
    console.log('✅ JWT_SECRET is configured');

    // Find user by client code (username field in database)
    console.log('🔍 Searching for user with username:', sanitizedUsername);
    console.log('🔍 Database URL:', process.env.DATABASE_URL || 'Using default');
    
    let user;
    try {
      user = await prisma.user.findFirst({
        where: {
          username: sanitizedUsername,
          role: 'USER',
          isActive: true
        },
        select: {
          id: true,
          username: true,
          password: true,
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

      console.log('🔍 Database query result:', user);

      if (!user) {
        // Don't reveal whether user exists or not
        console.log('❌ No user found with username:', sanitizedUsername);
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Debug: Log user data to see what's in the database
      console.log('🔍 User found in database:', {
        id: user.id,
        username: user.username,
        name: user.name,
        code: user.code,
        role: user.role,
        balance: user.balance,
        balanceType: typeof user.balance,
        creditLimit: user.creditLimit,
        creditLimitType: typeof user.creditLimit,
        exposure: user.exposure,
        exposureType: typeof user.exposure,
        hasPassword: !!user.password,
        passwordLength: user.password?.length || 0
      });
    } catch (dbError) {
      console.error('❌ Database query error:', dbError);
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 503 }
      );
    }

      // Compare plain text passwords (temporary solution)
      const passwordValid = (sanitizedPassword === user.password);
      
      if (!passwordValid) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Create JWT token with proper expiration
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username,
          role: user.role,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        },
        JWT_SECRET,
        { 
          algorithm: 'HS256',
          issuer: process.env.JWT_ISSUER || '2xbat-client-panel',
          audience: process.env.JWT_AUDIENCE || '2xbat-users'
        }
      );

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

      // Debug: Log what's being sent to the client
      console.log('📤 User data being sent to client:', userData);
      console.log('📊 Data validation:', {
        originalBalance: user.balance,
        originalCreditLimit: user.creditLimit,
        originalExposure: user.exposure,
        finalBalance: userData.balance,
        finalCreditLimit: userData.creditLimit,
        finalExposure: userData.exposure,
        usedFallbacks: {
          balance: user.balance === null || user.balance === undefined,
          creditLimit: user.creditLimit === null || user.creditLimit === undefined,
          exposure: user.exposure === null || user.exposure === undefined
        }
      });

      // Create response with cookie
      const response = NextResponse.json({ 
        success: true, 
        message: 'Login successful',
        user: userData,
        token: token // Include token in response for localStorage
      });

      // Set HTTP-only cookie
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      });

      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');

      console.log('✅ Login successful, response created with token and cookie');
      return response;

  } catch (error) {
    // Log error for monitoring but don't expose details to client
    console.error('Login error:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }
}
