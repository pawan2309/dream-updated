'use client'

import React, { useState } from 'react';
import OddsGrid from '../../../components/OddsGrid';

// Sample odds data for demonstration with gstatus field
const sampleMarkets = [
  {
    id: 'match_odds',
    name: 'MATCH_ODDS',
    status: 'OPEN' as const,
    minStake: 0,
    maxStake: 2000,
    selections: [
      // Antigua And Barbuda Falcons - Some suspended
      { id: '1', name: 'Antigua And Barbuda Falcons', odds: 2.08, stake: 5.90, type: 'back' as const, status: 'active' as const, gstatus: 'ACTIVE' as const },
      { id: '2', name: 'Antigua And Barbuda Falcons', odds: 2.10, stake: 3.93, type: 'back' as const, status: 'active' as const, gstatus: 'SUSPENDED' as const },
      { id: '3', name: 'Antigua And Barbuda Falcons', odds: 2.12, stake: 341.09, type: 'back' as const, status: 'active' as const, gstatus: 'ACTIVE' as const },
      { id: '4', name: 'Antigua And Barbuda Falcons', odds: 2.18, stake: 271.54, type: 'lay' as const, status: 'active' as const, gstatus: 'ACTIVE' as const },
      { id: '5', name: 'Antigua And Barbuda Falcons', odds: 2.30, stake: 23.24, type: 'lay' as const, status: 'active' as const, gstatus: 'SUSPENDED' as const },
      { id: '6', name: 'Antigua And Barbuda Falcons', odds: 2.34, stake: 275.73, type: 'lay' as const, status: 'active' as const, gstatus: 'ACTIVE' as const },
      
      // St. Lucia Kings - All active
      { id: '7', name: 'St. Lucia Kings', odds: 1.75, stake: 368.69, type: 'back' as const, status: 'active' as const, gstatus: 'ACTIVE' as const },
      { id: '8', name: 'St. Lucia Kings', odds: 1.77, stake: 30.20, type: 'back' as const, status: 'active' as const, gstatus: 'ACTIVE' as const },
      { id: '9', name: 'St. Lucia Kings', odds: 1.86, stake: 318.26, type: 'back' as const, status: 'active' as const, gstatus: 'ACTIVE' as const },
      { id: '10', name: 'St. Lucia Kings', odds: 1.88, stake: 380.77, type: 'lay' as const, status: 'active' as const, gstatus: 'ACTIVE' as const },
      { id: '11', name: 'St. Lucia Kings', odds: 1.89, stake: 1.78, type: 'lay' as const, status: 'active' as const, gstatus: 'ACTIVE' as const },
      { id: '12', name: 'St. Lucia Kings', odds: 1.90, stake: 4.17, type: 'lay' as const, status: 'active' as const, gstatus: 'ACTIVE' as const },
    ]
  },
  {
    id: 'bookmaker',
    name: 'Bookmaker',
    status: 'SUSPENDED' as const,
    minStake: 100,
    maxStake: 500000,
    selections: [
      { id: '13', name: 'Antigua And Barbuda Falcons', odds: 0, stake: 0, type: 'back' as const, status: 'suspended' as const, gstatus: 'SUSPENDED' as const },
      { id: '14', name: 'St. Lucia Kings', odds: 0, stake: 0, type: 'back' as const, status: 'suspended' as const, gstatus: 'SUSPENDED' as const },
    ]
  },
  {
    id: 'tied_match',
    name: 'Tied Match',
    status: 'OPEN' as const,
    minStake: 0,
    maxStake: 0,
    selections: [
      { id: '15', name: 'Yes', odds: 34, stake: 45.22, type: 'back' as const, status: 'active' as const, gstatus: 'ACTIVE' as const },
      { id: '16', name: 'Yes', odds: 50, stake: 76.07, type: 'back' as const, status: 'active' as const, gstatus: 'ACTIVE' as const },
      { id: '17', name: 'Yes', odds: 60, stake: 62.21, type: 'back' as const, status: 'active' as const, gstatus: 'ACTIVE' as const },
      { id: '18', name: 'Yes', odds: 70, stake: 1.92, type: 'lay' as const, status: 'active' as const, gstatus: 'ACTIVE' as const },
      { id: '19', name: 'Yes', odds: 75, stake: 2.40, type: 'lay' as const, status: 'active' as const, gstatus: 'ACTIVE' as const },
      { id: '20', name: 'Yes', odds: 110, stake: 27.98, type: 'lay' as const, status: 'active' as const, gstatus: 'ACTIVE' as const },
      
      { id: '21', name: 'No', odds: 1.01, stake: 3359.40, type: 'back' as const, status: 'active' as const, gstatus: 'ACTIVE' as const },
      { id: '22', name: 'No', odds: 1.02, stake: 7388.25, type: 'lay' as const, status: 'active' as const, gstatus: 'ACTIVE' as const },
      { id: '23', name: 'No', odds: 1.03, stake: 1492.61, type: 'lay' as const, status: 'active' as const, gstatus: 'ACTIVE' as const },
      { id: '24', name: 'No', odds: 1.04, stake: 961.08, type: 'lay' as const, status: 'active' as const, gstatus: 'ACTIVE' as const },
    ]
  }
];

export default function OddsGridDemoPage() {
  const [lastClicked, setLastClicked] = useState<string>('');

  const handleOddsClick = (selection: any, market: any) => {
    setLastClicked(`${selection.name} - ${selection.odds} (${selection.type}) in ${market.name}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Odds Grid Demo</h1>
          <p className="text-gray-600">
            This demonstrates the OddsGrid component with suspended selections handling. 
            When <code>gstatus</code> is "SUSPENDED", odds show a red overlay and disable clicking.
          </p>
        </div>

        {/* Click Feedback */}
        {lastClicked && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Last Clicked:</h3>
            <p className="text-blue-800">{lastClicked}</p>
            <p className="text-blue-600 text-sm mt-1">
              Note: Suspended odds (red overlay) cannot be clicked
            </p>
          </div>
        )}

        {/* Odds Grid */}
        <OddsGrid markets={sampleMarkets} onOddsClick={handleOddsClick} />

        {/* Features Explanation */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Grid Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">LAGAI (Back Odds - Blue)</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 3rd Best: Lightest blue gradient</li>
                <li>• 2nd Best: Medium blue gradient</li>
                <li>• 1st Best: Darkest blue gradient</li>
                <li>• Shows odds value and stake amount</li>
                <li>• Clickable when gstatus = "ACTIVE"</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">KHAI (Lay Odds - Pink)</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 1st Best: Darkest pink gradient</li>
                <li>• 2nd Best: Medium pink gradient</li>
                <li>• 3rd Best: Lightest pink gradient</li>
                <li>• Shows odds value and stake amount</li>
                <li>• Clickable when gstatus = "ACTIVE"</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">Suspension Handling</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-20 h-12 bg-red-500 bg-opacity-90 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">SUSPENDED</span>
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Red Overlay:</strong> Selection is suspended (gstatus = "SUSPENDED")
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-20 h-12 bg-gradient-to-br from-blue-300 to-blue-400 border-blue-500 rounded flex items-center justify-center">
                  <div className="text-blue-800 font-bold text-sm">2.12</div>
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Blue Gradient:</strong> Selection is active (gstatus = "ACTIVE")
                </div>
              </div>
              <div className="text-sm text-gray-500">
                <strong>Note:</strong> The API field <code>gstatus</code> controls whether odds are clickable. 
                When "SUSPENDED", the odds show a red overlay and disable interaction.
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">Market Status Indicators</h3>
            <div className="flex space-x-4">
              <span className="px-3 py-1 bg-green-100 text-green-800 border border-green-200 rounded-full text-sm font-medium">
                OPEN
              </span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full text-sm font-medium">
                SUSPENDED
              </span>
              <span className="px-3 py-1 bg-red-100 text-red-800 border border-red-200 rounded-full text-sm font-medium">
                CLOSED
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
