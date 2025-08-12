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
  { key: "lastResult", label: "Last Result", width: "100px" },
  { key: "roundId", label: "Round ID", width: "100px" },
  { key: "minStake", label: "Min Stake", width: "100px" },
  { key: "maxStake", label: "Max Stake", width: "100px" },
  { key: "actions", label: "Action", width: "120px" },
];

export default function CasinoList() {
  const [casinoStatus, setCasinoStatus] = useState("all");
  const [casinos, setCasinos] = useState<Casino[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch casino data
  const fetchCasinos = async (status: string = 'all') => {
    setLoading(true);
    setError(null);
    
    try {
      const path = status === 'all' ? '/provider/casino/getdata/teen20' : `/provider/casino/getdata/teen20?status=${status}`;
      // Note: Replace teen20 with the correct listing endpoint when available
      const response = await apiFetch(path);
      
      if (response.ok) {
        const data = await response.json();
        // Expect provider payload; adapt mapping if needed
        const list: Casino[] = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        setCasinos(list);
      } else {
        setError(`Failed to fetch casino data (${response.status})`);
      }
    } catch (err) {
      console.error('Error fetching casino data:', err);
      setError('Error loading casino data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchCasinos();
  }, []);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setCasinoStatus(newStatus);
    fetchCasinos(newStatus);
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleViewDetails = (casino: Casino) => {
    if (casino.roundId && casino.roundId !== 'N/A') {
      window.open(buildApiUrl(`/provider/casino/getdetailresult/${casino.roundId}`), '_blank');
    } else {
      alert('No round ID available for this casino');
    }
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
          disabled={!casino.roundId || casino.roundId === 'N/A'}
        >
          View Details
        </Button>
        <Button 
          variant="secondary" 
          size="small" 
          onClick={() => window.open(buildApiUrl('/provider/casino/getdata/teen20'), '_blank')}
        >
          Live Data
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
            
            <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 16 }}>
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

            {loading && (
              <div style={{ padding: 16, textAlign: 'center' }}>
                <span>Loading casino data from external APIs...</span>
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
                emptyMessage={loading ? "Loading..." : "No casino data available. Apply filters to load data."}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 