'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../lib/hooks/useAuth'

export default function Home() {
  const router = useRouter()
  const { authenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (authenticated) {
        // User is authenticated, redirect to dashboard
        router.push('/app/dashboard')
      } else {
        // User is not authenticated, redirect to login
        router.push('/login')
      }
    }
  }, [authenticated, loading, router])

  // Show loading while checking authentication
  return (
    <div className="min-h-dvh bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>
  )
} 