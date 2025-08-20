import { prisma } from './prisma';
import { LedgerType, Prisma } from '@prisma/client';

/**
 * Ledger Service for all betting-related financial transactions
 */
export class LedgerService {
  /**
   * Apply a limit update from one user to another
   */
  static async applyLimitUpdate(fromUserId: string, toUserId: string, amount: number, remark: string) {
    // Update the toUser's credit limit
    const toUser = await prisma.user.update({
      where: { id: toUserId },
      data: { creditLimit: { increment: amount } },
    });
    // Create a ledger entry for the limit update
    return prisma.ledger.create({
      data: {
        userId: toUserId,
        sourceUserId: fromUserId,
        collection: 'LIMIT_UPDATE',
        credit: amount > 0 ? amount : 0,
        debit: amount < 0 ? -amount : 0,
        balanceAfter: toUser.creditLimit,
        type: LedgerType.LIMIT_UPDATE,
        remark,
        transactionType: 'LIMIT_UPDATE',
      } as Prisma.LedgerUncheckedCreateInput,
    });
  }

  /**
   * Record a user's win/loss for a match
   */
  static async recordPNL(userId: string, matchId: string, amount: number, isWin: boolean) {
    // No balance update needed
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    
    // Create ledger entry
    return prisma.ledger.create({
      data: {
        userId,
        matchId,
        collection: isWin ? 'WIN' : 'LOSS',
        credit: isWin ? amount : 0,
        debit: isWin ? 0 : -amount,
        type: isWin ? LedgerType.WIN : LedgerType.LOSS,
        remark: isWin ? 'Bet Win' : 'Bet Loss',
        transactionType: 'BET',
      } as Prisma.LedgerUncheckedCreateInput,
    });
  }

  /**
   * Distribute profit/loss up the user hierarchy based on share percentages
   * amount: positive for profit, negative for loss (from the perspective of the user)
   */
  static async distributeProfitLoss(userId: string, amount: number, matchId: string) {
    // Traverse up the hierarchy
    let currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) throw new Error('User not found');
    let remaining = Math.abs(amount);
    let direction = amount > 0 ? 1 : -1; // 1: profit, -1: loss
    let parentId = currentUser.parentId;
    while (parentId && remaining > 0.0001) {
      const parent = await prisma.user.findUnique({ where: { id: parentId }, include: { UserCommissionShare: true } });
      if (!parent) break;
      const share = parent.UserCommissionShare?.share ?? 0;
      const shareAmount = (remaining * share) / 100;
      if (shareAmount > 0) {
        // Credit or debit parent accordingly
        await prisma.ledger.create({
          data: {
            userId: parent.id,
            sourceUserId: currentUser.id,
            matchId,
            collection: direction > 0 ? 'PNL_CREDIT' : 'PNL_DEBIT',
            credit: direction > 0 ? shareAmount : 0,
            debit: direction < 0 ? shareAmount : 0,
            type: direction > 0 ? LedgerType.PNL_CREDIT : LedgerType.PNL_DEBIT,
            remark: direction > 0 ? 'Profit from downline' : 'Loss to downline',
            transactionType: 'P&L',
            referenceId: matchId,
          } as Prisma.LedgerUncheckedCreateInput,
        });
        // No balance update needed
      }
      // Move up
      remaining -= shareAmount;
      currentUser = parent;
      parentId = parent.parentId;
    }
    // If any remaining, assign to topmost upline
    if (remaining > 0.0001 && currentUser) {
      await prisma.ledger.create({
        data: {
          userId: currentUser.id,
          sourceUserId: userId,
          matchId,
          collection: direction > 0 ? 'PNL_CREDIT' : 'PNL_DEBIT',
          credit: direction > 0 ? remaining : 0,
          debit: direction < 0 ? remaining : 0,
          type: direction > 0 ? LedgerType.PNL_CREDIT : LedgerType.PNL_DEBIT,
          remark: 'Topmost upline allocation',
          transactionType: 'P&L',
          referenceId: matchId,
        } as Prisma.LedgerUncheckedCreateInput,
      });
      // No balance update needed
    }
  }

  /**
   * Settle a user's balance (manual or automated)
   */
  static async settleUserBalance(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    // No balance to settle
    return null;
  }

  /**
   * Get a user's ledger statement with optional filters
   */
  static async getLedgerStatement(userId: string, filterOptions: any = {}) {
    const where: any = { userId };
    if (filterOptions.type) where.type = filterOptions.type;
    if (filterOptions.matchId) where.matchId = filterOptions.matchId;
    if (filterOptions.startDate || filterOptions.endDate) {
      where.createdAt = {};
      if (filterOptions.startDate) where.createdAt.gte = filterOptions.startDate;
      if (filterOptions.endDate) where.createdAt.lte = filterOptions.endDate;
    }
    return prisma.ledger.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
} 