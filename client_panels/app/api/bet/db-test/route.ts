import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';
    
    // Test database connection through backend (public endpoint)
    let dbStatus = 'unknown';
    try {
      const response = await fetch(`${backendUrl}/debug/db`, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        dbStatus = data.success ? `connected - ${data.debug.database.status}` : data.message;
      } else {
        dbStatus = `error: ${response.status}`;
      }
    } catch (error) {
      dbStatus = `connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return NextResponse.json({
      success: true,
      database: {
        status: dbStatus,
        backendUrl: backendUrl
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
