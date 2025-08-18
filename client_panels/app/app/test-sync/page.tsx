'use client'

import React, { useState } from 'react';
import { useAutoMatchSync } from '../../../lib/hooks/useAutoMatchSync';

export default function TestSyncPage() {
  const [syncResult, setSyncResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { forceSyncMatch } = useAutoMatchSync();

  const handleSyncMatch34626187 = async () => {
    setIsLoading(true);
    try {
      const result = await forceSyncMatch('34626187', {
        eventName: 'Antigua And Barbuda Falcons vs St. Lucia Kings',
        status: 'live',
        iplay: true,
        inPlay: true,
        tournament: 'Cricket Match',
        startTime: new Date().toISOString(),
        teams: ['Antigua And Barbuda Falcons', 'St. Lucia Kings']
      });
      
      setSyncResult(result);
      console.log('✅ Match sync result:', result);
    } catch (error) {
      console.error('❌ Match sync failed:', error);
      setSyncResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Match Auto-Sync Test</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Manual Match Sync</h2>
              <p className="text-gray-600 mb-4">
                This will manually sync match 34626187 to the database to fix the "Match not found" error.
              </p>
              
              <button
                onClick={handleSyncMatch34626187}
                disabled={isLoading}
                className={`px-4 py-2 rounded-md font-medium ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Syncing...' : 'Sync Match 34626187'}
              </button>
            </div>

            {syncResult && (
              <div className="mt-6">
                <h3 className="text-md font-semibold text-gray-900 mb-2">Sync Result:</h3>
                <div className="bg-gray-50 rounded-md p-4">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {JSON.stringify(syncResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">How It Works</h2>
              <div className="space-y-3 text-sm text-gray-600">
                <p>• <strong>Auto-Sync Hook:</strong> Automatically syncs matches when odds data is received</p>
                <p>• <strong>Database Integration:</strong> Creates/updates matches in your PostgreSQL database</p>
                <p>• <strong>Bet Placement Fix:</strong> Ensures matches exist before placing bets</p>
                <p>• <strong>Real-time Updates:</strong> Keeps match status synchronized with API data</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Next Steps</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <p>1. ✅ Click "Sync Match 34626187" above</p>
                <p>2. 🔄 Try placing a bet on the match page</p>
                <p>3. 🎯 The "Match not found" error should be resolved</p>
                <p>4. 🚀 Future odds data will automatically sync matches</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
