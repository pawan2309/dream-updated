import React, { useState } from 'react';
import { useRouter } from 'next/router';

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: any;
  onDecision: (decision: string) => void;
}

export const DecisionModal: React.FC<DecisionModalProps> = ({
  isOpen,
  onClose,
  match,
  onDecision
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  const decisions = [
    { label: 'MARKET DECISION', color: '#dc2626', type: 'market' },
    { label: 'MATCH DECISION', color: '#1e5f7a', type: 'match' },
    { label: 'TOSS DECISION', color: '#059669', type: 'toss' },
    { label: 'FANCY DEC.', color: '#2563eb', type: 'fancy' },
    { label: 'DAY WISE LEDGER', color: '#2563eb', type: 'ledger' }
  ];

  const handleDecision = async (decisionType: string) => {
    setLoading(decisionType);
    
    try {
      switch (decisionType) {
        case 'market':
          // Show confirmation modal for market decision
          if (confirm('Are You Sure To Decision The Market?')) {
            const response = await fetch('/api/decision/market', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ matchId: match.matchId, matchName: match.matchName })
            });
            if (response.ok) {
              alert('Market decision applied successfully!');
              onDecision('market');
            }
          }
          break;
          
        case 'match':
          // Navigate to match decision page
          router.push(`/match-decision?matchId=${match.matchId}&matchName=${encodeURIComponent(match.matchName)}`);
          break;
          
        case 'toss':
          // Navigate to toss decision page
          router.push(`/toss-decision?matchId=${match.matchId}&matchName=${encodeURIComponent(match.matchName)}`);
          break;
          
        case 'fancy':
          // Navigate to fancy decision page
          router.push(`/fancy-decision?matchId=${match.matchId}&matchName=${encodeURIComponent(match.matchName)}`);
          break;
          
        case 'ledger':
          // Navigate to ledger page
          router.push(`/ledger?matchId=${match.matchId}&matchName=${encodeURIComponent(match.matchName)}`);
          break;
      }
    } catch (error) {
      console.error('Error handling decision:', error);
      alert('Error processing decision. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
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
            {match?.matchName || 'MATCH DECISION'}
          </h2>
          <button
            onClick={onClose}
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

        {/* Decision Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '16px'
        }}>
          {decisions.slice(0, 4).map((decision, index) => (
            <button
              key={index}
              onClick={() => handleDecision(decision.type)}
              disabled={loading === decision.type}
              style={{
                background: decision.color,
                color: '#fff',
                border: 'none',
                padding: '12px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading === decision.type ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s ease',
                textTransform: 'uppercase',
                opacity: loading === decision.type ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (loading !== decision.type) {
                  e.currentTarget.style.opacity = '0.8';
                }
              }}
              onMouseLeave={(e) => {
                if (loading !== decision.type) {
                  e.currentTarget.style.opacity = '1';
                }
              }}
            >
              {loading === decision.type ? 'Loading...' : decision.label}
            </button>
          ))}
        </div>

        {/* Bottom Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px'
        }}>
          {decisions.slice(4).map((decision, index) => (
            <button
              key={index}
              onClick={() => handleDecision(decision.type)}
              disabled={loading === decision.type}
              style={{
                background: decision.color,
                color: '#fff',
                border: 'none',
                padding: '12px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading === decision.type ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s ease',
                textTransform: 'uppercase',
                opacity: loading === decision.type ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (loading !== decision.type) {
                  e.currentTarget.style.opacity = '0.8';
                }
              }}
              onMouseLeave={(e) => {
                if (loading !== decision.type) {
                  e.currentTarget.style.opacity = '1';
                }
              }}
            >
              {loading === decision.type ? 'Loading...' : decision.label}
            </button>
          ))}
        </div>

        {/* Match Info */}
        {match && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#f8fafc',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            <div><strong>Match ID:</strong> {match.matchId}</div>
            <div><strong>Tournament:</strong> {match.tournament}</div>
            <div><strong>Date:</strong> {match.date} {match.time}</div>
            <div><strong>Status:</strong> {match.status}</div>
          </div>
        )}
      </div>
    </div>
  );
}; 