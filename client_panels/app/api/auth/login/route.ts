import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Client code and password are required' },
        { status: 400 }
      );
    }

    // Find user by client code
    const user = await prisma.user.findFirst({
      where: {
        code: username,
        role: 'USER',
        isActive: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid client code or user not found' },
        { status: 401 }
      );
    }

    // In a real application, you should hash and compare passwords
    // For now, we'll do a simple comparison (you should implement proper password hashing)
    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Create session or return user data
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
      user: userData,
      token: token,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
