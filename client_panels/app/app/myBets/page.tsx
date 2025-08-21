'use client'

import React, { useState, useEffect } from 'react';
import Header from '../../../components/Header';
import { useAuth } from '../../../lib/hooks/useAuth';
import oddsService from '../../../lib/oddsService';

interface Bet {
  id: string;
  matchId: string;
  marketId: string;
  selection: string;
  stake: number;
  odds: number;
  betType: 'back' | 'lay';
  status: 'PENDING' | 'WON' | 'LOST' | 'CANCELED';
  profitLoss?: number;
  createdAt: string;
  settledAt?: string;
  match?: {
    matchName: string;
    matchType: string;
    tournament: string;
    startTime: string;
    status: string;
  };
}

export default function MyBetsPage() {
  const { user } = useAuth();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all');


  useEffect(() => {
    if (user) {
      fetchUserBets();
    }
  }, [user]);

  const fetchUserBets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await oddsService.getUserBets();
      
      if (result.success && result.data) {
        setBets(result.data);
      } else {
        setError(result.error || 'Failed to fetch bets');
      }
    } catch (error) {
      console.error('Error fetching bets:', error);
      setError('Failed to fetch bets');
    } finally {
      setLoading(false);
    }
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WON':
        return 'bg-green-100 text-green-800';
      case 'LOST':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBetTypeColor = (betType: string) => {
    return betType === 'back' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-pink-100 text-pink-800';
  };

  const filteredBets = bets.filter(bet => {
    if (filter === 'all') return true;
    return bet.status.toLowerCase() === filter;
  });

  const totalStake = filteredBets.reduce((sum, bet) => sum + bet.stake, 0);
  const totalProfitLoss = filteredBets.reduce((sum, bet) => sum + (bet.profitLoss || 0), 0);

  if (loading) {
    return (
      <div className="min-h-dvh bg-gray-50 relative pt-[72px]">
        <Header />
        <div className="flex-1 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your bets...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh bg-gray-50 relative pt-[72px]">
        <Header />
        <div className="flex-1 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="text-red-600 text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Bets</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={fetchUserBets}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50 relative pt-[72px]">
      <Header />
      <div className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bets</h1>
            <p className="text-gray-600">Track all your betting activity and results</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bets</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredBets.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Stake</p>
                  <p className="text-2xl font-bold text-gray-900">₹{totalStake.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${totalProfitLoss >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <svg className={`w-6 h-6 ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Profit/Loss</p>
                  <p className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalProfitLoss >= 0 ? '+' : ''}₹{totalProfitLoss.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>



          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'won', 'lost'] as const).map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === filterOption
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                  <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                    {bets.filter(bet => filterOption === 'all' || bet.status.toLowerCase() === filterOption).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Bets Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {filteredBets.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bets found</h3>
                <p className="text-gray-600">
                  {filter === 'all' 
                    ? "You haven't placed any bets yet. Start betting to see them here!"
                    : `No ${filter} bets found.`
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Match
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Selection
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stake
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Odds
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Profit/Loss
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBets.map((bet) => (
                      <tr key={bet.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {bet.match?.matchName || 'Unknown Match'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {bet.match?.tournament || 'Unknown Tournament'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{bet.selection}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBetTypeColor(bet.betType)}`}>
                            {bet.betType.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{bet.stake.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {bet.odds.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bet.status)}`}>
                            {bet.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {bet.profitLoss !== undefined && bet.profitLoss !== null ? (
                            <span className={`text-sm font-medium ${bet.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {bet.profitLoss >= 0 ? '+' : ''}₹{bet.profitLoss.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(bet.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <div className="mt-8 text-center">
            <button
              onClick={fetchUserBets}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Refresh Bets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
