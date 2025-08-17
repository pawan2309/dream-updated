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

    const { userId, commissionRate } = req.body;

    // Validation
    if (!userId || commissionRate === undefined) {
      return res.status(400).json({ success: false, message: 'User ID and commission rate are required' });
    }

    const parsedRate = Number(commissionRate);
    if (isNaN(parsedRate) || parsedRate < 0 || parsedRate > 100) {
      return res.status(400).json({ success: false, message: 'Commission rate must be between 0 and 100' });
    }

    // Get user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update user's commission rate
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        share: parsedRate,
        updatedAt: new Date()
      }
    });

    // Create ledger entry for commission change
    const ledgerData = {
      userId: userId,
      debit: 0,
      credit: 0,
      balanceAfter: user.creditLimit || 0,
      type: 'ADJUSTMENT' as const,
      remark: `Commission rate updated to ${parsedRate}% by admin`,
      referenceId: `COMMISSION_UPDATE_${Date.now()}`,
      transactionType: 'COMMISSION_UPDATE'
    };

    await prisma.ledger.create({ data: ledgerData });

    return res.status(200).json({
      success: true,
      message: 'Commission rate updated successfully',
      data: {
        userId: userId,
        oldRate: user.share || 0,
        newRate: updatedUser.share,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('Error in share-commission:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 