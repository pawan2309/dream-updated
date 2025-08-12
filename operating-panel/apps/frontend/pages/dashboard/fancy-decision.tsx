import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../layout';

interface FancyItem {
  id: string;
  sno: number;
  runnerName: string;
  tcbAmount: number;
  totalBets: number;
  gameStatus: string;
  fancyType?: string;
  odds?: number;
  stake?: number;
}

export default function FancyDecision() {
  const router = useRouter();
  const { matchId, matchName } = router.query;
  const [fancyType, setFancyType] = useState('InComplete Fancy');
  const [fancyItems, setFancyItems] = useState<FancyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchDetails, setMatchDetails] = useState<any>(null);

  const fancyTypes = ['InComplete Fancy', 'Complete Fancy', 'Cancelled Fancy'];
  const statusOptions = ['Dec. Run', 'Dec. Won', 'Dec. Lost', 'Pending'];

  // Load mock data when component mounts
  useEffect(() => {
    if (matchId && typeof matchId === 'string') {
      loadMockFancyData(matchId);
    }
  }, [matchId]);

  const loadMockFancyData = async (eventId: string) => {
    setFetching(true);
    setError(null);
    
    try {
      console.log('🔍 Loading mock fancy data for match:', eventId);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock fancy data
      const mockFancyData: FancyItem[] = [
        {
          id: 'fancy_001',
          sno: 1,
          runnerName: 'FALL OF 3RD WKT ZIM 2',
          tcbAmount: 100,
          totalBets: 1,
          gameStatus: 'Pending',
          fancyType: 'InComplete Fancy'
        },
        {
          id: 'fancy_002',
          sno: 2,
          runnerName: 'FALL OF 4TH WKT ZIM 3',
          tcbAmount: 150,
          totalBets: 2,
          gameStatus: 'Dec. Run',
          fancyType: 'InComplete Fancy'
        },
        {
          id: 'fancy_003',
          sno: 3,
          runnerName: 'FALL OF 5TH WKT ZIM 4',
          tcbAmount: 200,
          totalBets: 3,
          gameStatus: 'Pending',
          fancyType: 'Complete Fancy'
        }
      ];
      
      setFancyItems(mockFancyData);
      console.log('✅ Mock fancy data loaded:', mockFancyData.length, 'items');
      
      // Mock match details
      setMatchDetails({
        eventId: eventId,
        status: 'active',
        message: 'Match details from mock data'
      });
      
    } catch (err) {
      console.error('❌ Error loading mock fancy data:', err);
      setError('Failed to load fancy data');
      setFancyItems([]);
    } finally {
      setFetching(false);
    }
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    setFancyItems(items =>
      items.map(item =>
        item.id === id ? { ...item, gameStatus: newStatus } : item
      )
    );
  };

  const handleUpdate = async (item: FancyItem) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Fancy decision updated:', {
        matchId,
        matchName,
        fancyType,
        runnerName: item.runnerName,
        gameStatus: item.gameStatus,
        fancyId: item.id
      });
      
      alert('Fancy decision updated successfully!');
    } catch (error) {
      console.error('Error updating fancy decision:', error);
      setError('Error processing request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this fancy item?')) {
      setFancyItems(items => items.filter(item => item.id !== id));
      alert('Fancy item deleted successfully!');
    }
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleRefresh = () => {
    if (matchId && typeof matchId === 'string') {
      loadMockFancyData(matchId);
    }
  };

  // Filter items based on selected fancy type
  const filteredItems = fancyItems.filter(item => 
    item.fancyType === fancyType || !fancyType || fancyType === 'All'
  );

  const incompleteCount = fancyItems.filter(item => item.fancyType === 'InComplete Fancy').length;
  const completeCount = fancyItems.filter(item => item.fancyType === 'Complete Fancy').length;
  const cancelledCount = fancyItems.filter(item => item.fancyType === 'Cancelled Fancy').length;

  return (
    <Layout>
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          background: '#1e5f7a',
          padding: '16px 24px',
          borderRadius: '8px',
          color: '#fff'
        }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            FANCY DECISION
          </h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleRefresh}
              disabled={fetching}
              style={{
                background: '#059669',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: fetching ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                opacity: fetching ? 0.6 : 1
              }}
            >
              {fetching ? 'Refreshing...' : '🔄 Refresh'}
            </button>
            <button
              onClick={handleBack}
              style={{
                background: '#6b7280',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Back
            </button>
          </div>
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          padding: '16px',
          background: '#f8fafc',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontWeight: '600', color: '#374151' }}>
              Select FancyType:
            </label>
            <select
              value={fancyType}
              onChange={(e) => setFancyType(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="All">All Fancy Types</option>
              {fancyTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <button
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            SEE ROLLBACK FANCIES
          </button>
        </div>

        {/* Summary Stats */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div style={{ color: '#059669', fontWeight: 'bold' }}>
            Total Fancy Items ({filteredItems.length})
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              fontWeight: '600'
            }}>
              NORMAL FANCY ({incompleteCount})
            </button>
            <button style={{
              background: '#059669',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              fontWeight: '600'
            }}>
              ADVANCE FANCY ({completeCount})
            </button>
            <button style={{
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              fontWeight: '600'
            }}>
              CANCEL FANCY ({cancelledCount})
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <strong>Error</strong>
            </div>
            <div style={{ marginBottom: '12px' }}>
              {error}
            </div>
          </div>
        )}

        {/* Loading State */}
        {fetching && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            fontSize: '16px',
            color: '#6b7280'
          }}>
            Loading fancy data...
          </div>
        )}

        {/* Table */}
        {!fetching && (
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '60px 2fr 1fr 1fr 1fr 200px',
              background: '#1e5f7a',
              color: '#fff',
              padding: '12px 16px',
              fontWeight: '600'
            }}>
              <div>SNO.</div>
              <div>RUNNER NAME</div>
              <div>TCB AMOUNT</div>
              <div>TOTAL BETS</div>
              <div>GAME STATUS</div>
              <div>ACTIONS</div>
            </div>

            {/* Table Body */}
            {filteredItems.length === 0 ? (
              <div style={{
                padding: '40px 16px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                No fancy items found for {fancyType}
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 2fr 1fr 1fr 1fr 200px',
                    padding: '12px 16px',
                    borderBottom: '1px solid #e5e7eb',
                    alignItems: 'center'
                  }}
                >
                  <div>{item.sno}</div>
                  <div style={{ fontWeight: '500' }}>{item.runnerName}</div>
                  <div>{item.tcbAmount}</div>
                  <div>{item.totalBets}</div>
                  <div>
                    <select
                      value={item.gameStatus}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleUpdate(item)}
                      disabled={loading}
                      style={{
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1
                      }}
                    >
                      {loading ? 'Updating...' : 'UPDATE'}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{
                        background: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              ))
            )}
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
            <div><strong>Fancy Type:</strong> {fancyType}</div>
            <div><strong>Total Items:</strong> {fancyItems.length}</div>
            {matchDetails && (
              <div><strong>Match Status:</strong> {matchDetails.status || 'Unknown'}</div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
} 