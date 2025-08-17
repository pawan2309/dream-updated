'use client'

import React from 'react'

interface RoundInfoProps {
  roundId: string
  timeLeft: number
  isBettingOpen: boolean
  roundStatus: string
  connectionStatus: string
}

const RoundInfo = React.memo(function RoundInfo({ 
  roundId, 
  timeLeft, 
  isBettingOpen, 
  roundStatus, 
  connectionStatus 
}: RoundInfoProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'betting': return 'bg-green-100 text-green-800 border-green-200'
      case 'active': return 'bg-red-100 text-red-800 border-red-200'
      case 'ended': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'betting': return '🎯'
      case 'active': return '⚡'
      case 'ended': return '🏁'
      default: return '⏳'
    }
  }

  const getConnectionColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800 border-green-200'
      case 'connecting': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getConnectionIcon = (status: string) => {
    switch (status) {
      case 'connected': return '🟢'
      case 'connecting': return '🟡'
      case 'error': return '🔴'
      default: return '⚪'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
        <h3 className="text-lg font-semibold">Round Information</h3>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Round Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Round ID:</span>
              <span className="text-sm font-mono text-gray-800 bg-white px-2 py-1 rounded border">
                {roundId}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Time Left:</span>
              <span className={`text-lg font-bold ${isBettingOpen ? 'text-green-600' : 'text-red-600'}`}>
                {timeLeft.toString().padStart(2, '0')}s
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Betting Status:</span>
              <span className={`text-sm font-semibold ${isBettingOpen ? 'text-green-600' : 'text-red-600'}`}>
                {isBettingOpen ? '🎯 Open' : '⏸️ Closed'}
              </span>
            </div>
          </div>
          
          {/* Status Information */}
          <div className="space-y-3">
            <div className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(roundStatus)}`}>
              <span className="text-sm font-medium">Round Status:</span>
              <span className="text-sm font-semibold flex items-center gap-1">
                {getStatusIcon(roundStatus)} {roundStatus.charAt(0).toUpperCase() + roundStatus.slice(1)}
              </span>
            </div>
            
            <div className={`flex items-center justify-between p-3 rounded-lg border ${getConnectionColor(connectionStatus)}`}>
              <span className="text-sm font-medium">Connection:</span>
              <span className="text-sm font-semibold flex items-center gap-1">
                {getConnectionIcon(connectionStatus)} {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Server:</span>
              <span className="text-sm text-gray-800">casino-01</span>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Round Progress</span>
            <span>{Math.round(((30 - timeLeft) / 30) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${
                isBettingOpen ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.round(((30 - timeLeft) / 30) * 100)}%` }}
            ></div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Quick Actions:</span>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium transition-colors">
                📊 Stats
              </button>
              <button className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs font-medium transition-colors">
                📋 History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default RoundInfo
