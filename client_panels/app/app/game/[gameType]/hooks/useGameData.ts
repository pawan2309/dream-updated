'use client'

import { useState, useEffect } from 'react'
import { GAME_CONFIG } from '../config/gameConfig'

interface GameData {
  id: string
  name: string
  status: string
  currentRound: {
    id: string
    status: string
    timeLeft: number
    isBettingOpen: boolean
  }
  lastResults: string[]
  statistics: {
    totalRounds: number
    totalBets: number
    averageOdds: number
  }
}

export function useGameData(gameType: string) {
  const [data, setData] = useState<GameData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!gameType) return

    const fetchGameData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Generate mock data based on game type
        const mockData: GameData = {
          id: gameType,
          name: GAME_CONFIG.GAMES[gameType as keyof typeof GAME_CONFIG.GAMES]?.displayName || gameType,
          status: 'active',
          currentRound: {
            id: `round_${Date.now()}`,
            status: 'betting',
            timeLeft: GAME_CONFIG.TIMING.BETTING_DURATION,
            isBettingOpen: true,
          },
          lastResults: generateMockResults(gameType),
          statistics: {
            totalRounds: Math.floor(Math.random() * 1000) + 100,
            totalBets: Math.floor(Math.random() * 10000) + 1000,
            averageOdds: 2.5 + Math.random() * 3,
          }
        }
        
        setData(mockData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch game data')
      } finally {
        setLoading(false)
      }
    }

    fetchGameData()
  }, [gameType])

  return { data, loading, error }
}

// Generate mock results based on game type
function generateMockResults(gameType: string): string[] {
  const resultMap: Record<string, string[]> = {
    teenpatti: ['P1', 'P2', 'P3', 'P', 'T', 'H', 'P1', 'P2', 'P3', 'P'],
    dragontiger: ['D', 'T', 'X', 'D', 'T', 'D', 'T', 'X', 'D', 'T'],
    andarbahar: ['A', 'B', 'A', 'A', 'B', 'B', 'A', 'B', 'A', 'B'],
    lucky7: ['L', 'H', '7', 'L', 'H', 'L', 'H', '7', 'L', 'H'],
    thirtytwocard: ['8', '9', '10', '11', '8', '9', '10', '11', '8', '9'],
    aaa: ['A', 'K', 'N', 'A', 'K', 'N', 'A', 'K', 'N', 'A'],
  }
  
  return resultMap[gameType] || ['P1', 'P2', 'P3', 'P', 'T', 'H', 'P1', 'P2', 'P3', 'P']
}
