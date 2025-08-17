'use client'

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react'
import { GAME_CONFIG } from '../config/gameConfig'

// Types
interface BetSelection {
  id: string
  marketId: string
  marketName: string
  selectionName: string
  odds: number
  stake: number
  potentialProfit: number
}

interface BetSlipState {
  selectedBets: BetSelection[]
  totalStake: number
  totalPotentialProfit: number
  isOpen: boolean
  currentStake: string
  error: string | null
}

interface BetSlipAction {
  type: string
  payload?: any
}

interface BetSlipContextType {
  state: BetSlipState
  addBet: (bet: Omit<BetSelection, 'stake' | 'potentialProfit'>) => void
  removeBet: (betId: string) => void
  updateStake: (betId: string, stake: number) => void
  updateCurrentStake: (stake: string) => void
  clearBets: () => void
  toggleBetSlip: () => void
  placeBets: () => Promise<boolean>
  calculateProfit: (odds: number, stake: number) => number
}

// Initial state
const initialState: BetSlipState = {
  selectedBets: [],
  totalStake: 0,
  totalPotentialProfit: 0,
  isOpen: false,
  currentStake: '',
  error: null,
}

// Reducer
function betSlipReducer(state: BetSlipState, action: BetSlipAction): BetSlipState {
  switch (action.type) {
    case 'ADD_BET':
      const newBet: BetSelection = {
        ...action.payload,
        stake: parseFloat(state.currentStake) || GAME_CONFIG.BETTING.MIN_STAKE,
        potentialProfit: calculateProfit(action.payload.odds, parseFloat(state.currentStake) || GAME_CONFIG.BETTING.MIN_STAKE),
      }
      
      // Check if bet already exists
      const existingBetIndex = state.selectedBets.findIndex(bet => bet.id === newBet.id)
      if (existingBetIndex >= 0) {
        const updatedBets = [...state.selectedBets]
        updatedBets[existingBetIndex] = newBet
        return {
          ...state,
          selectedBets: updatedBets,
          totalStake: updatedBets.reduce((sum, bet) => sum + bet.stake, 0),
          totalPotentialProfit: updatedBets.reduce((sum, bet) => sum + bet.potentialProfit, 0),
        }
      }
      
      // Check max bets limit
      if (state.selectedBets.length >= GAME_CONFIG.BETTING.MAX_BETS_PER_ROUND) {
        return {
          ...state,
          error: 'Maximum bets reached for this round',
        }
      }
      
      const updatedBets = [...state.selectedBets, newBet]
      return {
        ...state,
        selectedBets: updatedBets,
        totalStake: updatedBets.reduce((sum, bet) => sum + bet.stake, 0),
        totalPotentialProfit: updatedBets.reduce((sum, bet) => sum + bet.potentialProfit, 0),
        error: null,
      }
    
    case 'REMOVE_BET':
      const filteredBets = state.selectedBets.filter(bet => bet.id !== action.payload)
      return {
        ...state,
        selectedBets: filteredBets,
        totalStake: filteredBets.reduce((sum, bet) => sum + bet.stake, 0),
        totalPotentialProfit: filteredBets.reduce((sum, bet) => sum + bet.potentialProfit, 0),
        error: null,
      }
    
    case 'UPDATE_STAKE':
      const betsWithUpdatedStake = state.selectedBets.map(bet => 
        bet.id === action.payload.betId 
          ? { 
              ...bet, 
              stake: action.payload.stake,
              potentialProfit: calculateProfit(bet.odds, action.payload.stake)
            }
          : bet
      )
      return {
        ...state,
        selectedBets: betsWithUpdatedStake,
        totalStake: betsWithUpdatedStake.reduce((sum, bet) => sum + bet.stake, 0),
        totalPotentialProfit: betsWithUpdatedStake.reduce((sum, bet) => sum + bet.potentialProfit, 0),
      }
    
    case 'UPDATE_CURRENT_STAKE':
      return { ...state, currentStake: action.payload }
    
    case 'CLEAR_BETS':
      return {
        ...state,
        selectedBets: [],
        totalStake: 0,
        totalPotentialProfit: 0,
        error: null,
      }
    
    case 'TOGGLE_BET_SLIP':
      return { ...state, isOpen: !state.isOpen }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    
    default:
      return state
  }
}

// Calculate potential profit
function calculateProfit(odds: number, stake: number): number {
  return Math.round((odds - 1) * stake * 100) / 100
}

// Create context
const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined)

// Provider component
export function BetSlipProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(betSlipReducer, initialState)

  // Add bet to slip
  const addBet = useCallback((bet: Omit<BetSelection, 'stake' | 'potentialProfit'>) => {
    dispatch({ type: 'ADD_BET', payload: bet })
  }, [])

  // Remove bet from slip
  const removeBet = useCallback((betId: string) => {
    dispatch({ type: 'REMOVE_BET', payload: betId })
  }, [])

  // Update stake for specific bet
  const updateStake = useCallback((betId: string, stake: number) => {
    if (stake < GAME_CONFIG.BETTING.MIN_STAKE) {
      dispatch({ type: 'SET_ERROR', payload: `Minimum stake is ₹${GAME_CONFIG.BETTING.MIN_STAKE}` })
      return
    }
    if (stake > GAME_CONFIG.BETTING.MAX_STAKE) {
      dispatch({ type: 'SET_ERROR', payload: `Maximum stake is ₹${GAME_CONFIG.BETTING.MAX_STAKE}` })
      return
    }
    
    dispatch({ type: 'UPDATE_STAKE', payload: { betId, stake } })
  }, [])

  // Update current stake input
  const updateCurrentStake = useCallback((stake: string) => {
    dispatch({ type: 'UPDATE_CURRENT_STAKE', payload: stake })
  }, [])

  // Clear all bets
  const clearBets = useCallback(() => {
    dispatch({ type: 'CLEAR_BETS' })
  }, [])

  // Toggle bet slip visibility
  const toggleBetSlip = useCallback(() => {
    dispatch({ type: 'TOGGLE_BET_SLIP' })
  }, [])

  // Place bets
  const placeBets = useCallback(async (): Promise<boolean> => {
    if (state.selectedBets.length === 0) {
      dispatch({ type: 'SET_ERROR', payload: 'No bets selected' })
      return false
    }

    if (state.totalStake === 0) {
      dispatch({ type: 'SET_ERROR', payload: 'Total stake must be greater than 0' })
      return false
    }

    // Here you would typically:
    // 1. Validate user balance
    // 2. Send bets to backend
    // 3. Update user balance
    // 4. Clear bet slip
    // 5. Show success message

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Clear bets on success
      dispatch({ type: 'CLEAR_BETS' })
      dispatch({ type: 'SET_ERROR', payload: null })
      
      return true
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to place bets. Please try again.' })
      return false
    }
  }, [state.selectedBets.length, state.totalStake])

  // Calculate profit for given odds and stake
  const calculateProfit = useCallback((odds: number, stake: number): number => {
    return calculateProfit(odds, stake)
  }, [])

  const contextValue: BetSlipContextType = useMemo(() => ({
    state,
    addBet,
    removeBet,
    updateStake,
    updateCurrentStake,
    clearBets,
    toggleBetSlip,
    placeBets,
    calculateProfit,
  }), [
    state,
    addBet,
    removeBet,
    updateStake,
    updateCurrentStake,
    clearBets,
    toggleBetSlip,
    placeBets,
    calculateProfit,
  ])

  return (
    <BetSlipContext.Provider value={contextValue}>
      {children}
    </BetSlipContext.Provider>
  )
}

// Custom hook
export function useBetSlip() {
  const context = useContext(BetSlipContext)
  if (context === undefined) {
    throw new Error('useBetSlip must be used within a BetSlipProvider')
  }
  return context
}
