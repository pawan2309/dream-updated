import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { status } = req.query;
    console.log('🎰 Frontend Casino API called with status:', status);

    // Try to use backend service as proxy (which should have better network access)
    try {
      console.log('🔍 Attempting to use backend proxy...');
      const backendUrl = status ? 
        `http://localhost:4001/api/casino?status=${status}` : 
        'http://localhost:4001/api/casino';
      
      const backendResponse = await fetch(backendUrl);
      
      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        console.log('✅ Backend proxy successful:', backendData);
        
        return res.status(200).json({
          success: true,
          message: 'Casino data retrieved via backend proxy',
          data: backendData.data || [],
          totalFetched: backendData.totalFetched || 0,
          totalFiltered: backendData.totalFiltered || 0,
          source: 'backend-proxy',
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('⚠️ Backend proxy failed, status:', backendResponse.status);
      }
    } catch (backendError) {
      console.log('⚠️ Backend proxy error:', backendError);
    }

    // Fallback: return information about the IP whitelist issue
    return res.status(200).json({
      success: true,
      message: 'Casino API requires IP whitelisting',
      data: [],
      totalFetched: 0,
      totalFiltered: 0,
      issue: {
        error: 'IP not whitelisted',
        yourIP: '182.69.179.128',
        solution: 'Contact API provider to whitelist your IP or use backend proxy',
        backendProxy: 'Attempted but failed'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Casino API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
