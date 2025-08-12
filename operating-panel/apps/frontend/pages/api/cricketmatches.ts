import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Disable caching
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const ngrokUrl = process.env.NGROK_BASE_URL || 'https://f572e62280f9.ngrok-free.app';
    console.log('🔍 Local API: Fetching from:', `${ngrokUrl}/provider/cricketmatches`);
    
    const response = await fetch(`${ngrokUrl}/provider/cricketmatches`, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    console.log('🔍 Local API: Response status:', response.status);
    console.log('🔍 Local API: Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 Local API: Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log('🔍 Local API: Data received:', JSON.stringify(data).substring(0, 200) + '...');
    
    res.status(200).json(data);
  } catch (error) {
    console.error('🔍 Local API: Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch cricket matches', details: error.message });
  }
}
