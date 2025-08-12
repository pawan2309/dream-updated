import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { status, limit = 50, offset = 0 } = req.query;

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }

    // Get matches with pagination
    const matches = await prisma.match.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        bets: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                role: true
              }
            }
          }
        }
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.match.count({ where });

    return res.status(200).json({
      success: true,
      data: matches,
      pagination: {
        total: totalCount,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: totalCount > parseInt(offset as string) + parseInt(limit as string)
      }
    });

  } catch (error) {
    console.error('Error fetching matches:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 