import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { marketId, selectionId, odds, stake, type, matchId } = body;

    // Validate required fields
    if (!marketId || !selectionId || !odds || !stake || !type || !matchId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate stake amount
    if (stake <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid stake amount' },
        { status: 400 }
      );
    }

    // TODO: Get actual user ID from authentication
    const userId = 'temp_user_id'; // Replace with actual user ID from auth

    // Check if user exists and has sufficient balance
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

    if (user.balance < stake) {
      return NextResponse.json(
        { success: false, error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Check if match exists and is active
    const match = await prisma.match.findFirst({
      where: { 
        OR: [
          { id: matchId },
          { beventId: matchId },
          { externalId: matchId }
        ],
        isActive: true,
        isDeleted: false
      }
    });

    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Match not found or inactive' },
        { status: 404 }
      );
    }

    // Create bet record
    const bet = await prisma.bet.create({
      data: {
        userId,
        matchId: match.id,
        odds: parseFloat(odds),
        stake: parseFloat(stake),
        potentialWin: type === 'back' ? 
          (parseFloat(odds) - 1) * parseFloat(stake) : 
          parseFloat(stake) * (parseFloat(odds) - 1),
        status: 'PENDING'
      }
    });

    // Deduct stake from user balance
    await prisma.user.update({
      where: { id: userId },
      data: { balance: { decrement: parseFloat(stake) } }
    });

    // Create ledger entry for stake deduction
    await prisma.ledger.create({
      data: {
        userId,
        debit: parseFloat(stake),
        balanceAfter: user.balance - parseFloat(stake),
        type: 'PNL_DEBIT',
        remark: `Bet placed on ${match.title || matchId}`,
        referenceId: bet.id,
        transactionType: 'BET_PLACEMENT',
        matchId: match.id
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        betId: bet.id,
        message: 'Bet placed successfully'
      }
    });

  } catch (error) {
    console.error('Error placing bet:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
