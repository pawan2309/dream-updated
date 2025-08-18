import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 [TEST-DB] Testing backend database connection...');
    
    // Test backend database ping endpoint
    const response = await fetch('http://localhost:4001/auth/db-ping', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('🔍 [TEST-DB] Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [TEST-DB] Backend database test failed:', response.status, errorText);
      return NextResponse.json({
        success: false,
        error: `Database test failed: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    console.log('✅ [TEST-DB] Backend database test successful:', JSON.stringify(data, null, 2));
    
    return NextResponse.json({
      success: true,
      message: 'Backend database is accessible',
      data: data
    });

  } catch (error) {
    console.error('❌ [TEST-DB] Error testing database:', error);
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
