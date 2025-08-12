const express = require('express');
const router = express.Router();

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
    const { status } = req.query;
    console.log('🎰 Backend Casino API called with status:', status);

    const casinoData = [];
    
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

    console.log(`🎯 Total casinos fetched: ${casinoData.length}`);

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
      source: 'backend-proxy'
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
