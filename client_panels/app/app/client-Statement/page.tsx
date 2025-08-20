'use client'

import Header from '../../../components/Header'
import { useEffect, useState } from 'react'

type PassbookEntry = {
  id: string
  srNo: number
  type: 'Deposit' | 'WithDraw'
  amount: number
  balance: number
  remark: string
  dateTime: string
}

export default function ClientStatement() {
  const [passbookData, setPassbookData] = useState<PassbookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPassbookData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Replace this URL with your actual API endpoint
        const response = await fetch('/api/passbook', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch passbook data')
        }

        const data = await response.json()
        setPassbookData(data.entries || [])
      } catch (err) {
        console.error('Error fetching passbook data:', err)
        setError('Failed to load passbook data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchPassbookData()
  }, [])

  return (
    <div className="min-h-dvh bg-white relative pt-[72px]">
      <Header />
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading passbook data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-600 text-center">{error}</p>
            </div>
          ) : (
            <div className="table-responsive overflow-x-scroll">
              <table className="w-full table-bordered border">
                <thead>
                  <tr>
                    <th colSpan={7} className="text-center text-[12px] uppercase text-white w-full p-2 border-gray-500" style={{backgroundColor: '#1e3a8a'}}>
                      Passbook
                    </th>
                  </tr>
                  <tr className="text-left uppercase font-bold">
                    <th className="p-2 text-[12px] text-white border border-gray-500" style={{backgroundColor: '#1e3a8a'}}>
                      Sr. No.
                    </th>
                    <th className="p-2 text-[12px] text-white border border-gray-500" style={{backgroundColor: '#1e3a8a'}}>
                      C/D
                    </th>
                    <th className="p-2 text-[12px] text-white border border-gray-500" style={{backgroundColor: '#1e3a8a'}}>
                      Amount
                    </th>
                    <th className="p-2 text-[12px] text-white border border-gray-500" style={{backgroundColor: '#1e3a8a'}}>
                      Balance
                    </th>
                    <th className="p-2 text-[12px] text-white border min-w-[125px] border-gray-500" style={{backgroundColor: '#1e3a8a'}}>
                      Remark
                    </th>
                    <th className="p-2 text-[12px] text-white border border-gray-500" style={{backgroundColor: '#1e3a8a'}}>
                      Date/Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {passbookData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-600">
                        No passbook entries found.
                      </td>
                    </tr>
                  ) : (
                    passbookData.map((entry) => (
                      <tr key={entry.id} className="text-[12px] uppercase font-bold">
                        <td className="border border-gray-500 text-black text-[12px] p-2">
                          {entry.srNo}
                        </td>
                        <td className={`border border-gray-500 text-[12px] p-2 ${
                          entry.type === 'Deposit' ? 'text-[#198754]' : 'text-[#dc3545]'
                        }`}>
                          {entry.type}
                        </td>
                        <td className={`border border-gray-500 text-[12px] p-2 ${
                          entry.type === 'Deposit' ? 'text-[#198754]' : 'text-[#dc3545]'
                        }`}>
                          {entry.amount.toLocaleString()}
                        </td>
                        <td className="border border-gray-500 text-black text-[12px] p-2" style={{color: 'rgb(64, 80, 249)'}}>
                          {entry.balance.toLocaleString()}
                        </td>
                        <td className="border border-gray-500 text-black text-[12px] p-2">
                          {entry.remark}
                        </td>
                        <td className="border border-gray-500 text-black text-[12px] p-2">
                          {entry.dateTime}
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