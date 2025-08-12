import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../layout";
import { Table } from "../../src/components/Table";
import { Button } from "../../src/components/Button";
import { DecisionModal } from "../../src/components/DecisionModal";
import { Toast } from "../../src/components/Toast";
import { useUser } from "../../lib/hooks/useUser";
import { apiFetch, buildApiUrl } from "../../lib/apiClient";

interface Match {
  id: string;
  matchId: string;
  matchName: string;
  tournament: string;
  date: string;
  time: string;
  sport: string;
  status: string;
  externalId: string;
  gameId: string;
  title: string;
  isLive: boolean;
  section?: any[];
}

const getTableColumns = (isMobile: boolean) => [
  { key: "checkbox", label: "", width: isMobile ? "40px" : "50px" },
  { key: "srNo", label: "Sr no.", width: isMobile ? "60px" : "80px" },
  { key: "matchId", label: "Match Id", width: isMobile ? "100px" : "150px" },
  { key: "matchName", label: "Match Name", width: isMobile ? "200px" : "400px" },
  { key: "actions", label: "Actions", width: isMobile ? "300px" : "600px" }
];

export default function Dashboard() {
  const { user, loading: userLoading, isAdmin } = useUser();
  const router = useRouter();
  
  // All useState hooks must be called before any conditional returns to avoid React hooks error
  const [selectedMatchType, setSelectedMatchType] = useState("INPLAY");
  const [selectedMatches, setSelectedMatches] = useState<string[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({ message: '', type: 'info', isVisible: false });

  // Filter matches based on selected match type
  const filterMatches = (matches: Match[], matchType: string): Match[] => {
    const currentTime = new Date();
    
    switch (matchType) {
      case "INPLAY":
        return matches.filter(match => {
          if (match.isLive === true) return true;
          const matchDateTime = new Date(`${match.date} ${match.time}`);
          const timeDiff = matchDateTime.getTime() - currentTime.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          const hasStarted = matchDateTime <= currentTime;
          const isWithinLiveWindow = hasStarted && hoursDiff >= -8;
          const isStartingSoon = hoursDiff >= -1 && hoursDiff <= 0;
          return isWithinLiveWindow || isStartingSoon;
        });
      case "UPCOMING":
        return matches.filter(match => {
          const matchDateTime = new Date(`${match.date} ${match.time}`);
          return matchDateTime > currentTime;
        });
      case "COMPLETED":
        return matches.filter(match => {
          const matchDateTime = new Date(`${match.date} ${match.time}`);
          const timeDiff = matchDateTime.getTime() - currentTime.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          return hoursDiff < -8;
        });
      default:
        return matches;
    }
  };

  function toDateParts(rawDate: string | number | Date | undefined) {
    if (!rawDate) {
      const now = new Date();
      return { date: now.toLocaleDateString(), time: now.toLocaleTimeString() };
    }
    const d = new Date(rawDate);
    return { date: d.toLocaleDateString(), time: d.toLocaleTimeString() };
  }

  function normalizeRawMatch(raw: any): Match | null {
    try {
      const id = String(
        raw?.id ?? raw?.matchId ?? raw?.eventId ?? raw?._id ?? ''
      );
      if (!id) return null;

      const name = raw?.name ?? raw?.matchName ?? raw?.ename ?? `${raw?.team1 ?? raw?.teamA ?? ''} vs ${raw?.team2 ?? raw?.teamB ?? ''}`.trim();
      const tournament = raw?.tournament ?? raw?.series ?? raw?.league ?? raw?.cname ?? 'Cricket';
      const status = raw?.status ?? (raw?.inPlay ? 'Live' : 'Upcoming');
      const { date, time } = toDateParts(raw?.start_time ?? raw?.startTime ?? raw?.startDate ?? raw?.edate ?? Date.now());

      return {
        id,
        matchId: id,
        matchName: name || 'Match',
        tournament,
        date,
        time,
        sport: 'Cricket',
        status,
        externalId: id,
        gameId: id,
        title: name || 'Match',
        isLive: Boolean(raw?.inPlay || raw?.isLive || raw?.status === 1 || status?.toLowerCase() === 'live')
      };
    } catch {
      return null;
    }
  }

  // Load real matches from provider via AWS proxy
  const loadRealMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Loading real cricket matches from AWS directly');
      const ngrokUrl = process.env.NEXT_PUBLIC_API_BASE || 'https://f572e62280f9.ngrok-free.app';
      console.log('🔍 Using URL:', `${ngrokUrl}/provider/cricketmatches`);
      
      const response = await fetch(`${ngrokUrl}/provider/cricketmatches`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
      });
      
      console.log('🔍 Response received:', response.status, response.statusText);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const maybeText = await response.text().catch(() => '');
        throw new Error(`AWS API error ${response.status}${maybeText ? `: ${maybeText.slice(0,160)}` : ''}`);
      }
      
      // Log the raw response text first
      const rawText = await response.text();
      console.log('🔍 Raw response text (first 500 chars):', rawText.substring(0, 500));
      
      let payload: any;
      try {
        payload = JSON.parse(rawText);
        console.log('🔍 Parsed JSON payload:', payload);
      } catch (parseError) {
        console.error('🔍 JSON parse error:', parseError);
        console.error('🔍 Raw text that failed to parse:', rawText);
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }
      
      const list: any[] =
        Array.isArray(payload)                  ? payload :
        Array.isArray(payload?.data)            ? payload.data :
        Array.isArray(payload?.matches)         ? payload.matches :
        Array.isArray(payload?.data?.matches)   ? payload.data.matches :
        Array.isArray(payload?.t1)              ? payload.t1 :
        [];
      
      console.log('🔍 Extracted list:', list);
      
      const normalized: Match[] = [];
      for (const raw of list) {
        const m = normalizeRawMatch(raw);
        if (m) normalized.push(m);
      }
      setAllMatches(normalized);
      setMatches(filterMatches(normalized, selectedMatchType));
      console.log('✅ Real cricket matches loaded from AWS:', normalized.length, 'matches');
    } catch (err: any) {
      console.error('Failed to load real matches from AWS:', err);
      setError(err?.message || 'Failed to load cricket matches from AWS');
      setAllMatches([]);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch matches when component mounts or match type changes
  useEffect(() => {
    loadRealMatches();
  }, [selectedMatchType]);

  // Handle window resize for mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show toast message
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
  };

  // Handle match selection
  const handleMatchSelection = (matchId: string, checked: boolean) => {
    if (checked) {
      setSelectedMatches(prev => [...prev, matchId]);
    } else {
      setSelectedMatches(prev => prev.filter(id => id !== matchId));
    }
  };

  // Handle select all matches
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMatches(matches.map(match => match.id));
    } else {
      setSelectedMatches([]);
    }
  };

  // Handle save inplay match (no-op demo)
  const handleSaveInplayMatch = async () => {
    if (selectedMatches.length === 0) {
      showToast('Please select at least one match', 'error');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log('✅ Inplay matches saved:', selectedMatches);
      showToast(`${selectedMatches.length} match(es) saved as inplay`, 'success');
      setSelectedMatches([]);
    } catch (error) {
      console.error('Error saving inplay matches:', error);
      showToast('Failed to save inplay matches', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle match actions
  const handleAction = async (action: string, matchId: string) => {
    const match = allMatches.find(m => m.id === matchId);
    if (!match) return;

    setSelectedMatch(match);
    setDecisionModalOpen(true);
  };

  // Handle decision modal close
  const handleDecisionModalClose = () => {
    setDecisionModalOpen(false);
    setSelectedMatch(null);
  };

  // Handle decision submission
  const handleDecisionSubmit = async (decision: string) => {
    if (!selectedMatch) return;

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log('✅ Decision submitted:', {
        matchId: selectedMatch.id,
        decision: decision
      });
      showToast(`Decision submitted for ${selectedMatch.matchName}`, 'success');
      handleDecisionModalClose();
    } catch (error) {
      console.error('Error submitting decision:', error);
      showToast('Failed to submit decision', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Transform matches for table display
  const tableData = matches.map((match, index) => ({
    checkbox: (
      <input
        type="checkbox"
        checked={selectedMatches.includes(match.id)}
        onChange={(e) => handleMatchSelection(match.id, e.target.checked)}
        style={{ width: '16px', height: '16px' }}
      />
    ),
    srNo: index + 1,
    matchId: match.matchId,
    matchName: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontWeight: '600', color: '#1f2937' }}>
          {match.matchName}
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          {match.tournament} • {match.sport}
        </div>
        <div style={{ fontSize: '11px', color: '#9ca3af' }}>
          {match.date} at {match.time}
        </div>
      </div>
    ),
    actions: (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Button
          onClick={() => handleAction('match', match.id)}
          disabled={loading}
          style={{ fontSize: '12px', padding: '4px 8px' }}
        >
          Match Decision
        </Button>
        <Button
          onClick={() => handleAction('fancy', match.id)}
          disabled={loading}
          style={{ fontSize: '12px', padding: '4px 8px' }}
        >
          Fancy Decision
        </Button>
        <Button
          onClick={() => handleAction('toss', match.id)}
          disabled={loading}
          style={{ fontSize: '12px', padding: '4px 8px' }}
        >
          Toss Decision
        </Button>
      </div>
    )
  }));

  // Show loading state while user data is loading
  if (userLoading) {
    return (
      <Layout>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          fontSize: '18px',
          color: '#6b7280'
        }}>
          Loading user data...
        </div>
      </Layout>
    );
  }

  // Show unauthorized message if user is not admin
  if (!isAdmin) {
    return (
      <Layout>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          fontSize: '18px',
          color: '#dc2626'
        }}>
          Access denied. Admin privileges required.
        </div>
      </Layout>
    );
  }

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
            DASHBOARD
          </h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={loadRealMatches}
              disabled={loading}
              style={{
                background: '#059669',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Loading...' : '🔄 Refresh'}
            </button>
          </div>
        </div>

        {/* Match Type Filter */}
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
              Match Type:
            </label>
            <select
              value={selectedMatchType}
              onChange={(e) => setSelectedMatchType(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="INPLAY">Inplay</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <button
            onClick={handleSaveInplayMatch}
            disabled={loading || selectedMatches.length === 0}
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: (loading || selectedMatches.length === 0) ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              opacity: (loading || selectedMatches.length === 0) ? 0.6 : 1
            }}
          >
            {loading ? 'Saving...' : `Save Inplay (${selectedMatches.length})`}
          </button>
        </div>

        {/* Error Display */}
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
            <div>{error}</div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            fontSize: '16px',
            color: '#6b7280'
          }}>
            Loading matches...
          </div>
        )}

        {/* Matches Table */}
        {!loading && (
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <Table
              columns={getTableColumns(isMobile)}
              data={tableData}
              selectable={true}
              selectedIds={selectedMatches}
              onSelectionChange={setSelectedMatches}
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && matches.length === 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            fontSize: '16px',
            color: '#6b7280'
          }}>
            No {selectedMatchType.toLowerCase()} matches found
          </div>
        )}

        {/* Decision Modal */}
        {decisionModalOpen && selectedMatch && (
          <DecisionModal
            isOpen={decisionModalOpen}
            onClose={handleDecisionModalClose}
            onDecision={handleDecisionSubmit}
            match={selectedMatch}
          />
        )}

        {/* Toast */}
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
        />
      </div>
    </Layout>
  );
} 