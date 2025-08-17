'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'

// Types
interface GameState {
  streamingId: string
  roundId: string | null
  timeLeft: number
  isBettingOpen: boolean
  playerAOdds: number
  playerBOdds: number
  userBalance: number
  currentStake: string
  selectedPlayer: 'A' | 'B' | null
  lastResults: ('A' | 'B')[]
  showCards: boolean
  playerACards: string | null
  playerBCards: string | null
  winner: 'A' | 'B' | null
  loading: boolean
  error: string | null
  betPlaced: boolean
  betAmount: number | null
  betOnPlayer: 'A' | 'B' | null
}

type GameAction =
  | { type: 'SET_ROUND_ID'; payload: string }
  | { type: 'SET_TIME_LEFT'; payload: number }
  | { type: 'SET_BETTING_OPEN'; payload: boolean }
  | { type: 'SET_ODDS'; payload: { playerA: number; playerB: number } }
  | { type: 'SET_USER_BALANCE'; payload: number }
  | { type: 'SET_CURRENT_STAKE'; payload: string }
  | { type: 'SET_SELECTED_PLAYER'; payload: 'A' | 'B' | null }
  | { type: 'ADD_RESULT'; payload: 'A' | 'B' }
  | { type: 'SHOW_CARDS'; payload: { playerA: string; playerB: string; winner: 'A' | 'B' } }
  | { type: 'HIDE_CARDS' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'PLACE_BET'; payload: { amount: number; player: 'A' | 'B' } }
  | { type: 'RESET_BET' }
  | { type: 'RESET_ROUND' }

// Initial state
const initialState: GameState = {
  streamingId: '',
  roundId: null,
  timeLeft: 20,
  isBettingOpen: true,
  playerAOdds: 1.97,
  playerBOdds: 1.97,
  userBalance: 0,
  currentStake: '',
  selectedPlayer: null,
  lastResults: [],
  showCards: false,
  playerACards: null,
  playerBCards: null,
  winner: null,
  loading: false,
  error: null,
  betPlaced: false,
  betAmount: null,
  betOnPlayer: null,
}

// Reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_ROUND_ID':
      return { ...state, roundId: action.payload }
    
    case 'SET_TIME_LEFT':
      return { ...state, timeLeft: action.payload }
    
    case 'SET_BETTING_OPEN':
      return { ...state, isBettingOpen: action.payload }
    
    case 'SET_ODDS':
      return { 
        ...state, 
        playerAOdds: action.payload.playerA, 
        playerBOdds: action.payload.playerB 
      }
    
    case 'SET_USER_BALANCE':
      return { ...state, userBalance: action.payload }
    
    case 'SET_CURRENT_STAKE':
      return { ...state, currentStake: action.payload }
    
    case 'SET_SELECTED_PLAYER':
      return { ...state, selectedPlayer: action.payload }
    
    case 'ADD_RESULT':
      return { 
        ...state, 
        lastResults: [action.payload, ...state.lastResults.slice(0, 9)] 
      }
    
    case 'SHOW_CARDS':
      return {
        ...state,
        showCards: true,
        playerACards: action.payload.playerA,
        playerBCards: action.payload.playerB,
        winner: action.payload.winner,
        isBettingOpen: false,
      }
    
    case 'HIDE_CARDS':
      return {
        ...state,
        showCards: false,
        playerACards: null,
        playerBCards: null,
        winner: null,
      }
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'PLACE_BET':
      return {
        ...state,
        betPlaced: true,
        betAmount: action.payload.amount,
        betOnPlayer: action.payload.player,
        userBalance: state.userBalance - action.payload.amount,
        currentStake: '',
        selectedPlayer: null,
      }
    
    case 'RESET_BET':
      return {
        ...state,
        betPlaced: false,
        betAmount: null,
        betOnPlayer: null,
      }
    
    case 'RESET_ROUND':
      return {
        ...state,
        timeLeft: 20,
        isBettingOpen: true,
        currentStake: '',
        selectedPlayer: null,
        showCards: false,
        playerACards: null,
        playerBCards: null,
        winner: null,
      }
    
    default:
      return state
  }
}

// Context
interface GameContextType {
  gameState: GameState
  actions: {
    setRoundId: (roundId: string) => void
    setTimeLeft: (time: number) => void
    setBettingOpen: (open: boolean) => void
    setOdds: (playerA: number, playerB: number) => void
    setUserBalance: (balance: number) => void
    setCurrentStake: (stake: string) => void
    setSelectedPlayer: (player: 'A' | 'B' | null) => void
    addResult: (result: 'A' | 'B') => void
    showCards: (playerA: string, playerB: string, winner: 'A' | 'B') => void
    hideCards: () => void
    placeBet: (amount: number, player: 'A' | 'B') => void
    resetBet: () => void
         resetRound: () => void
     fetchUserBalance: () => Promise<void>
     fetchGameResult: () => Promise<void>
     fetchOdds: () => Promise<void>
  }
}

const GameContext = createContext<GameContextType | undefined>(undefined)

// Provider component
interface GameProviderProps {
  children: React.ReactNode
  streamingId: string
}

export function GameProvider({ children, streamingId }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, { ...initialState, streamingId })

  // Timer effect
  useEffect(() => {
    if (state.timeLeft > 0 && state.isBettingOpen) {
      const timer = setInterval(() => {
        dispatch({ type: 'SET_TIME_LEFT', payload: state.timeLeft - 1 })
      }, 1000)

      return () => clearInterval(timer)
    } else if (state.timeLeft === 0 && state.isBettingOpen) {
      dispatch({ type: 'SET_BETTING_OPEN', payload: false })
    }
  }, [state.timeLeft, state.isBettingOpen])

  // Auto-reset round after 5 seconds of showing cards
  useEffect(() => {
    if (state.showCards) {
      const timer = setTimeout(() => {
        dispatch({ type: 'RESET_ROUND' })
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [state.showCards])

  // Actions
  const actions = {
    setRoundId: useCallback((roundId: string) => {
      dispatch({ type: 'SET_ROUND_ID', payload: roundId })
    }, []),

    setTimeLeft: useCallback((time: number) => {
      dispatch({ type: 'SET_TIME_LEFT', payload: time })
    }, []),

    setBettingOpen: useCallback((open: boolean) => {
      dispatch({ type: 'SET_BETTING_OPEN', payload: open })
    }, []),

    setOdds: useCallback((playerA: number, playerB: number) => {
      dispatch({ type: 'SET_ODDS', payload: { playerA, playerB } })
    }, []),

    setUserBalance: useCallback((balance: number) => {
      dispatch({ type: 'SET_USER_BALANCE', payload: balance })
    }, []),

    setCurrentStake: useCallback((stake: string) => {
      dispatch({ type: 'SET_CURRENT_STAKE', payload: stake })
    }, []),

    setSelectedPlayer: useCallback((player: 'A' | 'B' | null) => {
      dispatch({ type: 'SET_SELECTED_PLAYER', payload: player })
    }, []),

    addResult: useCallback((result: 'A' | 'B') => {
      dispatch({ type: 'ADD_RESULT', payload: result })
    }, []),

    showCards: useCallback((playerA: string, playerB: string, winner: 'A' | 'B') => {
      dispatch({ type: 'SHOW_CARDS', payload: { playerA, playerB, winner } })
    }, []),

    hideCards: useCallback(() => {
      dispatch({ type: 'HIDE_CARDS' })
    }, []),

    placeBet: useCallback((amount: number, player: 'A' | 'B') => {
      dispatch({ type: 'PLACE_BET', payload: { amount, player } })
    }, []),

    resetBet: useCallback(() => {
      dispatch({ type: 'RESET_BET' })
    }, []),

         resetRound: useCallback(() => {
       dispatch({ type: 'RESET_ROUND' })
     }, []),

     fetchOdds: useCallback(async () => {
       try {
         const token = localStorage.getItem('authToken')
         if (!token) return

         const response = await fetch(`/api/user/odds`, {
           headers: {
             'Authorization': `Bearer ${token}`,
             'Content-Type': 'application/json',
           },
           credentials: 'include'
         })
         if (response.ok) {
           const data = await response.json()
           if (data.success && data.odds) {
             actions.setOdds(data.odds.playerA || 1.97, data.odds.playerB || 1.97)
           }
         }
       } catch (error) {
         console.error('Error fetching odds:', error)
       }
     }, []),

     fetchUserBalance: useCallback(async () => {
       try {
         dispatch({ type: 'SET_LOADING', payload: true })
         
         const token = localStorage.getItem('authToken')
         if (!token) {
           dispatch({ type: 'SET_ERROR', payload: 'No authentication token' })
           return
         }

         // Use frontend API for user balance (same as navbar)
         const response = await fetch(`/api/user/balance`, {
           headers: {
             'Authorization': `Bearer ${token}`,
             'Content-Type': 'application/json',
           },
           credentials: 'include'
         })
         if (response.ok) {
           const data = await response.json()
           if (data.success && data.balance !== undefined) {
             dispatch({ type: 'SET_USER_BALANCE', payload: data.balance })
           } else {
             console.error('Invalid balance response:', data)
             dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch balance' })
           }
         } else {
           console.error('Balance API error:', response.status)
           dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch balance' })
         }
       } catch (error) {
         console.error('Error fetching balance:', error)
         dispatch({ type: 'SET_ERROR', payload: 'Network error fetching balance' })
       } finally {
         dispatch({ type: 'SET_LOADING', payload: false })
       }
     }, []),

         fetchGameResult: useCallback(async () => {
       try {
         dispatch({ type: 'SET_LOADING', payload: true })
         
         const token = localStorage.getItem('authToken')
         if (!token) {
           dispatch({ type: 'SET_ERROR', payload: 'No authentication token' })
           return
         }

         // Use frontend API for casino results
         const response = await fetch(`/api/casino/result/${state.streamingId}`, {
           headers: {
             'Authorization': `Bearer ${token}`,
             'Content-Type': 'application/json',
           },
           credentials: 'include'
         })
         if (response.ok) {
           const data = await response.json()
           if (data.success && data.result) {
             const { playerA, playerB, winner } = data.result
             
             dispatch({ type: 'ADD_RESULT', payload: winner })
             dispatch({ 
               type: 'SHOW_CARDS', 
               payload: { 
                 playerA: playerA.cards.toString(), 
                 playerB: playerB.cards.toString(), 
                 winner 
               } 
             })
           } else if (data.error) {
             console.error('Casino result error:', data.error)
             dispatch({ type: 'SET_ERROR', payload: data.error })
           }
         } else {
           console.error('Casino result API error:', response.status)
           dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch game result' })
         }
       } catch (error) {
         console.error('Error fetching result:', error)
         dispatch({ type: 'SET_ERROR', payload: 'Network error fetching result' })
       } finally {
         dispatch({ type: 'SET_LOADING', payload: false })
       }
     }, [state.streamingId]),
  }

     // Fetch initial data
   useEffect(() => {
     actions.fetchUserBalance()
     actions.fetchOdds()
   }, [actions.fetchUserBalance, actions.fetchOdds])

     // Fetch real round ID from backend
     useEffect(() => {
       const fetchRoundInfo = async () => {
         try {
           const token = localStorage.getItem('authToken')
           if (!token) return

           const response = await fetch(`/api/casino/round/${state.streamingId}`, {
             headers: {
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json',
             },
             credentials: 'include'
           })
           if (response.ok) {
             const data = await response.json()
             if (data.success && data.roundId) {
               actions.setRoundId(data.roundId)
             }
           }
         } catch (error) {
           console.error('Error fetching round info:', error)
         }
       }
       
       if (state.streamingId) {
         fetchRoundInfo()
       }
     }, [state.streamingId, actions.setRoundId])

  const value: GameContextType = {
    gameState: state,
    actions,
  }

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}

// Hook
export function useGameState() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameProvider')
  }
  return context
}
