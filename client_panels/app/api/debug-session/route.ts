import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 [DEBUG-SESSION] Testing backend session endpoint directly...');
    
    // Test backend session endpoint without any auth
    const response = await fetch('http://localhost:4001/auth/session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('🔍 [DEBUG-SESSION] Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [DEBUG-SESSION] Backend failed:', response.status, errorText);
      return NextResponse.json({
        success: false,
        error: `Backend failed: ${response.status}`,
        details: errorText,
        note: 'This is expected - session endpoint requires auth'
      });
    }

    const data = await response.text();
    console.log('✅ [DEBUG-SESSION] Backend success:', data);
    
    return NextResponse.json({
      success: true,
      message: 'Backend session endpoint is accessible',
      status: response.status,
      data: data.substring(0, 500) + '...'
    });

  } catch (error) {
    console.error('❌ [DEBUG-SESSION] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Backend connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
