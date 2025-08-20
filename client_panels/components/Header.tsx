'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '../lib/hooks/useAuth'

export default function Header() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [liveBalance, setLiveBalance] = useState<number>(0)
  const [exposure, setExposure] = useState<number>(0)
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)
  const router = useRouter()
  const { user, logout, authenticated } = useAuth()
  const dropdownRef = useRef<HTMLDivElement>(null)


  // Debug logging to see what data we're getting
  useEffect(() => {
    console.log('🔍 Header component received user data:', {
      user,
      authenticated,
      userName: user?.name,
      userUsername: user?.username,
      userCode: user?.code,
      userCreditLimit: user?.creditLimit,
      userExposure: user?.exposure,
      hasName: !!user?.name,
      hasUsername: !!user?.username,
      hasCode: !!user?.code,
      hasCreditLimit: !!user?.creditLimit,
      hasExposure: !!user?.exposure,
      dataTypes: {
        creditLimit: typeof user?.creditLimit,
        exposure: typeof user?.exposure
      }
    });
  }, [user, authenticated]);

  // Function to fetch live balance
  const fetchLiveBalance = async () => {
    try {
      setIsBalanceLoading(true)
      const token = localStorage.getItem('authToken')
      if (!token || !user?.id) return

      const response = await fetch(`/api/user/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setLiveBalance(data.balance || 0)
        } else {
          // Fallback to user credit limit from auth state
          setLiveBalance(user?.creditLimit || 0)
        }
      } else {
        // Fallback to user credit limit from auth state
        setLiveBalance(user?.creditLimit || 0)
      }
    } catch (error) {
      console.error('Error fetching live balance:', error)
      // Fallback to user credit limit from auth state
      setLiveBalance(user?.creditLimit || 0)
    } finally {
      setIsBalanceLoading(false)
    }
  }

  // Function to fetch exposure from betting calculations
  const fetchExposure = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token || !user?.id) return

      // Fetch current exposure from betting system
      const response = await fetch(`/api/user/exposure`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setExposure(data.exposure || 0)
        } else {
          // Fallback to user exposure from auth state
          setExposure(user?.exposure || 0)
        }
      } else {
        // Fallback to user exposure from auth state
        setExposure(user?.exposure || 0)
      }
    } catch (error) {
      console.error('Error fetching exposure:', error)
      // Fallback to user exposure from auth state
      setExposure(user?.exposure || 0)
    }
  }

  // Fetch data on component mount and user change
  useEffect(() => {
    if (user?.id && authenticated) {
      fetchLiveBalance()
      fetchExposure()
      
      // Set up intervals for real-time updates
      const balanceInterval = setInterval(fetchLiveBalance, 3000) // Every 3 seconds
      const exposureInterval = setInterval(fetchExposure, 3000)   // Every 3 seconds
      
      return () => {
        clearInterval(balanceInterval)
        clearInterval(exposureInterval)
      }
    }
  }, [user?.id, authenticated])

  // Update balance when user changes
  useEffect(() => {
    if (user?.creditLimit !== undefined) {
      setLiveBalance(user.creditLimit)
    }
  }, [user?.creditLimit])

  // Update exposure when user changes
  useEffect(() => {
    if (user?.exposure !== undefined) {
      setExposure(user.exposure)
    }
  }, [user?.exposure])



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleChangePassword = () => {
    setIsDropdownOpen(false)
    router.push('/app/change-password')
  }

  // Format balance with proper currency formatting
  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(balance)
  }

  // Format exposure and limit with proper currency formatting
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Show loading state if user is not authenticated yet
  if (!authenticated && user === null) {
    return (
      <header className="p-4 top-0 flex items-center justify-between h-[60px] border-b border-gray-200" style={{backgroundColor: '#1e3a8a'}}>
        <div className="flex items-center gap-3">
          <div className="text-white text-lg font-bold">3XBAT</div>
        </div>
        <div className="flex items-center gap-4 text-white">
          <div className="animate-pulse">Loading...</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-white">Please login</div>
        </div>
      </header>
    )
  }

  
  return (
    <>
      {/* Sidebar */}
      <div className={`fixed w-[250px] right-0 top-0 h-full bg-blue-900 transform transition-transform duration-300 z-50 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{backgroundColor: '#1e3a8a'}}>
        <div className="w-full h-screen overflow-y-auto" style={{backgroundColor: '#1e3a8a'}}>
          <div className="flex items-center justify-between mb-3 p-5">
            <div className="flex items-center gap-2">
              <div className="h-[45px] w-[150px] flex items-center justify-center text-white text-lg font-bold">
                3XBAT
              </div>
            </div>
            <button 
              className="text-white p-0 rounded bg-transparent"
              onClick={toggleSidebar}
            >
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="24" width="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M405 136.798L375.202 107 256 226.202 136.798 107 107 136.798 226.202 256 107 375.202 136.798 405 256 285.798 375.202 405 405 375.202 285.798 256z"></path>
              </svg>
            </button>
          </div>
          <nav className="flex flex-col">
            <Link href="/app/dashboard" className="w-full text-left text-white bg-transparent py-2 px-4 rounded hover:bg-blue-800">
              HOME
            </Link>
            <Link href="/app/edit-stack" className="w-full text-left text-white bg-transparent py-2 px-4 rounded hover:bg-blue-800">
              EDIT STACK
            </Link>
            <Link href="/app/inplay" className="w-full text-left text-white bg-transparent py-2 px-4 rounded hover:bg-blue-800">
              SPORTS
            </Link>
            <Link href="/app/casino" className="w-full text-left text-white bg-transparent py-2 px-4 rounded hover:bg-blue-800">
              CASINO
            </Link>
            <Link href="/app/client-Statement" className="w-full text-left text-white bg-transparent py-2 px-4 rounded hover:bg-blue-800">
              PASSBOOK
            </Link>
            <Link href="/app/ledger" className="w-full text-left text-white bg-transparent py-2 px-4 rounded hover:bg-blue-800">
              LEDGER
            </Link>
            <Link href="/app/myBets" className="w-full text-left text-white bg-transparent py-2 px-4 rounded hover:bg-blue-800">
              UNSETTLED BETS LIST
            </Link>
            <Link href="/app/change-password" className="w-full text-left text-white bg-transparent py-2 px-4 rounded hover:bg-blue-800">
              PASSWORDS
            </Link>
            <Link href="/app/rules" className="w-full text-left text-white bg-transparent py-2 px-4 rounded hover:bg-blue-800">
              RULES
            </Link>
            <button 
              onClick={handleLogout}
              className="w-full text-left text-white bg-transparent py-2 px-4 rounded hover:bg-blue-800"
            >
              LOGOUT
            </button>
          </nav>
        </div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between h-[60px] border-b border-gray-200" style={{backgroundColor: '#1e3a8a'}}>
        {/* Left Section - Logo and Menu */}
        <div className="flex items-center gap-3">
          <div 
            className="text-white rounded hover:bg-blue-800 p-1 cursor-pointer"
            onClick={toggleSidebar}
          >
            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="24" width="24" xmlns="http://www.w3.org/2000/svg">
              <path fill="none" d="M0 0h24v24H0z"></path>
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
            </svg>
          </div>
          <Link href="/app/dashboard" className="flex items-center gap-2">
            <div className="text-white text-lg font-bold">
              3XBAT
            </div>
          </Link>
        </div>

        {/* Center Section - Credit Limit above, Exposure below */}
        <div className="flex flex-col items-center text-white">
          <div className="text-center mb-1">
            <span className="text-xs font-bold text-white">Credit Limit: </span>
            <span className="text-sm font-bold text-green-400">
              {formatCurrency(user?.creditLimit || 0)}
            </span>
          </div>
          <div className="text-center">
            <span className="text-xs font-bold text-white">Exposure: </span>
            <span className="text-sm font-bold text-red-400">
              {formatCurrency(exposure)}
            </span>
          </div>
        </div>

        {/* Right Section - User Info and Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="text-white text-xs font-bold hover:bg-blue-800 rounded px-3 py-2 transition-colors duration-200 flex items-center gap-2"
            >
              <span className="flex flex-col items-center">
                <span className="font-semibold">{user?.name || user?.username || 'User'}</span>
                <span className="text-xs opacity-80">({user?.code || user?.username || 'N/A'})</span>
              </span>
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Actions Section */}
                <div className="py-1">
                  <button
                    onClick={handleChangePassword}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 0 1121 9z" />
                    </svg>
                    Change Password
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-150 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          <button 
            className="text-white p-1 rounded hover:bg-blue-800"
            onClick={toggleSidebar}
          >
            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M405 136.798L375.202 107 256 226.202 136.798 107 107 136.798 226.202 256 107 375.202 136.798 405 256 285.798 375.202 405 405 375.202 285.798 256z"></path>
            </svg>
          </button>
        </div>
      </header>
    </>
  )
} 