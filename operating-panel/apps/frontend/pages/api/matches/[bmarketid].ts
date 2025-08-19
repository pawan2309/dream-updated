import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { bmarketid } = req.query;

  if (!bmarketid || typeof bmarketid !== 'string') {
    return res.status(400).json({ message: 'bmarketId is required' });
  }

  try {
          // First try to find by bmarketId
      let match = await prisma.match.findFirst({
        where: {
          bmarketId: bmarketid,
          isDeleted: false,
        },
      });

      // If not found by bmarketId, try by matchId
      if (!match) {
        match = await prisma.match.findFirst({
          where: {
            matchId: bmarketid,
            isDeleted: false,
          },
        });
      }

      // If still not found, try by id
      if (!match) {
        match = await prisma.match.findFirst({
          where: {
            id: bmarketid,
            isDeleted: false,
          },
        });
      }

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Transform the data to match the expected format
    const transformedMatch = {
      id: match.id,
      bmarketId: match.bmarketId,
      beventId: match.beventId,
      matchName: match.matchName || match.title,
      seriesName: match.tournament,
      scoreIframe: '', // These fields are not in the current schema
      scoreIframe2: '',
      eventId: match.beventId,
      seriesId: '',
      sportId: '4', // Default cricket sport ID
      marketId: match.bmarketId,
      priority: '',
      matchDate: match.startTime ? match.startTime.toISOString() : '',
      tvId: '',
      socketUrl: '',
      cacheUrl: '',
      otherMarketCacheUrl: '',
      tvUrl: '',
      matchType: match.matchType || 'Select Match Type',
      status: match.status,
      betDelayTime: '',
      bookmakerRange: '',
      team1Img: '',
      team2Img: '',
      notification: '',
      isTv: true,
      isScore: true,
      betPerm: true,
      socketPerm: true,
      isBookmaker: true,
      isFancy: true,
      isMatchOdds: true,
      isTieOdds: true,
      isToss: true,
      isCompletedOdds: true,
      isLineMarketOdds: true,
      wonTeamName: '',
      teams: match.teams
    };

    return res.status(200).json({
      success: true,
      data: transformedMatch
    });
  } catch (error) {
    console.error('Match API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await prisma.$disconnect();
  }
}
