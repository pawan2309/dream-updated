'use client'

import Header from '../../../../../components/Header'
import CasinoGameHeader from '../../../../../components/CasinoGameHeader'
import { useParams } from 'next/navigation'

export default function AB20CasinoPage() {
  const params = useParams()
  const streamingId = params.streamingId as string

  return (
    <div className="min-h-dvh bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative pt-[60px]">
      <Header />
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          <CasinoGameHeader 
            gameName="AB20"
            gameId="ab20"
            streamingId={streamingId}
            roundId="114250815134239"
          />
          
          {/* Additional content can be added below */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">AB20 Game Information</h3>
            <p className="text-gray-600">
              Welcome to AB20 casino game. This is an exciting game with fast-paced action and big rewards.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
