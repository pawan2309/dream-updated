const express = require('express');
const router = express.Router();
const jwtAuth = require('../../shared/middleware/jwtAuth');
const database = require('../utils/database');
const axios = require('axios');

// POST /api/matches/sync - Sync matches from external API to database
router.post('/sync', jwtAuth(), async (req, res) => {
  try {
    console.log('🔍 [MATCHES] Manual sync requested');
    
    // Use the automated sync function from cricket fixtures cache
    const { syncMatchesToDatabase } = require('../services/cricketFixturesCache');
    
    // Fetch fresh data from external API
    const externalUrl = process.env.CRICKET_FIXTURES_URL || 'https://marketsarket.qnsports.live/cricketmatches';
    const response = await axios.get(externalUrl, { timeout: 15000 });
    
    if (response.status !== 200) {
      return res.status(500).json({
        success: false,
        error: `External API responded with status: ${response.status}`
      });
    }

    const fixtures = Array.isArray(response.data) ? response.data : 
                    (response.data && Array.isArray(response.data.t1) ? response.data.t1 : []);

    console.log('🔍 [MATCHES] Found', fixtures.length, 'fixtures');

    // Normalize fixtures like the cache service does
    const normalised = [];
    for (const fixture of fixtures) {
      try {
        const id = fixture.eventId || fixture.id;
        if (id) {
          normalised.push({
            id,
            raw: fixture
          });
        }
      } catch (err) {
        console.warn('[MATCHES] Failed to normalize fixture:', err);
      }
    }

    // Sync to database using the automated function
    const result = await syncMatchesToDatabase(normalised);

    console.log('✅ [MATCHES] Manual sync completed:', result);

    res.json({
      success: true,
      message: 'Matches synced successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ [MATCHES] Manual sync failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync matches',
      details: error.message
    });
  }
});

// GET /api/matches - Get all matches
router.get('/', jwtAuth(), async (req, res) => {
  try {
    const matches = await database.findMany('Match', { isDeleted: false });
    
    res.json({
      success: true,
      data: matches || []
    });

  } catch (error) {
    console.error('❌ [MATCHES] Error fetching matches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch matches'
    });
  }
});

module.exports = router;
