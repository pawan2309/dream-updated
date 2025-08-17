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
    const apiUrl = 'http://localhost:4001/provider/cricketmatches';
    console.log('🔍 API: Fetching from local backend:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    console.log('🔍 API: Response status:', response.status);
    console.log('🔍 API: Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 API: Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log('🔍 API: Data received:', JSON.stringify(data).substring(0, 200) + '...');

    // --- Transform fixture IDs according to rules ---
    const transformId = (fixture: any) => {
      const bevent = fixture?.beventId || fixture?.eventId;
      const bmarket = fixture?.bmarketId;
      if (bevent) {
        return bmarket ? `${bevent}(${bmarket})` : String(bevent);
      }
      return fixture.id;
    };

    const processFixtures = (fixtures: any[]): any[] =>
      fixtures.map((f) => ({ ...f, id: transformId(f) }));

    let result: any = data;

    if (Array.isArray(data)) {
      result = processFixtures(data);
    } else if (data && Array.isArray(data.value)) {
      result = {
        ...data,
        value: processFixtures(data.value),
      };
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error('🔍 API: Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch cricket matches', details: error?.message || 'Unknown error' });
  }
}
