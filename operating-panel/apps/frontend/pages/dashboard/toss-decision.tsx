import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../layout';

export default function TossDecision() {
  const router = useRouter();
  const { matchId, matchName } = router.query;
  const [selectedTeam, setSelectedTeam] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract team names from match name
  const teams = matchName ? (matchName as string).split(' v ') : ['Team A', 'Team B'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeam) {
      setError('Please select a team');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/decision/toss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          matchName,
          selectedTeam
        })
      });

      if (response.ok) {
        alert('Toss decision applied successfully!');
        router.push('/dashboard');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to apply toss decision');
      }
    } catch (error) {
      console.error('Error applying toss decision:', error);
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
              Toss Decision Modal
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
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Select Team :
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: '#fff'
                }}
                required
              >
                <option value="">Select Team</option>
                {teams.map((team, index) => (
                  <option key={index} value={team.trim()}>
                    {team.trim()}
                  </option>
                ))}
              </select>
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
                  background: '#059669',
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
                {loading ? 'Processing...' : 'Submit'}
              </button>
            </div>
          </form>

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