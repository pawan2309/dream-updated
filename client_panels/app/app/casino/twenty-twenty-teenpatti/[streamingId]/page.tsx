'use client'

import { Suspense, lazy } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { GameProvider } from './context/GameContext'
import { useCasinoData } from './hooks/useCasinoData'
import { useResponsive } from './hooks/useResponsive'
import { GAME_CONFIG, GAME_MESSAGES, ERROR_MESSAGES } from './config/gameConfig'
import { SEO_CONFIG } from './config/gameConfig'

// Lazy load components for better performance
const Header = lazy(() => import('../../../../../components/Header'))
const BettingInterface = lazy(() => import('./components/BettingInterface'))
const GameStream = lazy(() => import('./components/GameStream'))
const ResultsBar = lazy(() => import('./components/ResultsBar'))

// Dynamic imports with loading fallbacks
const DynamicHeader = dynamic(() => import('../../../../../components/Header'), {
  loading: () => <div className="h-16 bg-gray-800 animate-pulse" />
})

const DynamicBettingInterface = dynamic(() => import('./components/BettingInterface'), {
  loading: () => <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
})

const DynamicGameStream = dynamic(() => import('./components/GameStream'), {
  loading: () => <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
})

const DynamicResultsBar = dynamic(() => import('./components/ResultsBar'), {
  loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
})

// Main component with proper TypeScript types
export default function TeenPattiGame(): JSX.Element {
  const params = useParams()
  const streamingId = params.streamingId as string

  if (!streamingId) {
    return <ErrorFallback message="Invalid game ID" />
  }

  return (
    <GameProvider streamingId={streamingId}>
      <TeenPattiGameContent streamingId={streamingId} />
    </GameProvider>
  )
}

// Main game content component
function TeenPattiGameContent({ streamingId }: { streamingId: string }): JSX.Element {
  const router = useRouter()
  const { isMobile, isTablet } = useResponsive()
  const { data: casinoData, loading: casinoDataLoading, error: casinoDataError } = useCasinoData(streamingId)

  const handleBackToCasino = (): void => {
    router.push('/app/casino')
  }

  // Handle casino data errors
  if (casinoDataError) {
    return (
      <ErrorFallback 
        message={casinoDataError} 
        onRetry={() => window.location.reload()}
        showBackButton={true}
        onBack={handleBackToCasino}
      />
    )
  }

  return (
    <div className={`min-h-dvh bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 relative pt-[60px]`}>
      <Suspense fallback={<div className="h-16 bg-gray-800 animate-pulse" />}>
        <DynamicHeader />
      </Suspense>
      
      {/* Game Header */}
      <GameHeader 
        casinoData={casinoData}
        loading={casinoDataLoading}
        onBackToCasino={handleBackToCasino}
        isMobile={isMobile}
        isTablet={isTablet}
      />

      {/* Main Game Content */}
      <MainGameContent 
        isMobile={isMobile}
        isTablet={isTablet}
      />
    </div>
  )
}

// Game Header Component
interface GameHeaderProps {
  casinoData: any
  loading: string
  onBackToCasino: () => void
  isMobile: boolean
  isTablet: boolean
}

function GameHeader({ casinoData, loading, onBackToCasino, isMobile, isTablet }: GameHeaderProps): JSX.Element {
  return (
    <div className={`bg-white bg-opacity-95 backdrop-blur-sm border-b border-gray-200 shadow-sm`}>
      <div className={`max-w-${GAME_CONFIG.UI.MAX_WIDTH} mx-auto px-4 py-3`}>
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-center justify-between gap-3`}>
          {/* Back Button */}
          <BackButton onClick={onBackToCasino} isMobile={isMobile} />
          
          {/* Game Status Info */}
          <GameStatusInfo 
            casinoData={casinoData}
            loading={loading}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        </div>
      </div>
    </div>
  )
}

// Back Button Component
interface BackButtonProps {
  onClick: () => void
  isMobile: boolean
}

function BackButton({ onClick, isMobile }: BackButtonProps): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${GAME_CONFIG.COLORS.PRIMARY.light} text-white font-semibold rounded-lg hover:${GAME_CONFIG.COLORS.PRIMARY.hover} transition-all duration-300 ${isMobile ? 'text-sm w-full justify-center' : 'text-sm'}`}
    >
      ← {GAME_MESSAGES.BACK_TO_CASINO}
    </button>
  )
}

// Game Status Info Component
interface GameStatusInfoProps {
  casinoData: any
  loading: string
  isMobile: boolean
  isTablet: boolean
}

function GameStatusInfo({ casinoData, loading, isMobile, isTablet }: GameStatusInfoProps): JSX.Element {
  const gridCols = isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-4' : 'grid-cols-4'
  const gap = isMobile ? 'gap-2' : 'gap-4'

  return (
    <div className={`grid ${gridCols} ${gap} w-full ${isMobile ? 'mt-3' : ''}`}>
      <StatusItem 
        label="Round ID"
        value={casinoData?.currentRound?.id || GAME_MESSAGES.LOADING}
        className="text-gray-800"
      />
      
      <StatusItem 
        label="Next Round"
        value={`${casinoData?.currentRound?.timeLeft || 0}s`}
        className="text-red-600"
      />
      
      <StatusItem 
        label="Game Status"
        value={casinoData?.currentRound?.status === 'betting' ? GAME_MESSAGES.BETTING_OPEN : GAME_MESSAGES.ROUND_ACTIVE}
        className={casinoData?.currentRound?.status === 'betting' ? 'text-green-600' : 'text-red-600'}
      />
      
      <StatusItem 
        label="Connection"
        value={loading === 'loading' ? GAME_MESSAGES.CONNECTING : loading === 'error' ? GAME_MESSAGES.ERROR : GAME_MESSAGES.CONNECTED}
        className={loading === 'loading' ? 'text-yellow-600' : loading === 'error' ? 'text-red-600' : 'text-green-600'}
        showIndicator={true}
        indicatorColor={loading === 'loading' ? 'bg-yellow-400' : loading === 'error' ? 'bg-red-400' : 'bg-green-400'}
      />
    </div>
  )
}

// Status Item Component
interface StatusItemProps {
  label: string
  value: string
  className?: string
  showIndicator?: boolean
  indicatorColor?: string
}

function StatusItem({ label, value, className = '', showIndicator = false, indicatorColor = '' }: StatusItemProps): JSX.Element {
  return (
    <div className="text-center">
      <div className="text-xs text-gray-600 font-medium">{label}</div>
      <div className={`text-lg font-bold ${className} flex items-center justify-center gap-1`}>
        {showIndicator && (
          <div className={`w-2 h-2 rounded-full ${indicatorColor}`}></div>
        )}
        <span>{value}</span>
      </div>
    </div>
  )
}

// Main Game Content Component
interface MainGameContentProps {
  isMobile: boolean
  isTablet: boolean
}

function MainGameContent({ isMobile, isTablet }: MainGameContentProps): JSX.Element {
  const gridCols = isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3'
  const order = isMobile ? 'order-1' : isTablet ? 'order-1' : 'order-1'

  return (
    <div className="flex-1 p-4">
      <div className={`max-w-${GAME_CONFIG.UI.MAX_WIDTH} mx-auto`}>
        <div className={`grid ${gridCols} gap-${GAME_CONFIG.UI.GRID_GAP}`}>
          
          {/* Left Column - Betting Interface */}
          <div className={`${order === 'order-1' ? 'order-2' : 'order-1'}`}>
            <Suspense fallback={<div className="h-96 bg-gray-100 rounded-lg animate-pulse" />}>
              <DynamicBettingInterface />
            </Suspense>
          </div>
          
          {/* Center Column - Game Stream */}
          <div className={`${order === 'order-1' ? 'order-1' : 'order-2'}`}>
            <Suspense fallback={<div className="h-96 bg-gray-100 rounded-lg animate-pulse" />}>
              <DynamicGameStream />
            </Suspense>
          </div>
          
          {/* Right Column - Results & Cards */}
          <div className="order-3">
            <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
              <DynamicResultsBar />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

// Error Fallback Component
interface ErrorFallbackProps {
  message: string
  onRetry?: () => void
  showBackButton?: boolean
  onBack?: () => void
}

function ErrorFallback({ message, onRetry, showBackButton = false, onBack }: ErrorFallbackProps): JSX.Element {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-red-50 via-red-100 to-red-200 relative">
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-8 text-center shadow-lg">
            <div className="w-20 h-20 mx-auto mb-4">
              <div className="w-full h-full bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-4xl">⚠️</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-red-800 mb-3">{GAME_MESSAGES.STREAM_NOT_AVAILABLE}</h2>
            <p className="text-red-600 text-base mb-4">{message}</p>
            <div className="flex gap-3 justify-center">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-6 py-3 bg-gradient-to-r from-blue-400 to-blue-600 text-white font-bold rounded-lg hover:from-blue-300 hover:to-blue-500 transition-all duration-300"
                >
                  Retry
                </button>
              )}
              {showBackButton && onBack && (
                <button
                  onClick={onBack}
                  className="px-6 py-3 bg-gradient-to-r from-red-400 to-red-600 text-white font-bold rounded-lg hover:from-red-300 hover:to-red-500 transition-all duration-300"
                >
                  {GAME_MESSAGES.BACK_TO_CASINO}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
