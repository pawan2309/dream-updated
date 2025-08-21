import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';
    
    // Test 1: Check if backend is reachable
    let backendStatus = 'unknown';
    try {
      const response = await fetch(`${backendUrl}/api/bet/test`, { method: 'GET' });
      backendStatus = response.ok ? 'reachable' : `error: ${response.status}`;
    } catch (error) {
      backendStatus = `unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    // Test 2: Check if bet table exists and has data
    let betTableStatus = 'unknown';
    try {
      const response = await fetch(`${backendUrl}/api/bet/debug`, { method: 'GET' });
      const data = await response.json();
      betTableStatus = data.success ? `exists with ${data.totalBets} bets` : data.message;
    } catch (error) {
      betTableStatus = `error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return NextResponse.json({
      success: true,
      debug: {
        frontend: 'running on localhost:3000',
        backend: {
          url: backendUrl,
          status: backendStatus
        },
        betTable: betTableStatus,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
