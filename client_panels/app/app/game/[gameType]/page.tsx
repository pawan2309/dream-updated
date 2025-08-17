'use client'

import { Suspense, lazy } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { GameProvider } from './context/GameContext'
import { BetSlipProvider } from './context/BetSlipContext'
import { useGameData } from './hooks/useGameData'
import { useResponsive } from './hooks/useResponsive'
import { GAME_CONFIG } from './config/gameConfig'
import LoadingSpinner from '../../../components/LoadingSpinner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Lazy load components for better performance
const Header = lazy(() => import('../../../../components/Header'))
const GameLayout = lazy(() => import('./components/GameLayout'))
const BetSlip = lazy(() => import('./components/BetSlip'))

// Dynamic imports with loading fallbacks
const DynamicHeader = dynamic(() => import('../../../../components/Header'), {
  loading: () => <div className="h-16 bg-gray-800 animate-pulse" />
})

const DynamicGameLayout = dynamic(() => import('./components/GameLayout'), {
  loading: () => <LoadingSpinner size="lg" text="Loading game..." />
})

const DynamicBetSlip = dynamic(() => import('./components/BetSlip'), {
  loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
})

// Main component with proper TypeScript types
export default function CasinoGame(): JSX.Element {
  const params = useParams()
  const gameType = params.gameType as string

  if (!gameType) {
    return <ErrorFallback message="Invalid game type" />
  }

  // Validate game type
  const validGameTypes = Object.keys(GAME_CONFIG.GAMES)
  if (!validGameTypes.includes(gameType)) {
    return (
      <ErrorFallback 
        message={`Game "${gameType}" is not available`}
        availableGames={validGameTypes}
      />
    )
  }

  return (
    <GameProvider gameType={gameType}>
      <BetSlipProvider>
        <CasinoGameContent gameType={gameType} />
      </BetSlipProvider>
    </GameProvider>
  )
}

// Main game content component
function CasinoGameContent({ gameType }: { gameType: string }): JSX.Element {
  const { data: gameData, loading, error } = useGameData(gameType)
  const { isMobile, isTablet } = useResponsive()

  if (error) {
    return (
      <ErrorFallback 
        message={error} 
        onRetry={() => window.location.reload()}
        showBackButton={true}
      />
    )
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 relative pt-[60px]">
      <Suspense fallback={<div className="h-16 bg-gray-800 animate-pulse" />}>
        <DynamicHeader />
      </Suspense>
      
      {/* Main Game Layout */}
      <div className="flex-1">
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading game layout..." />}>
          <DynamicGameLayout 
            gameType={gameType}
            gameData={gameData}
            loading={loading}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        </Suspense>
      </div>

      {/* Bet Slip - Fixed Position */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <Suspense fallback={<div className="h-32 bg-white border-t animate-pulse" />}>
          <DynamicBetSlip />
        </Suspense>
      </div>
    </div>
  )
}

// Error Fallback Component
interface ErrorFallbackProps {
  message: string
  onRetry?: () => void
  showBackButton?: boolean
  availableGames?: string[]
}

function ErrorFallback({ message, onRetry, showBackButton = false, availableGames }: ErrorFallbackProps): JSX.Element {
  const router = useRouter()

  const handleBackToCasino = () => {
    router.push('/app/casino')
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-red-50 via-red-100 to-red-200 relative pt-[60px]">
      <Header />
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-8 text-center shadow-lg">
            <div className="w-20 h-20 mx-auto mb-4">
              <div className="w-full h-full bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-4xl">⚠️</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-red-800 mb-3">Game Error</h2>
            <p className="text-red-600 text-base mb-4">{message}</p>
            
            {availableGames && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Available games:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {availableGames.map((game) => (
                    <Link
                      key={game}
                      href={`/app/game/${game}`}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                    >
                      {GAME_CONFIG.GAMES[game].displayName}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-3 justify-center">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-6 py-3 bg-gradient-to-r from-blue-400 to-blue-600 text-white font-bold rounded-lg hover:from-blue-300 hover:to-blue-500 transition-all duration-300"
                >
                  Retry
                </button>
              )}
              {showBackButton && (
                <button
                  onClick={handleBackToCasino}
                  className="px-6 py-3 bg-gradient-to-r from-red-400 to-red-600 text-white font-bold rounded-lg hover:from-red-300 hover:to-red-500 transition-all duration-300"
                >
                  Back to Casino
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
