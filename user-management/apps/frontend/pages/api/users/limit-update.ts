import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
    const adminUserId = decoded.userId || decoded.id;
    
    if (!decoded || !adminUserId) {
      return res.status(401).json({ success: false, message: 'Invalid session' });
    }

    const { userIds, amount, type, remark } = req.body;

    // Validation
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'User IDs are required' });
    }

    if (!amount || !type) {
      return res.status(400).json({ success: false, message: 'Amount and type are required' });
    }

    if (!['Add', 'Minus'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be either "Add" or "Minus"' });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    // Perform the operation within a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updates = [];
      
      for (const userId of userIds) {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) continue;

        let newLimit: number;
        if (type === 'Add') {
          newLimit = (user.creditLimit || 0) + parsedAmount;
        } else {
          newLimit = Math.max(0, (user.creditLimit || 0) - parsedAmount);
        }

        // Update user's credit limit
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { creditLimit: newLimit }
        });

        // Create ledger entry
        const ledgerData = {
          userId: userId,
          debit: type === 'Minus' ? parsedAmount : 0,
          credit: type === 'Add' ? parsedAmount : 0,
          balanceAfter: newLimit,
          type: 'LIMIT_UPDATE' as const,
          remark: `Bulk ${type} by admin - ${remark || 'No remark'}`,
          referenceId: `BULK_${type.toUpperCase()}_${Date.now()}`,
          transactionType: type.toUpperCase()
        };

        await tx.ledger.create({ data: ledgerData });
        updates.push({ userId, oldLimit: user.creditLimit || 0, newLimit });
      }

      return updates;
    });

    return res.status(200).json({
      success: true,
      message: `Bulk credit limit ${type} successful`,
      data: {
        updatedCount: result.length,
        updates: result
      }
    });

  } catch (error) {
    console.error('Error in bulk limit update:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
