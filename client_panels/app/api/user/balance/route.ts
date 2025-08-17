import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('🔍 [BALANCE API] Token received:', token.substring(0, 20) + '...');
    
    try {
      // Verify JWT token - JWT_SECRET is guaranteed to be defined here
      const decoded = jwt.verify(token, JWT_SECRET as string) as any;
      const userId = decoded.sub || decoded.userId || decoded.id;
      
      console.log('🔍 [BALANCE API] JWT decoded successfully, userId:', userId);
      
      if (!userId) {
        console.error('❌ [BALANCE API] Invalid token format - no userId found');
        return NextResponse.json(
          { success: false, error: 'Invalid token format' },
          { status: 401 }
        );
      }

      // Instead of calling broken backend, use frontend Prisma directly
      console.log('🔍 [BALANCE API] Using frontend Prisma to fetch user data...');
      
      // Import Prisma and fetch user data directly
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          role: true,
          creditLimit: true,
          exposure: true,
          balance: true
        }
      });
      
      await prisma.$disconnect();
      
      if (!user) {
        console.error('❌ [BALANCE API] User not found in frontend database');
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      
      console.log('✅ [BALANCE API] User found in frontend database:', {
        username: user.username,
        creditLimit: user.creditLimit,
        exposure: user.exposure
      });

      // Return user chips (creditLimit) as balance
      const chips = user.creditLimit || 0;
      const exposure = user.exposure || 0;
      
      return NextResponse.json({
        success: true,
        data: { 
          balance: chips, 
          chips: chips, 
          exposure: exposure 
        }
      });
      
    } catch (jwtError) {
      console.error('❌ [BALANCE API] JWT verification failed:', jwtError);
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('❌ [BALANCE API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 