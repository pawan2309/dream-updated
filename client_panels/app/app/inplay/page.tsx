'use client'

import Header from '../../../components/Header'
import { useEffect, useState } from 'react'
import { useInPlayMatches } from '../../../lib/hooks/useInPlayMatches'

import { LiveMatchList } from '../../../components/LiveMatchList'
import { useRouter } from 'next/navigation'
import { websocketService } from '../../../lib/websocketService'

export default function InPlay() {
  const router = useRouter()
  const {
    matches,
    loading,
    error,
    connectionStatus,
    lastUpdate,
    refreshMatches,
    subscribeToMatch,
    unsubscribeFromMatch
  } = useInPlayMatches()

  return (
    <div className="min-h-dvh bg-gray-50 relative pt-[60px]">
      <Header />
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">In Play Matches</h1>
                
              </div>
              
              {/* Connection Status Badge */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${connectionStatus ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                  <span className={`text-sm font-medium ${connectionStatus ? 'text-green-700' : 'text-red-700'}`}>
                    {connectionStatus ? 'Live Updates' : 'Offline'}
                  </span>
                </div>
                
                {/* Authentication Status */}
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${websocketService.isAuthenticated() ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className={`text-sm font-medium ${websocketService.isAuthenticated() ? 'text-green-700' : 'text-yellow-700'}`}>
                    {websocketService.isAuthenticated() ? 'Authenticated' : 'Unauthenticated'}
                  </span>
                </div>
                
                {/* Match Count */}
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {matches.length} {matches.length === 1 ? 'Match' : 'Matches'}
                </div>
              </div>
            </div>
          </div>



          {/* Matches List */}
          <LiveMatchList
            matches={matches}
            loading={loading}
            error={error}
            emptyMessage="No in-play matches available at the moment. Check back later for live matches."
          />

          {/* Connection Status Footer */}
          {!connectionStatus && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">WebSocket Connection Lost</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Real-time updates are currently unavailable. The page will automatically reconnect when the connection is restored.
                  </p>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  )
} 