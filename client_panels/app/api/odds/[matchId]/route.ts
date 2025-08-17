import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { matchId } = params;
    console.log('🎯 Fetching odds for match:', matchId);

    // Fetch from backend API
    const backendUrl = `http://localhost:4001/api/odds/${matchId}`;
    console.log('🔗 Backend URL:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Odds data fetched from backend:', data);
      return NextResponse.json(data);
    } else {
      const errorText = await response.text();
      console.error('❌ Backend API error:', response.status, errorText);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Backend API error',
          message: `Failed to fetch odds: ${response.status} ${response.statusText}`,
          details: errorText
        },
        { status: response.status }
      );
    }

  } catch (error) {
    console.error('❌ Error in odds API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch odds data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
