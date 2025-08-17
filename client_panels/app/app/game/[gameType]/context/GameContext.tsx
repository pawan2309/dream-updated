'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { GAME_CONFIG, GAME_MESSAGES } from '../config/gameConfig'

// Types
interface GameState {
  gameType: string
  roundId: string
  timeLeft: number
  isBettingOpen: boolean
  roundStatus: 'waiting' | 'betting' | 'active' | 'ended'
  lastResults: string[]
  connectionStatus: 'connecting' | 'connected' | 'error'
  error: string | null
}

interface GameAction {
  type: string
  payload?: any
}

interface GameContextType {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  startNewRound: () => void
  updateTimeLeft: () => void
  toggleBetting: (isOpen: boolean) => void
  updateConnectionStatus: (status: GameState['connectionStatus']) => void
  setError: (error: string | null) => void
}

// Initial state
const initialState: GameState = {
  gameType: '',
  roundId: '',
  timeLeft: GAME_CONFIG.TIMING.BETTING_DURATION,
  isBettingOpen: false,
  roundStatus: 'waiting',
  lastResults: [],
  connectionStatus: 'connecting',
  error: null,
}

// Reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_GAME_TYPE':
      return { ...state, gameType: action.payload }
    
    case 'SET_ROUND_ID':
      return { ...state, roundId: action.payload }
    
    case 'UPDATE_TIME_LEFT':
      return { ...state, timeLeft: Math.max(0, state.timeLeft - 1) }
    
    case 'SET_TIME_LEFT':
      return { ...state, timeLeft: action.payload }
    
    case 'TOGGLE_BETTING':
      return { 
        ...state, 
        isBettingOpen: action.payload,
        roundStatus: action.payload ? 'betting' : 'active'
      }
    
    case 'SET_ROUND_STATUS':
      return { ...state, roundStatus: action.payload }
    
    case 'UPDATE_LAST_RESULTS':
      return { ...state, lastResults: action.payload }
    
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'RESET_ROUND':
      return {
        ...state,
        timeLeft: GAME_CONFIG.TIMING.BETTING_DURATION,
        isBettingOpen: false,
        roundStatus: 'waiting',
        roundId: generateRoundId(),
      }
    
    default:
      return state
  }
}

// Generate unique round ID
function generateRoundId(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `${timestamp}${random}`
}

// Create context
const GameContext = createContext<GameContextType | undefined>(undefined)

// Provider component
export function GameProvider({ children, gameType }: { children: React.ReactNode; gameType: string }) {
  const [state, dispatch] = useReducer(gameReducer, {
    ...initialState,
    gameType,
    roundId: generateRoundId(),
  })

  // Start new round
  const startNewRound = useCallback(() => {
    dispatch({ type: 'RESET_ROUND' })
    dispatch({ type: 'TOGGLE_BETTING', payload: true })
  }, [])

  // Update time left
  const updateTimeLeft = useCallback(() => {
    dispatch({ type: 'UPDATE_TIME_LEFT' })
  }, [])

  // Toggle betting
  const toggleBetting = useCallback((isOpen: boolean) => {
    dispatch({ type: 'TOGGLE_BETTING', payload: isOpen })
  }, [])

  // Update connection status
  const updateConnectionStatus = useCallback((status: GameState['connectionStatus']) => {
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: status })
  }, [])

  // Set error
  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }, [])

  // Timer effect
  useEffect(() => {
    if (state.roundStatus === 'betting' && state.timeLeft > 0) {
      const timer = setInterval(updateTimeLeft, 1000)
      return () => clearInterval(timer)
    }
  }, [state.roundStatus, state.timeLeft, updateTimeLeft])

  // Auto-close betting when time runs out
  useEffect(() => {
    if (state.timeLeft === 0 && state.isBettingOpen) {
      toggleBetting(false)
      dispatch({ type: 'SET_ROUND_STATUS', payload: 'active' })
      
      // Simulate round end after some time
      setTimeout(() => {
        dispatch({ type: 'SET_ROUND_STATUS', payload: 'ended' })
        
        // Start new round after delay
        setTimeout(() => {
          startNewRound()
        }, GAME_CONFIG.TIMING.ROUND_INTERVAL * 1000)
      }, GAME_CONFIG.TIMING.RESULT_DISPLAY * 1000)
    }
  }, [state.timeLeft, state.isBettingOpen, toggleBetting, startNewRound])

  // Simulate connection
  useEffect(() => {
    const connectTimer = setTimeout(() => {
      updateConnectionStatus('connected')
    }, 2000)

    return () => clearTimeout(connectTimer)
  }, [updateConnectionStatus])

  // Simulate round start
  useEffect(() => {
    const startTimer = setTimeout(() => {
      startNewRound()
    }, 3000)

    return () => clearTimeout(startTimer)
  }, [startNewRound])

  const contextValue: GameContextType = {
    state,
    dispatch,
    startNewRound,
    updateTimeLeft,
    toggleBetting,
    updateConnectionStatus,
    setError,
  }

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  )
}

// Custom hook
export function useGame() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
