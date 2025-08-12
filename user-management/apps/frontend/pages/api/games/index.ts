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
        return await getGames(req, res, currentUser);
      case 'POST':
        return await createGame(req, res, currentUser);
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Games API error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// GET /api/games - List games
async function getGames(req: NextApiRequest, res: NextApiResponse, currentUser: any) {
  try {
    const { page = 1, limit = 10, status, type, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let where: any = {};
    
    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: {
          _count: {
            select: {
              bets: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.match.count({ where })
    ]);

    return res.status(200).json({
      success: true,
      data: matches,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get games error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch games' });
  }
}

// POST /api/games - Create game
async function createGame(req: NextApiRequest, res: NextApiResponse, currentUser: any) {
  try {
    // Check if user can create games
    const canCreateGames = ['BOSS', 'SUB', 'MASTER', 'SUPER_AGENT'].includes(currentUser.role);
    if (!canCreateGames) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }

    const { 
      name, 
      description, 
      type, 
      minBet = 0, 
      maxBet = 1000, 
      odds = 1.0,
      startTime,
      endTime 
    } = req.body;

    // Validate required fields
    if (!name || !type || !startTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, type, and start time are required' 
      });
    }

    // Validate game type
    const validTypes = ['FOOTBALL', 'CRICKET', 'TENNIS', 'BASKETBALL', 'HORSE_RACING', 'CASINO', 'LOTTERY', 'OTHER'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid game type. Must be one of: ${validTypes.join(', ')}` 
      });
    }

    // Create match
    const match = await prisma.match.create({
      data: {
        title: name,
        externalId: `match_${Date.now()}`,
        status: 'UPCOMING'
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Match created successfully',
      data: match
    });
  } catch (error) {
    console.error('Create game error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create game' });
  }
} 