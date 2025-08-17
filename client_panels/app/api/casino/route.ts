import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const refresh = searchParams.get('refresh');

    // Build the backend API URL
    let backendUrl = 'http://localhost:4001/api/casino';
    const queryParams = new URLSearchParams();
    
    if (status) queryParams.append('status', status);
    if (refresh) queryParams.append('refresh', refresh);
    
    if (queryParams.toString()) {
      backendUrl += `?${queryParams.toString()}`;
    }

    console.log('🎰 Fetching casino data from backend:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Casino data fetched successfully:', data);

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Error fetching casino data:', error);
    
    // Return fallback data if backend is unavailable
    return NextResponse.json({
      success: true,
      message: 'Casino data retrieved successfully (fallback)',
      data: [
        {
          eventId: '3030',
          name: 'Teen20',
          shortName: 'TEEN20',
          betStatus: 'yes',
          minStake: 100,
          maxStake: 10000,
          streamingId: '3030'
        },
        {
          eventId: '3035',
          name: 'DT20',
          shortName: 'DT20',
          betStatus: 'yes',
          minStake: 100,
          maxStake: 10000,
          streamingId: '3035'
        },
        {
          eventId: '3032',
          name: 'Lucky7EU',
          shortName: 'LUCKY7EU',
          betStatus: 'yes',
          minStake: 100,
          maxStake: 10000,
          streamingId: '3032'
        },
        {
          eventId: '3056',
          name: 'AAA',
          shortName: 'AAA',
          betStatus: 'yes',
          minStake: 100,
          maxStake: 10000,
          streamingId: '3056'
        },
        {
          eventId: '3034',
          name: 'Card32EU',
          shortName: 'CARD32EU',
          betStatus: 'yes',
          minStake: 100,
          maxStake: 10000,
          streamingId: '3034'
        },
        {
          eventId: '3043',
          name: 'AB20',
          shortName: 'AB20',
          betStatus: 'yes',
          minStake: 100,
          maxStake: 10000,
          streamingId: '3043'
        }
      ],
      source: 'fallback',
      lastUpdated: new Date().toISOString()
    });
  }
}
