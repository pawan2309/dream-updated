import { NextApiRequest, NextApiResponse } from 'next';
import { CricketFixtureService } from '../../../lib/services/cricketFixtureService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fixtures } = req.body;

    if (!fixtures || !Array.isArray(fixtures)) {
      return res.status(400).json({ 
        error: 'Invalid request body. Expected fixtures array.' 
      });
    }

    console.log(`🔍 API: Saving ${fixtures.length} cricket fixtures to database...`);

    // Save fixtures to database
    const savedFixtures = await CricketFixtureService.bulkUpsertFixtures(fixtures);

    console.log(`✅ API: Successfully saved ${savedFixtures.length} fixtures to database`);

    res.status(200).json({
      success: true,
      message: `Successfully saved ${savedFixtures.length} fixtures`,
      savedCount: savedFixtures.length,
      fixtures: savedFixtures
    });

  } catch (error: any) {
    console.error('❌ API: Error saving fixtures:', error);
    res.status(500).json({ 
      error: 'Failed to save fixtures', 
      details: error?.message || 'Unknown error' 
    });
  }
}
