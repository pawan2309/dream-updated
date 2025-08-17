import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // TODO: Get actual user ID from authentication
    const userId = 'temp_user_id'; // Replace with actual user ID from auth

    // Get user balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        balance: user.balance
      }
    });

  } catch (error) {
    console.error('Error fetching user balance:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 