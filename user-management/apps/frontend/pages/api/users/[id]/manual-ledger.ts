import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.betx_session;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { id, amount, type, paymentType, remark } = req.body;

    // Validation
    if (!id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    const finalPaymentType = paymentType === 'credit' ? 'CREDIT' : 'DEBIT';
    if (!['CREDIT', 'DEBIT'].includes(finalPaymentType)) {
      return res.status(400).json({ message: 'Invalid payment type' });
    }

    if (!remark || remark.trim().length === 0) {
      return res.status(400).json({ message: 'Remark is required' });
    }

    // Get user and current credit limit
    const user = await prisma.user.findUnique({
      where: { id: id as string }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentLimit = user.creditLimit || 0;
    let newLimit = currentLimit;

    // Calculate new limit based on type
    if (type === 'add') {
      newLimit = currentLimit + parsedAmount;
    } else if (type === 'deduct') {
      newLimit = currentLimit - parsedAmount;
      if (newLimit < 0) {
        newLimit = 0;
      }
    }

    // Update user credit limit
    await prisma.user.update({
      where: { id: id as string },
      data: { creditLimit: newLimit }
    });

    // Create ledger entry
    const ledgerData = {
      userId: id as string,
      amount: parsedAmount,
      type: finalPaymentType,
      description: `Manual ${type} - ${remark}`,
      reference: `MANUAL_${type.toUpperCase()}_${Date.now()}`,
      createdBy: decoded.userId || 'system'
    };

    const entry = await prisma.ledger.create({
      data: ledgerData
    });

    return res.status(200).json({
      success: true,
      message: 'Manual ledger entry added successfully',
      data: {
        userId: id,
        oldLimit: currentLimit,
        newLimit: newLimit,
        amount: parsedAmount,
        type: finalPaymentType,
        ledgerEntry: entry
      }
    });

  } catch (error) {
    console.error('Error adding manual ledger entry:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
} 