const express = require('express');
const router = express.Router();
const casinoService = require('../../services/casinoService');

// Casino API endpoints
const CASINO_ENDPOINTS = {
  teen20: {
    name: 'Teen20',
    streamingId: '3030',
    dataUrl: 'http://159.65.20.25:3000/getdata/teen20',
    resultUrl: 'http://159.65.20.25:3000/getresult/teen20'
  },
  ab20: {
    name: 'AB20',
    streamingId: '3043',
    dataUrl: 'http://159.65.20.25:3000/getdata/ab20',
    resultUrl: 'http://159.65.20.25:3000/getresult/ab20'
  },
  dt20: {
    name: 'DT20',
    streamingId: '3035',
    dataUrl: 'http://159.65.20.25:3000/getdata/dt20',
    resultUrl: 'http://159.65.20.25:3000/getresult/dt20'
  },
  aaa: {
    name: 'AAA',
    streamingId: '3056',
    dataUrl: 'http://159.65.20.25:3000/getdata/aaa',
    resultUrl: 'http://159.65.20.25:3000/getresult/aaa'
  },
  card32eu: {
    name: 'Card32EU',
    streamingId: '3034',
    dataUrl: 'http://159.65.20.25:3000/getdata/card32eu',
    resultUrl: 'http://159.65.20.25:3000/getresult/card32eu'
  },
  lucky7eu: {
    name: 'Lucky7EU',
    streamingId: '3032',
    dataUrl: 'http://159.65.20.25:3000/getdata/lucky7eu',
    resultUrl: 'http://159.65.20.25:3000/getresult/lucky7eu'
  }
};

// Get all casino data
router.get('/', async (req, res) => {
  try {
    const { status, refresh } = req.query;
    console.log('🎰 Backend Casino API called with status:', status, 'refresh:', refresh);

    let casinoData = [];
    let source = 'database';

    // If refresh is requested, fetch from external APIs and sync to DB
    if (refresh === 'true') {
      console.log('🔄 Refreshing casino data from external APIs...');
      
      // Ensure casino table exists
      try {
        await casinoService.ensureTable();
        console.log('✅ Casino table verified');
      } catch (tableError) {
        console.error('💥 Error ensuring casino table:', tableError);
      }
      
      for (const [key, casino] of Object.entries(CASINO_ENDPOINTS)) {
        console.log(`🔍 Fetching data for ${key}...`);
        
        try {
          const fetchOptions = {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            }
          };

          // Fetch casino data
          console.log(`📡 Calling: ${casino.dataUrl}`);
          const dataResponse = await fetch(casino.dataUrl, fetchOptions);
          console.log(`📡 Data response status: ${dataResponse.status} for ${key}`);
          
          console.log(`📡 Calling: ${casino.resultUrl}`);
          const resultResponse = await fetch(casino.resultUrl, fetchOptions);
          console.log(`📡 Result response status: ${resultResponse.status} for ${key}`);
          
          if (dataResponse.ok && resultResponse.ok) {
            const data = await dataResponse.json();
            const result = await resultResponse.json();
            
            console.log(`✅ Successfully fetched data for ${key}:`, { data, result });
            
            casinoData.push({
              eventId: casino.streamingId,
              name: casino.name,
              shortName: key.toUpperCase(),
              betStatus: data.status || 'yes',
              minStake: data.minStake || 100,
              maxStake: data.maxStake || 10000,
              lastResult: result.lastResult || 'N/A',
              roundId: result.roundId || 'N/A',
              streamingId: casino.streamingId,
              dataUrl: casino.dataUrl,
              resultUrl: casino.resultUrl
            });
          } else {
            console.log(`❌ API call failed for ${key}:`, {
              dataStatus: dataResponse.status,
              resultStatus: resultResponse.status
            });
          }
        } catch (error) {
          console.error(`💥 Error fetching data for ${key}:`, error);
        }
      }

      // Sync external data to database
      if (casinoData.length > 0) {
        try {
          await casinoService.syncCasinosFromExternalAPI(casinoData);
          console.log('💾 Casino data synced to database');
          source = 'external-api-synced';
        } catch (syncError) {
          console.error('💥 Error syncing to database:', syncError);
        }
      }
    }

    // Get data from database (either fresh or existing)
    try {
      const dbCasinos = await casinoService.getAllCasinos();
      console.log(`🎯 Total casinos in DB: ${dbCasinos.length}`);
      
      // Transform DB data to match expected format
      casinoData = dbCasinos.map(casino => ({
        eventId: casino.event_id.toString(),
        name: casino.name,
        shortName: casino.short_name,
        betStatus: casino.bet_status === 'OPEN' ? 'yes' : 'no', // OPEN = yes (betting allowed), CLOSED = no (betting restricted)
        minStake: parseFloat(casino.min_stake) || 0,
        maxStake: parseFloat(casino.max_stake) || 0,
        streamingId: casino.stream_id?.toString(),
        dataUrl: casino.data_url,
        resultUrl: casino.result_url,
        lastUpdated: casino.last_updated
      }));
      
      console.log('✅ Data loaded from database');
      
    } catch (dbError) {
      console.error('💥 Error fetching from database:', dbError);
      // If database fails and no external data was fetched, return empty array
      if (casinoData.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch casino data from database',
          error: dbError.message
        });
      }
    }

    // Filter by status if provided
    let filteredCasinos = casinoData;
    if (status && status !== 'all') {
      filteredCasinos = casinoData.filter(casino => casino.betStatus === status);
      console.log(`🔍 Filtered by status '${status}': ${filteredCasinos.length} casinos`);
    }

    res.json({
      success: true,
      message: 'Casino data retrieved successfully',
      data: filteredCasinos,
      totalFetched: casinoData.length,
      totalFiltered: filteredCasinos.length,
      source: source,
      lastUpdated: casinoData.length > 0 ? Math.max(...casinoData.map(c => new Date(c.lastUpdated).getTime())) : null
    });

  } catch (error) {
    console.error('💥 Backend Casino API error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Direct fetch endpoint - bypass cache and fetch fresh data
router.get('/fetch/:game', async (req, res) => {
  try {
    const { game } = req.params;
    const { type = 'both' } = req.query; // 'data', 'result', or 'both'
    
    if (!CASINO_ENDPOINTS[game]) {
      return res.status(400).json({
        success: false,
        message: `Invalid game: ${game}`,
        availableGames: Object.keys(CASINO_ENDPOINTS)
      });
    }

    const casino = CASINO_ENDPOINTS[game];
    console.log(`🎯 Direct fetch for ${game} (${casino.name}) - type: ${type}`);

    const fetchOptions = {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    };

    let result = {};

    if (type === 'data' || type === 'both') {
      console.log(`📡 Fetching data from: ${casino.dataUrl}`);
      const dataResponse = await fetch(casino.dataUrl, fetchOptions);
      if (dataResponse.ok) {
        result.data = await dataResponse.json();
        console.log(`✅ Data fetched successfully for ${game}`);
      } else {
        result.dataError = `HTTP ${dataResponse.status}: ${dataResponse.statusText}`;
        console.log(`❌ Data fetch failed for ${game}: ${result.dataError}`);
      }
    }

    if (type === 'result' || type === 'both') {
      console.log(`📡 Fetching result from: ${casino.resultUrl}`);
      const resultResponse = await fetch(casino.resultUrl, fetchOptions);
      if (resultResponse.ok) {
        result.result = await resultResponse.json();
        console.log(`✅ Result fetched successfully for ${game}`);
      } else {
        result.resultError = `HTTP ${resultResponse.status}: ${resultResponse.statusText}`;
        console.log(`❌ Result fetch failed for ${game}: ${result.resultError}`);
      }
    }

    res.json({
      success: true,
      message: `Direct fetch completed for ${game}`,
      game: game,
      gameName: casino.name,
      streamingId: casino.streamingId,
      dataUrl: casino.dataUrl,
      resultUrl: casino.resultUrl,
      fetchType: type,
      timestamp: new Date().toISOString(),
      result: result
    });

  } catch (error) {
    console.error(`💥 Direct fetch error for ${req.params.game}:`, error);
    res.status(500).json({
      success: false,
      message: 'Direct fetch failed',
      error: error.message,
      game: req.params.game
    });
  }
});

// Test endpoint
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Testing external casino APIs from backend...');
    
    const testUrl = 'http://159.65.20.25:3000/getdata/teen20';
    console.log(`📡 Testing URL: ${testUrl}`);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log(`📡 Response status: ${response.status}`);
    
    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      const textData = await response.text();
      responseData = { rawText: textData };
    }
    
    res.json({
      success: true,
      message: 'Backend API test completed',
      testUrl,
      responseStatus: response.status,
      responseData,
      source: 'backend-proxy'
    });
    
  } catch (error) {
    console.error('💥 Backend test API error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Test failed',
      error: error.message
    });
  }
});

module.exports = router;
