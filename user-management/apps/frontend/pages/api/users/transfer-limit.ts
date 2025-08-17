import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { fromUserId, toUserId, amount, remark } = req.body;

    // Validation
    if (!fromUserId || !toUserId || !amount || !remark) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({ message: 'Cannot transfer to same user' });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Get both users
    const [fromUser, toUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: fromUserId } }),
      prisma.user.findUnique({ where: { id: toUserId } })
    ]);

    if (!fromUser || !toUser) {
      return res.status(404).json({ message: 'One or both users not found' });
    }

    // Check if fromUser has sufficient limit
    if ((fromUser.creditLimit || 0) < parsedAmount) {
      return res.status(400).json({ 
        message: 'Insufficient credit limit for transfer',
        currentLimit: fromUser.creditLimit || 0,
        requestedAmount: parsedAmount
      });
    }

    // Perform the transfer within a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from source user
      const updatedFromUser = await tx.user.update({
        where: { id: fromUserId },
        data: { creditLimit: (fromUser.creditLimit || 0) - parsedAmount }
      });

      // Add to destination user
      const updatedToUser = await tx.user.update({
        where: { id: toUserId },
        data: { creditLimit: (toUser.creditLimit || 0) + parsedAmount }
      });

      // Create ledger entry for source user (debit)
      const fromLedgerData = {
        userId: fromUserId,
        amount: parsedAmount,
        type: 'DEBIT',
        description: `Transfer to ${toUser.username || toUser.name} - ${remark}`,
        reference: `TRANSFER_OUT_${Date.now()}`,
        createdBy: 'system'
      };

      await tx.ledger.create({ data: fromLedgerData });

      // Create ledger entry for destination user (credit)
      const toLedgerData = {
        userId: toUserId,
        amount: parsedAmount,
        type: 'CREDIT',
        description: `Transfer from ${fromUser.username || fromUser.name} - ${remark}`,
        reference: `TRANSFER_IN_${Date.now()}`,
        createdBy: 'system'
      };

      await tx.ledger.create({ data: toLedgerData });

      return { updatedFromUser, updatedToUser };
    });

    return res.status(200).json({
      success: true,
      message: 'Credit limit transferred successfully',
      data: {
        fromUser: {
          id: fromUserId,
          oldLimit: fromUser.creditLimit || 0,
          newLimit: result.updatedFromUser.creditLimit,
          change: -parsedAmount
        },
        toUser: {
          id: toUserId,
          oldLimit: toUser.creditLimit || 0,
          newLimit: result.updatedToUser.creditLimit,
          change: parsedAmount
        },
        amount: parsedAmount,
        remark
      }
    });

  } catch (error) {
    console.error('Error in transfer-limit:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
} 