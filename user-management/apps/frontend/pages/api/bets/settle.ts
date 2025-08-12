import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { CommissionCalculator, BetResult } from '../../../lib/commissionCalculator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { betId, result, actualWinAmount } = req.body;

    if (!betId || !result) {
      return res.status(400).json({ 
        success: false, 
        message: 'betId and result are required' 
      });
    }

    // Get the bet details
    const bet = await prisma.bet.findUnique({
      where: { id: betId },
      include: { user: true }
    });

    if (!bet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bet not found' 
      });
    }

    // Calculate profit based on result
    let profit = 0;
    let actualWin = 0;

    if (result === 'WON') {
      actualWin = actualWinAmount || bet.potentialWin;
      profit = actualWin - bet.stake;
    } else if (result === 'LOST') {
      profit = -bet.stake;
      actualWin = 0;
    }

    // Create bet result object
    const betResult: BetResult = {
      betId: bet.id,
      userId: bet.userId,
      stake: bet.stake,
      potentialWin: bet.potentialWin,
      result: result as 'WON' | 'LOST',
      profit: profit,
      matchId: bet.matchId
    };

    // Calculate commission distributions
    const commissionDistributions = await CommissionCalculator.calculateCommissions(betResult);

    // Update bet status
    await prisma.bet.update({
      where: { id: betId },
      data: { 
        status: result === 'WON' ? 'WON' : 'LOST'
      }
    });

    // Process commissions and create ledger entries
    if (commissionDistributions.length > 0) {
      await CommissionCalculator.processCommissions(commissionDistributions);
    }

    // Create ledger entry for the bet result
    const ledgerEntry = await prisma.ledger.create({
      data: {
        userId: bet.userId,
        collection: `Bet ${result} - ${bet.matchId}`,
        credit: result === 'WON' ? actualWin : 0,
        debit: result === 'LOST' ? bet.stake : 0,
        balanceAfter: 0, // Will be calculated by balance update logic
        type: result === 'WON' ? 'WIN' : 'LOSS',
        remark: `Bet ${result.toLowerCase()} - Stake: ${bet.stake}, Win: ${actualWin}`,
        referenceId: betId,
        transactionType: 'BET_SETTLEMENT'
      }
    });

    // Update user balance
    await updateUserBalance(bet.userId);

    return res.status(200).json({
      success: true,
      message: `Bet ${result.toLowerCase()} successfully`,
      data: {
        betId,
        result,
        profit,
        actualWin,
        commissionDistributions: commissionDistributions.length,
        ledgerEntryId: ledgerEntry.id
      }
    });

  } catch (error) {
    console.error('Error settling bet:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Update user balance after bet settlement
 */
async function updateUserBalance(userId: string): Promise<void> {
  try {
    // Get all ledger entries for the user
    const ledgerEntries = await prisma.ledger.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    let currentBalance = 0;

    // Calculate current balance
    for (const entry of ledgerEntries) {
      currentBalance += entry.credit - entry.debit;
      
      // Update the balanceAfter field
      await prisma.ledger.update({
        where: { id: entry.id },
        data: { balanceAfter: currentBalance }
      });
    }

    // Update user's balance field
    await prisma.user.update({
      where: { id: userId },
      data: { balance: currentBalance }
    });

  } catch (error) {
    console.error('Error updating user balance:', error);
    throw error;
  }
}
