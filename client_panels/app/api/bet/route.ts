import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Forward the request to the backend
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';
    console.log(`🔄 [API] Forwarding request to: ${backendUrl}/api/bet`);
    
    try {
      const response = await fetch(`${backendUrl}/api/bet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log(`✅ [API] Backend response status: ${response.status}`);

      if (!response.ok) {
        console.error(`❌ [API] Backend error: ${response.status} - ${data.message}`);
        return NextResponse.json(
          { success: false, message: data.message || 'Failed to place bet' },
          { status: response.status }
        );
      }

      console.log(`✅ [API] Bet placed successfully: ${data.data?.betId}`);
      return NextResponse.json(data);
      
    } catch (fetchError) {
      console.error(`❌ [API] Failed to connect to backend:`, fetchError);
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot connect to betting server. Please ensure the server is running at ${backendUrl}`,
          error: fetchError instanceof Error ? fetchError.message : 'Unknown connection error'
        },
        { status: 503 }
      );
    }
    
  } catch (error) {
    console.error('❌ [API] Error in bet API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
