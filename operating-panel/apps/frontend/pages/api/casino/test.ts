import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🧪 Testing external casino APIs...');
    
    // Test a single casino API to see what's happening
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
    console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    let responseData;
    try {
      responseData = await response.json();
      console.log(`📡 Response data:`, responseData);
    } catch (parseError) {
      const textData = await response.text();
      console.log(`📡 Response text:`, textData);
      responseData = { rawText: textData };
    }
    
    return res.status(200).json({
      success: true,
      message: 'API test completed',
      testUrl,
      responseStatus: response.status,
      responseHeaders: Object.fromEntries(response.headers.entries()),
      responseData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('💥 Test API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
