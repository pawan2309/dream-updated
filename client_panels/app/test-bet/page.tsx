'use client'

import React, { useState } from 'react';

export default function TestBetPage() {
  const [betData, setBetData] = useState({
    marketId: 'test_market_1',
    selectionId: 'test_selection_1',
    selectionName: 'Team A',
    odds: 2.5,
    stake: 100,
    type: 'back',
    marketName: 'Match Winner',
    matchId: 'test_match_123'
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePlaceBet = async () => {
    try {
      setLoading(true);
      setResult(null);

      // Get auth token
      const token = localStorage.getItem('authToken');
      if (!token) {
        setResult({ error: 'No auth token found. Please login first.' });
        return;
      }

      console.log('🔍 [TEST] Placing bet with data:', betData);

      const response = await fetch('/api/bets/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(betData),
      });

      console.log('🔍 [TEST] Response status:', response.status);
      
      const data = await response.json();
      console.log('🔍 [TEST] Response data:', data);
      
      setResult(data);
    } catch (error) {
      console.error('❌ [TEST] Error:', error);
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestMyBets = async () => {
    try {
      setLoading(true);
      setResult(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        setResult({ error: 'No auth token found. Please login first.' });
        return;
      }

      console.log('🔍 [TEST] Testing My Bets API...');

      const response = await fetch('/api/bets/my-bets', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 [TEST] My Bets response status:', response.status);
      
      const data = await response.json();
      console.log('🔍 [TEST] My Bets response data:', data);
      
      setResult({ type: 'my-bets', data });
    } catch (error) {
      console.error('❌ [TEST] My Bets error:', error);
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestBackend = async () => {
    try {
      setLoading(true);
      setResult(null);

      console.log('🔍 [TEST] Testing backend connectivity...');

      const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';
      const response = await fetch(`${backendUrl}/api/bets/test`, {
        method: 'GET',
      });

      console.log('🔍 [TEST] Backend response status:', response.status);
      
      if (response.ok) {
        const data = await response.text();
        setResult({ type: 'backend-test', success: true, data });
      } else {
        setResult({ type: 'backend-test', success: false, error: `Backend returned ${response.status}` });
      }
    } catch (error) {
      console.error('❌ [TEST] Backend test error:', error);
      setResult({ type: 'backend-test', success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Bet Placement</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Bet Details</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Market ID</label>
              <input
                type="text"
                value={betData.marketId}
                onChange={(e) => setBetData(prev => ({ ...prev, marketId: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selection ID</label>
              <input
                type="text"
                value={betData.selectionId}
                onChange={(e) => setBetData(prev => ({ ...prev, selectionId: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selection Name</label>
              <input
                type="text"
                value={betData.selectionName}
                onChange={(e) => setBetData(prev => ({ ...prev, selectionName: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Odds</label>
              <input
                type="number"
                step="0.01"
                value={betData.odds}
                onChange={(e) => setBetData(prev => ({ ...prev, odds: parseFloat(e.target.value) }))}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stake</label>
              <input
                type="number"
                value={betData.stake}
                onChange={(e) => setBetData(prev => ({ ...prev, stake: parseInt(e.target.value) }))}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={betData.type}
                onChange={(e) => setBetData(prev => ({ ...prev, type: e.target.value as 'back' | 'lay' }))}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="back">Back</option>
                <option value="lay">Lay</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Market Name</label>
              <input
                type="text"
                value={betData.marketName}
                onChange={(e) => setBetData(prev => ({ ...prev, marketName: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Match ID</label>
              <input
                type="text"
                value={betData.matchId}
                onChange={(e) => setBetData(prev => ({ ...prev, matchId: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>
          
          <div className="flex gap-4 mt-6">
            <button
              onClick={handlePlaceBet}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Placing Bet...' : 'Place Test Bet'}
            </button>
            
            <button
              onClick={handleTestMyBets}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test My Bets API'}
            </button>
            
            <button
              onClick={handleTestBackend}
              disabled={loading}
              className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Backend'}
            </button>
          </div>
        </div>
        
        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {result.type === 'my-bets' ? 'My Bets API Test Result' : 
               result.type === 'backend-test' ? 'Backend Connectivity Test Result' :
               'Bet Placement Result'}
            </h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
