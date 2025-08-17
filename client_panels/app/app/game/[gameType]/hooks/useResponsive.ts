'use client'

import { useState, useEffect } from 'react'

interface ResponsiveState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  screenWidth: number
  screenHeight: number
}

export function useResponsive(): ResponsiveState {
  const [responsiveState, setResponsiveState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    screenWidth: 0,
    screenHeight: 0,
  })

  useEffect(() => {
    const updateResponsiveState = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setResponsiveState({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        screenWidth: width,
        screenHeight: height,
      })
    }

    // Initial update
    updateResponsiveState()

    // Add event listener
    window.addEventListener('resize', updateResponsiveState)

    // Cleanup
    return () => window.removeEventListener('resize', updateResponsiveState)
  }, [])

  return responsiveState
}
