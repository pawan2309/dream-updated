'use client'

import Header from '../../../components/Header'
import { MatchList } from '../../../components/MatchList'
import { useEffect, useState } from 'react'
import { Match, sharedApiService } from '../../../lib/sharedApi'

export default function InPlay() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInPlayMatches = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const result = await sharedApiService.getLiveMatches()
        
        if (result.success && result.data) {
          setMatches(result.data)
        } else {
          setError(result.error || 'Failed to load in-play matches')
        }
      } catch (err) {
        console.error('Error fetching in-play matches:', err)
        setError('Failed to load in-play matches. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchInPlayMatches()
  }, [])

  const handleMatchAction = (action: string, matchId: string) => {
    console.log(`Action: ${action} for match: ${matchId}`)
    // Handle different actions (view, bet, etc.)
    switch (action) {
      case 'view':
        // Navigate to match details
        console.log('View match details')
        break
      case 'bet':
        // Navigate to betting page
        console.log('Place bet')
        break
      default:
        console.log('Unknown action:', action)
    }
  }

  return (
    <div className="min-h-dvh bg-white relative">
      <Header />
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">In Play Cricket Matches</h1>
            <p className="text-gray-600 mt-2">Live matches available for betting</p>
          </div>
          
          <MatchList
            matches={matches}
            variant="detailed"
            showActions={true}
            onAction={handleMatchAction}
            loading={loading}
            error={error}
            emptyMessage="No in-play matches available at the moment. Check back later for live matches."
          />
        </div>
      </div>
    </div>
  )
} 