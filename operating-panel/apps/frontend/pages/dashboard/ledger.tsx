import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../layout';

interface LedgerData {
  matchId: string;
  ledgerDate: string;
  totalBets: number;
  totalAmount: number;
  totalWinnings: number;
  totalLosses: number;
  netProfit: number;
  transactions: Array<{
    id: number;
    userId: string;
    betType: string;
    amount: number;
    status: string;
    timestamp: string;
  }>;
}

export default function Ledger() {
  const router = useRouter();
  const { matchId, matchName } = router.query;
  const [ledgerDate, setLedgerDate] = useState('');
  const [selectedLedger, setSelectedLedger] = useState('');
  const [ledgerData, setLedgerData] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ledgerOptions = ['Select Ledger', 'Match Ledger', 'Toss Ledger', 'Fancy Ledger', 'Market Ledger'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ledgerDate || selectedLedger === 'Select Ledger') {
      setError('Please select both date and ledger type');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ledger/daywise?matchId=${matchId}&ledgerDate=${ledgerDate}`);
      
      if (response.ok) {
        const data = await response.json();
        setLedgerData(data.data);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to fetch ledger data');
      }
    } catch (error) {
      console.error('Error fetching ledger data:', error);
      setError('Error processing request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    router.push('/dashboard');
  };

  return (
    <Layout>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '8px',
          padding: '24px',
          minWidth: '400px',
          maxWidth: '500px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          position: 'relative'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '16px'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#1e293b',
              textTransform: 'uppercase'
            }}>
              Ledger Decision Modal
            </h2>
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '4px',
                borderRadius: '4px',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#374151'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Ledger Date :
                </label>
                <input
                  type="date"
                  value={ledgerDate}
                  onChange={(e) => setLedgerDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Select Ledger :
                </label>
                <select
                  value={selectedLedger}
                  onChange={(e) => setSelectedLedger(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                >
                  {ledgerOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                color: '#dc2626',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            <div style={{ textAlign: 'center' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  textTransform: 'uppercase'
                }}
              >
                {loading ? 'Loading...' : 'Submit'}
              </button>
            </div>
          </form>

          {/* Ledger Data Display */}
          {ledgerData && (
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#374151' }}>Ledger Summary</h3>
              <div style={{
                background: '#f8fafc',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                <div><strong>Total Bets:</strong> {ledgerData.totalBets}</div>
                <div><strong>Total Amount:</strong> ₹{ledgerData.totalAmount.toLocaleString()}</div>
                <div><strong>Total Winnings:</strong> ₹{ledgerData.totalWinnings.toLocaleString()}</div>
                <div><strong>Total Losses:</strong> ₹{ledgerData.totalLosses.toLocaleString()}</div>
                <div><strong>Net Profit:</strong> ₹{ledgerData.netProfit.toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* Match Info */}
          {matchName && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: '#f8fafc',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#6b7280'
            }}>
              <div><strong>Match:</strong> {matchName}</div>
              <div><strong>Match ID:</strong> {matchId}</div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 