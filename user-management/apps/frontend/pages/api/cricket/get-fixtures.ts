import { NextApiRequest, NextApiResponse } from 'next';
import { CricketFixtureService } from '../../../lib/services/cricketFixtureService';
import { MatchStatus } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { status, live } = req.query;

    let fixtures;

    if (live === 'true') {
      // Get live fixtures
      fixtures = await CricketFixtureService.getLiveFixtures();
    } else if (status && Object.values(MatchStatus).includes(status as MatchStatus)) {
      // Get fixtures by specific status
      fixtures = await CricketFixtureService.getFixturesByStatus(status as MatchStatus);
    } else {
      // Get all active fixtures
      fixtures = await CricketFixtureService.getActiveFixtures();
    }

    console.log(`✅ API: Retrieved ${fixtures.length} fixtures from database`);

    res.status(200).json({
      success: true,
      count: fixtures.length,
      fixtures: fixtures
    });

  } catch (error: any) {
    console.error('❌ API: Error retrieving fixtures:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve fixtures', 
      details: error?.message || 'Unknown error' 
    });
  }
}
