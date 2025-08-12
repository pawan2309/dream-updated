'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '../lib/hooks/useAuth'

export default function Header() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [liveBalance, setLiveBalance] = useState<number>(0)
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)
  const router = useRouter()
  const { user, logout, authenticated } = useAuth()

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
        setLiveBalance(data.balance || 0)
      } else {
        // Fallback to user balance from auth state
        setLiveBalance(user?.balance || 0)
      }
    } catch (error) {
      console.error('Error fetching live balance:', error)
      // Fallback to user balance from auth state
      setLiveBalance(user?.balance || 0)
    } finally {
      setIsBalanceLoading(false)
    }
  }

  // Fetch balance on component mount and user change
  useEffect(() => {
    if (user?.id) {
      fetchLiveBalance()
      // Set up interval to refresh balance every 30 seconds
      const interval = setInterval(fetchLiveBalance, 30000)
      return () => clearInterval(interval)
    }
  }, [user?.id])

  // Update balance when user changes
  useEffect(() => {
    if (user?.balance !== undefined) {
      setLiveBalance(user.balance)
    }
  }, [user?.balance])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Format balance with proper currency formatting
  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(balance)
  }

  return (
    <>
                    {/* Sidebar */}
       <div className={`fixed w-[250px] right-0 top-0 h-full bg-blue-900 transform transition-transform duration-300 z-50 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{backgroundColor: '#1e3a8a'}}>
         <div className="w-full h-screen overflow-y-auto" style={{backgroundColor: '#1e3a8a'}}>
           <div className="flex items-center justify-between mb-3 p-5">
             <div className="flex items-center gap-2">
               <div className="h-[45px] w-[150px] flex items-center justify-center text-white text-lg font-bold">
                 2XBAT
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
        <header className="p-4 top-0 flex items-center justify-between h-[60px] border-b border-gray-200" style={{backgroundColor: '#1e3a8a'}}>
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
                2XBAT
              </div>
            </Link>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs flex items-center gap-1 font-bold text-white">
              CHIPS: {formatBalance(liveBalance)}
              {isBalanceLoading && (
                <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
              )}
            </span>
            <Link href="/app/myBets" className="text-[#bdff32] text-xs font-bold">
              EXP: <span className="text-red-600">0</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
                             <div className="text-white text-xs">
                   <div className="font-bold">
                     <span className="flex flex-col items-center">
                       <span>{user?.name || 'User'}</span>
                       <span>({user?.username || 'N/A'})</span>
                     </span>
                   </div>
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