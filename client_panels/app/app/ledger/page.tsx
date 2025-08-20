'use client'

import Header from '../../../components/Header'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type LedgerEntry = {
  id: string
  matchName: string
  wonBy: string
  won: number
  lost: number
  balance: number
  date: string
}

export default function Ledger() {
  const [ledgerData, setLedgerData] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLedgerData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Replace this URL with your actual API endpoint
        const response = await fetch('/api/ledger', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch ledger data')
        }

        const data = await response.json()
        setLedgerData(data.entries || [])
      } catch (err) {
        console.error('Error fetching ledger data:', err)
        setError('Failed to load ledger data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchLedgerData()
  }, [])

  // Calculate totals
  const totalCredit = ledgerData.reduce((sum, entry) => sum + entry.won, 0)
  const totalDebit = ledgerData.reduce((sum, entry) => sum + Math.abs(entry.lost), 0)
  const totalPL = totalCredit - totalDebit

  return (
    <div className="min-h-dvh bg-white relative pt-[72px]">
      <Header />
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading ledger data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-600 text-center">{error}</p>
            </div>
          ) : (
            <div className="overflow-x-scroll">
              <table className="mt-1 w-full">
                <thead>
                  <th colSpan={7} className="text-center uppercase text-[16px] p-[2px] font-bold text-white" style={{backgroundColor: '#1e3a8a'}}>
                    My Ledger
                  </th>
                  <tr className="bg-[#4b2443] text-[12px] font-bold uppercase w-full">
                    <th className="w-[40%] text-success p-2 border border-gray-500 text-white">
                      CREDIT ({totalCredit.toLocaleString()})
                    </th>
                    <th colSpan={2} className="w-[30%] text-danger p-2 border border-gray-500 text-white">
                      DEBIT (-{totalDebit.toLocaleString()})
                    </th>
                    <th colSpan={2} className="w-[30%] text-danger p-2 border border-gray-500 text-white">
                      P/L ({totalPL.toLocaleString()})
                    </th>
                  </tr>
                  <tr style={{backgroundColor: '#1e3a8a'}} className="text-white">
                    <th className="text-[12px] w-[40%] text-center font-bold uppercase p-2 border border-gray-400">
                      Matchname
                    </th>
                    <th className="text-[12px] w-[15%] text-center font-bold uppercase p-2 border border-gray-400">
                      Won by
                    </th>
                    <th className="text-[12px] w-[15%] text-center font-bold uppercase p-2 border border-gray-400">
                      Won
                    </th>
                    <th className="text-[12px] w-[15%] text-center font-bold uppercase p-2 border border-gray-400">
                      Lost
                    </th>
                    <th className="text-[12px] w-[15%] text-center font-bold uppercase p-2 border border-gray-400">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-600">
                        No ledger entries found.
                      </td>
                    </tr>
                  ) : (
                    ledgerData.map((entry) => (
                      <tr key={entry.id} className="text-black text-center font-bold text-[12px] uppercase">
                        <td className="border border-gray-400">
                          <Link 
                            href={`/app/view-statement/${entry.id}`}
                            className="font-extrabold underline text-[#0d6efd] hover:text-blue-700"
                          >
                            {entry.matchName}
                          </Link>
                        </td>
                        <td className="border border-gray-400 p-[2px]">
                          {entry.wonBy}
                        </td>
                        <td className={`border border-gray-400 p-[2px] ${entry.won > 0 ? 'text-success' : ''}`}>
                          {entry.won > 0 ? entry.won.toLocaleString() : '0'}
                        </td>
                        <td className={`border border-gray-400 p-[2px] ${entry.lost < 0 ? 'text-danger' : ''}`}>
                          {entry.lost < 0 ? entry.lost.toLocaleString() : '0'}
                        </td>
                        <td className={`border border-gray-400 p-[2px] ${entry.balance < 0 ? 'text-danger' : 'text-success'}`}>
                          {entry.balance.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 