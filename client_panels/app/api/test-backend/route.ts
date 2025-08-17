import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [TEST-BACKEND] Testing backend connection...');
    
    // Test basic backend connectivity
    const response = await fetch('http://localhost:4001/auth/session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('🔍 [TEST-BACKEND] Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [TEST-BACKEND] Backend connection failed:', response.status, errorText);
      return NextResponse.json({
        success: false,
        error: `Backend connection failed: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.text();
    console.log('✅ [TEST-BACKEND] Backend connection successful');
    
    return NextResponse.json({
      success: true,
      message: 'Backend is accessible',
      status: response.status,
      data: data.substring(0, 200) + '...' // First 200 chars
    });

  } catch (error) {
    console.error('❌ [TEST-BACKEND] Error testing backend:', error);
    return NextResponse.json({
      success: false,
      error: 'Backend connection error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
