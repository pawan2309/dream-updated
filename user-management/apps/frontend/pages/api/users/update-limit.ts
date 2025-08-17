import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId, amount, type, role } = req.body;

    // Validation
    if (!userId || !amount || !type || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!['add', 'deduct'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type. Must be "add" or "deduct"' });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Invalid amount. Must be a positive number' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has sufficient limit for deduction
    if (type === 'deduct' && (user.creditLimit || 0) < parsedAmount) {
      return res.status(400).json({ 
        message: 'Insufficient credit limit for deduction',
        currentLimit: user.creditLimit || 0,
        requestedAmount: parsedAmount
      });
    }

    // Calculate new limit
    const currentLimit = user.creditLimit || 0;
    let newLimit: number;

    if (type === 'add') {
      newLimit = currentLimit + parsedAmount;
    } else {
      newLimit = currentLimit - parsedAmount;
    }

    // Prevent negative limits
    if (newLimit < 0) {
      return res.status(400).json({ 
        message: 'Operation would result in negative credit limit',
        currentLimit,
        requestedAmount: parsedAmount,
        wouldResultIn: newLimit
      });
    }

    // Update user credit limit
    await prisma.user.update({
      where: { id: userId },
      data: { creditLimit: newLimit }
    });

    // Create ledger entry
    const ledgerData = {
      userId: userId,
      amount: parsedAmount,
      type: type === 'add' ? 'CREDIT' : 'DEBIT',
      description: `Credit limit ${type} - ${parsedAmount}`,
      reference: `LIMIT_${type.toUpperCase()}_${Date.now()}`,
      createdBy: 'system'
    };

    await prisma.ledger.create({
      data: ledgerData
    });

    return res.status(200).json({
      success: true,
      message: 'Credit limit updated successfully',
      data: {
        userId,
        oldLimit: currentLimit,
        newLimit: newLimit,
        change: type === 'add' ? parsedAmount : -parsedAmount,
        operation: type
      }
    });

  } catch (error) {
    console.error('Error updating user limit:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
} 