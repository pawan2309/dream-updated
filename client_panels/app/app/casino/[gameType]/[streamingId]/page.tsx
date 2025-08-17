'use client'

import { useParams } from 'next/navigation'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import LoadingSpinner from '../../components/casino/LoadingSpinner'

// Dynamic imports for different game types
const AndarBaharGame = dynamic(() => import('../../andar-bahar/[streamingId]/page'), {
  loading: () => <LoadingSpinner size="lg" text="Loading Andar Bahar..." />
})

const TeenPattiGame = dynamic(() => import('../../twenty-twenty-teenpatti/[streamingId]/page'), {
  loading: () => <LoadingSpinner size="lg" text="Loading Teen Patti..." />
})

const DragonTigerGame = dynamic(() => import('../../dragon-tiger/[streamingId]/page'), {
  loading: () => <LoadingSpinner size="lg" text="Loading Dragon Tiger..." />
})

// Game type mapping
const GAME_COMPONENTS = {
  'andar-bahar': AndarBaharGame,
  'twenty-twenty-teenpatti': TeenPattiGame,
  'dragon-tiger': DragonTigerGame,
  // Add more games here as they are created
} as const;

type GameType = keyof typeof GAME_COMPONENTS;

// Main dynamic casino game page
export default function DynamicCasinoGame(): JSX.Element {
  const params = useParams()
  const gameType = params.gameType as GameType
  const streamingId = params.streamingId as string

  if (!gameType || !streamingId) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-red-50 via-red-100 to-red-200 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Invalid Game</h1>
          <p className="text-red-600">Game type or streaming ID not found.</p>
        </div>
      </div>
    )
  }

  const GameComponent = GAME_COMPONENTS[gameType]

  if (!GameComponent) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-200 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-yellow-800 mb-4">Game Not Available</h1>
          <p className="text-yellow-600">The requested game type "{gameType}" is not yet implemented.</p>
          <p className="text-sm text-yellow-500 mt-2">Available games: {Object.keys(GAME_COMPONENTS).join(', ')}</p>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<LoadingSpinner size="lg" text={`Loading ${gameType}...`} />}>
      <GameComponent />
    </Suspense>
  )
}
