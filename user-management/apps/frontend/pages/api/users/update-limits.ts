import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SESSION_COOKIE = 'session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Get token from cookie using Next.js built-in parser
    const token = req.cookies.betx_session;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No authentication token' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const adminUserId = decoded.user?.id;
    
    if (!decoded || !adminUserId) {
      return res.status(401).json({ success: false, message: 'Invalid session' });
    }

    const { userId, amount, type, remark } = req.body;

    // Validation
    if (!userId || !amount || !type) {
      return res.status(400).json({ success: false, message: 'User ID, amount, and type are required' });
    }

    if (!['deposit', 'withdrawal'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be either "deposit" or "withdrawal"' });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    // Ensure userId is a string
    const userIdString = String(userId);

    // Get user
    const user = await prisma.user.findUnique({ where: { id: userIdString } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if withdrawal would exceed current limit
    if (type === 'withdrawal' && (user.creditLimit || 0) < parsedAmount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient credit limit for withdrawal',
        currentLimit: user.creditLimit || 0,
        requestedAmount: parsedAmount
      });
    }

    // Perform the operation within a transaction
    const result = await prisma.$transaction(async (tx) => {
      let newLimit: number;
      
      if (type === 'deposit') {
        newLimit = (user.creditLimit || 0) + parsedAmount;
      } else {
        newLimit = (user.creditLimit || 0) - parsedAmount;
      }

      // Update user's credit limit
      const updatedUser = await tx.user.update({
        where: { id: userIdString },
        data: { creditLimit: newLimit }
      });

      // Create ledger entry
      const ledgerData = {
        userId: userIdString,
        debit: type === 'withdrawal' ? parsedAmount : 0,
        credit: type === 'deposit' ? parsedAmount : 0,
        balanceAfter: newLimit,
        type: 'ADJUSTMENT' as const,
        remark: `${type.toUpperCase()} by admin - ${remark || 'No remark'}`,
        referenceId: `${type.toUpperCase()}_${Date.now()}`,
        transactionType: type.toUpperCase()
      };

      await tx.ledger.create({ data: ledgerData });

      return { updatedUser, ledgerData };
    });

    return res.status(200).json({
      success: true,
      message: `Credit limit ${type} successful`,
      data: {
        userId: userIdString,
        oldLimit: user.creditLimit || 0,
        newLimit: result.updatedUser.creditLimit,
        change: type === 'deposit' ? parsedAmount : -parsedAmount,
        type: type,
        remark: remark
      }
    });

  } catch (error) {
    console.error('Error in update-limits:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 