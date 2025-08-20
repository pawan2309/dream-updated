import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Fetch completed matches from the database
    const completedMatches = await prisma.match.findMany({
      where: {
        isActive: true,
        isDeleted: false,
        status: {
          in: ['COMPLETED', 'CANCELED', 'SETTLED', 'ABANDONED']
        }
      },
      select: {
        id: true,
        matchId: true,
        matchName: true,
        sport: true,
        bevent: true,
        bmarket: true,
        tournament: true,
        status: true,
        startTime: true,
        isActive: true,
        teams: true,
        winner: true,
        result: true,
        settledAt: true,
        createdAt: true,
        lastUpdated: true
      },
      orderBy: {
        lastUpdated: 'desc' // Most recently updated first
      }
    });

    // Transform the data to match the table structure
    const transformedMatches = completedMatches.map(match => ({
      id: match.id,
      code: match.matchId || match.id.substring(0, 8),
      name: match.matchName || 'Match',
      dateTime: match.startTime,
      matchType: match.sport || 'Cricket',
      declare: match.status,
      wonBy: match.winner || 'Not declared',
      plusMinus: '0', // This would be calculated from bet settlements
      teams: match.teams,
      tournament: match.tournament,
      settledAt: match.settledAt,
      result: match.result
    }));

    res.status(200).json({
      success: true,
      matches: transformedMatches,
      count: transformedMatches.length
    });

  } catch (error) {
    console.error('Error fetching completed matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch completed matches',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
