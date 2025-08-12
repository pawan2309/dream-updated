import React, { useState } from "react";
import Layout from "../layout";
import { Button } from "../../src/components/Button";

interface UndeclareBet {
  id: string;
  date: string;
  client: string;
  market: string;
  roundId: string;
  player: string;
  winner: string;
  stack: number;
  profit: number;
  loss: number;
  pnl: number;
}

export default function UndeclareBetList() {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    casinoName: "",
    showList: "10"
  });
  const [selectedBets, setSelectedBets] = useState<string[]>([]);
  const [betData, setBetData] = useState<UndeclareBet[]>([]); // No hardcoded data

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleApply = () => {
    // TODO: Fetch undeclared bet data from API based on filters
    console.log("Applying filters:", filters);
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedBets(betData.map(bet => bet.id));
    } else {
      setSelectedBets([]);
    }
  };

  const handleSelectBet = (betId: string, checked: boolean) => {
    if (checked) {
      setSelectedBets([...selectedBets, betId]);
    } else {
      setSelectedBets(selectedBets.filter(id => id !== betId));
    }
  };

  const totalPnl = betData.reduce((sum, bet) => sum + bet.pnl, 0);

  return (
    <Layout>
      <div style={{ backgroundImage: 'url("/assets/body-bg.jpg")', minHeight: "100vh" }} className="h-full w-full overflow-y-auto">
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginTop: 24 }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#17445A", color: "#fff", borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 600 }}>All Bets</span>
              <Button variant="secondary" size="medium" onClick={handleBack}>Back</Button>
        </div>

            {/* Filters */}
            <div style={{ padding: 16 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#000" }}>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    style={{ padding: "6px 8px", fontSize: 12, border: "1px solid #ccc", borderRadius: 2, width: 180 }}
                  />
          </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#000" }}>End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    style={{ padding: "6px 8px", fontSize: 12, border: "1px solid #ccc", borderRadius: 2, width: 180 }}
                  />
          </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#000" }}>Select Casino Name</label>
                  <select
                    name="casinoName"
                    value={filters.casinoName}
                    onChange={handleFilterChange}
                    style={{ padding: "6px 8px", fontSize: 12, border: "1px solid #ccc", borderRadius: 2, width: "100%" }}
                  >
                    <option value="">Select Casino Name</option>
                    {/* TODO: Populate with casino names from API */}
            </select>
          </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#000" }}>Show list</label>
                  <select
                    name="showList"
                    value={filters.showList}
                    onChange={handleFilterChange}
                    style={{ padding: "6px 8px", fontSize: 12, border: "1px solid #ccc", borderRadius: 2, width: 180 }}
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="30">30</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
            </select>
          </div>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <Button variant="danger" size="small" onClick={handleApply}>Apply</Button>
          </div>
        </div>

              {/* Table */}
              <div style={{ background: "#fff", overflow: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
                    <tr style={{ background: "#17445A", color: "#fff", fontSize: 14, fontWeight: 600 }}>
                      <th style={{ padding: "8px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={selectedBets.length === betData.length && betData.length > 0}
                          onChange={handleSelectAll}
                          style={{ width: 16, height: 16 }}
                        />
                      </th>
                      <th style={{ padding: "8px", textAlign: "center" }}>Date</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>Client</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>Market</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>RoundId</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>Player</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>Winner</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>Stack</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>Profit</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>Loss</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>pnl</th>
              </tr>
            </thead>
            <tbody>
                    {betData.length === 0 ? (
                      <tr>
                        <td colSpan={11} style={{ textAlign: "center", padding: "48px", color: "#6b7280" }}>
                          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No undeclared bet data available</div>
                          <div style={{ fontSize: 14 }}>Apply filters to load data or check your connection</div>
                        </td>
                      </tr>
                    ) : (
                      betData.map((bet) => (
                        <tr key={bet.id} style={{ background: "#fff", fontSize: 14 }}>
                          <td style={{ padding: "8px", textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={selectedBets.includes(bet.id)}
                              onChange={(e) => handleSelectBet(bet.id, e.target.checked)}
                              style={{ width: 16, height: 16 }}
                            />
                          </td>
                          <td style={{ padding: "8px", textAlign: "center", whiteSpace: "nowrap" }}>{bet.date}</td>
                          <td style={{ padding: "8px", textAlign: "center", fontWeight: 600 }}>{bet.client}</td>
                          <td style={{ padding: "8px", textAlign: "center", whiteSpace: "nowrap" }}>{bet.market}</td>
                          <td style={{ padding: "8px", textAlign: "center", whiteSpace: "nowrap" }}>{bet.roundId}</td>
                          <td style={{ padding: "8px", textAlign: "center", whiteSpace: "nowrap" }}>{bet.player}</td>
                          <td style={{ padding: "8px", textAlign: "center", whiteSpace: "nowrap" }}>{bet.winner}</td>
                          <td style={{ padding: "8px", textAlign: "center", whiteSpace: "nowrap" }}>{bet.stack}</td>
                          <td style={{ padding: "8px", textAlign: "center", whiteSpace: "nowrap" }}>{bet.profit}</td>
                          <td style={{ padding: "8px", textAlign: "center", whiteSpace: "nowrap" }}>{bet.loss}</td>
                          <td style={{ padding: "8px", textAlign: "center", whiteSpace: "nowrap", fontWeight: 700 }}>{bet.pnl}</td>
                        </tr>
                      ))
                    )}
                    {betData.length > 0 && (
                      <tr style={{ fontWeight: 600, fontSize: 16, color: "#000" }}>
                        <td colSpan={10} style={{ padding: "8px", textAlign: "center" }}>Total</td>
                        <td style={{ padding: "8px", textAlign: "center" }}>{totalPnl}</td>
                </tr>
                    )}
            </tbody>
          </table>
        </div>

              {/* Pagination */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                <div style={{ display: "flex", gap: 4 }}>
                  <button style={{ padding: "4px 8px", border: "1px solid #ccc", background: "#fff", cursor: "pointer", borderRadius: 4 }} disabled>
                    ‹
                  </button>
                  <button style={{ padding: "4px 8px", border: "1px solid #ccc", background: "#17445A", color: "#fff", cursor: "pointer", borderRadius: 4 }}>
                    1
                  </button>
                  <button style={{ padding: "4px 8px", border: "1px solid #ccc", background: "#fff", cursor: "pointer", borderRadius: 4 }}>
                    ›
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 