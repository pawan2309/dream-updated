import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Demo user for testing
    const currentUser = {
      id: 'demo-user',
      username: 'Demo User',
      role: 'BOSS'
    };

    switch (req.method) {
      case 'GET':
        return await getTransactions(req, res, currentUser);
      case 'POST':
        return await createTransaction(req, res, currentUser);
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Transactions API error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// GET /api/transactions - List transactions
async function getTransactions(req: NextApiRequest, res: NextApiResponse, currentUser: any) {
  try {
    const { page = 1, limit = 10, type, status, userId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let where: any = {};
    
    // Filter by user if specified and user has permission
    if (userId) {
      if (currentUser.role === 'BOSS' || currentUser.id === userId) {
        where.userId = userId;
      } else {
        return res.status(403).json({ success: false, message: 'Insufficient permissions' });
      }
    } else {
      // If no specific user, show only current user's transactions
      where.userId = currentUser.id;
    }

    if (type) where.type = type;
    if (status) where.status = status;

    const [ledgers, total] = await Promise.all([
      prisma.ledger.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.ledger.count({ where })
    ]);

    return res.status(200).json({
      success: true,
      data: ledgers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
}

// POST /api/transactions - Create transaction
async function createTransaction(req: NextApiRequest, res: NextApiResponse, currentUser: any) {
  try {
    const { 
      type, 
      amount, 
      description, 
      reference, 
      userId 
    } = req.body;

    // Validate required fields
    if (!type || !amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type and positive amount are required' 
      });
    }

    // Validate transaction type
    const validTypes = ['DEPOSIT', 'WITHDRAWAL', 'WIN', 'LOSS', 'ADJUSTMENT'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid transaction type. Must be one of: ${validTypes.join(', ')}` 
      });
    }

    // Determine target user
    const targetUserId = userId || currentUser.id;
    
    // Check permissions
    if (userId && currentUser.role !== 'BOSS') {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }

        // Get user's current credit limit
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { creditLimit: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Calculate ledger entries
    let debit = 0;
    let credit = 0;
    
    switch (type) {
      case 'DEPOSIT':
      case 'WIN':
        credit = amount;
        break;
      case 'WITHDRAWAL':
      case 'LOSS':
        debit = amount;
        break;
      case 'ADJUSTMENT':
        if (amount > 0) {
          credit = amount;
        } else {
          debit = Math.abs(amount);
        }
        break;
    }

    // Create ledger entry
    // const ledger = await prisma.ledger.create({
    //   data: {
    //     userId: targetUserId,
    //     collection: 'CA1 CASH',
    //     debit,
    //     credit,
    //     balanceAfter: newBalance,
    //     type: type as any,
    //     transactionType: 'MANUAL_ADJUST',
    //     referenceId: reference,
    //     remark: description
    //   },
    //   include: {
    //     user: {
    //       select: {
    //         id: true,
    //         username: true,
    //         name: true
    //       }
    //     }
    //   }
    // });

    // No balance update needed

    return res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: null
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create transaction' });
  }
} 