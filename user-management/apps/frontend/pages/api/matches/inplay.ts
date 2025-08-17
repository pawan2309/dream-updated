import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Fetch live matches from the database
    const liveMatches = await prisma.match.findMany({
      where: {
        isLive: true,
        isActive: true,
        isDeleted: false,
        status: {
          in: ['LIVE', 'UPCOMING']
        }
      },
      select: {
        id: true,
        title: true,
        externalId: true,
        status: true,
        isLive: true,
        startTime: true,
        teams: true,
        matchName: true,
        matchType: true,
        tournament: true,
        apiSource: true,
        beventId: true,
        bmarketId: true,
        isCricket: true,
        lastUpdated: true
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      matches: liveMatches,
      count: liveMatches.length
    });

  } catch (error) {
    console.error('Error fetching live matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live matches',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
