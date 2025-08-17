import React, { useState, useEffect } from "react";
import Layout from "../layout";
import { Table } from "../../src/components/Table";
import { Button } from "../../src/components/Button";
import { apiFetch, buildApiUrl } from "../../lib/apiClient";

interface Casino {
  eventId: string;
  name: string;
  shortName: string;
  betStatus: string;
  minStake: number;
  maxStake: number;
  lastResult?: string;
  roundId?: string;
  streamingId?: string;
  dataUrl?: string;
  resultUrl?: string;
}

const tableColumns = [
  { key: "streamingId", label: "Streaming ID", width: "100px" },
  { key: "name", label: "Casino Name", width: "150px" },
  { key: "shortName", label: "Short Name", width: "100px" },
  { key: "betStatus", label: "Bet Status", width: "100px" },
  { key: "minStake", label: "Min Stake", width: "100px" },
  { key: "maxStake", label: "Max Stake", width: "100px" },
  { key: "actions", label: "Action", width: "120px" },
];

export default function CasinoList() {
  const [casinoStatus, setCasinoStatus] = useState("all");
  const [casinos, setCasinos] = useState<Casino[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Fetch casino data
  const fetchCasinos = async (status: string = 'all', forceRefresh: boolean = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else if (casinos.length === 0) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const path = status === 'all' ? 
        (forceRefresh ? '/api/casino?refresh=true' : '/api/casino') : 
        (forceRefresh ? `/api/casino?status=${status}&refresh=true` : `/api/casino?status=${status}`);
      
      const response = await apiFetch(path);
      
      if (response.ok) {
        const data = await response.json();
        const list: Casino[] = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        setCasinos(list);
        setLastFetched(new Date());
        
        // Filter by status if needed
        if (status !== 'all') {
          filterCasinosByStatus(status);
        }
      } else {
        setError(`Failed to fetch casino data (${response.status})`);
      }
    } catch (err) {
      console.error('Error fetching casino data:', err);
      setError('Error loading casino data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter casinos by status without fetching from API
  const filterCasinosByStatus = (status: string) => {
    if (status === 'all') return;
    
    const filtered = casinos.filter(casino => casino.betStatus === status);
    setCasinos(filtered);
  };

  // Load data on component mount with auto-refresh
  useEffect(() => {
    // Auto-refresh on page load for production
    fetchCasinos('all', true); // Force refresh from backend
  }, []);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setCasinoStatus(newStatus);
    
    if (newStatus === 'all') {
      // Restore all casinos from cache
      fetchCasinos('all', true);
    } else {
      // Filter existing casinos by status
      filterCasinosByStatus(newStatus);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleViewDetails = (casino: Casino) => {
    // Navigate to casino details page
    window.location.href = `/DiamondCasino/casinoDetails/${casino.streamingId}`;
  };

  const handleManualRefresh = () => {
    fetchCasinos(casinoStatus, true);
  };

  // Prepare table data with actions
  const tableData = casinos.map((casino) => ({
    ...casino,
    actions: (
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button 
          variant="primary" 
          size="small" 
          onClick={() => handleViewDetails(casino)}
        >
          View Details
        </Button>

      </div>
    ),
  }));

  return (
    <Layout>
      <div style={{ backgroundImage: 'url("/assets/body-bg.jpg")', minHeight: "100vh" }} className="h-full w-full overflow-y-auto">
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#17445A", color: "#fff", borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 600 }}>Casino Details</span>
              <Button variant="secondary" size="medium" onClick={handleBack}>Back</Button>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <label style={{ fontWeight: 600, fontSize: 14 }}>Select Casino Status</label>
                <select
                  value={casinoStatus}
                  onChange={handleStatusChange}
                  style={{ padding: "8px 16px", borderRadius: 4, border: "1px solid #ccc", fontSize: 14, fontWeight: 500 }}
                >
                  <option value="all">All</option>
                  <option value="yes">Active</option>
                  <option value="no">Inactive</option>
                </select>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {lastFetched && (
                  <span style={{ fontSize: 12, color: "#666" }}>
                    Last updated: {lastFetched.toLocaleTimeString()}
                  </span>
                )}
                
                <Button 
                  variant="secondary" 
                  size="small" 
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                >
                  {refreshing ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            </div>

            {loading && casinos.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center' }}>
                <span>Loading fresh casino data...</span>
              </div>
            )}
            
            {refreshing && (
              <div style={{ padding: 16, textAlign: 'center' }}>
                <span>Refreshing casino data...</span>
              </div>
            )}

            {error && (
              <div style={{ padding: 16, color: 'red', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <div style={{ padding: 16 }}>
              <Table
                columns={tableColumns}
                data={tableData}
                selectable={false}
              />
              
              {!loading && !refreshing && casinos.length === 0 && (
                <div style={{ padding: 16, textAlign: 'center', color: '#666' }}>
                  <span>No casino data available.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 