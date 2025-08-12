import React, { useState } from "react";
import Layout from "./layout";
import { Button } from "../src/components/Button";

interface BetData {
  id: string;
  srNo: number;
  odds: string;
  oddsType: string;
  amount: number;
  type: string;
  marketId: string;
  team: string;
  client: string;
  date: string;
  loss: number;
  profit: number;
  ip: string;
}

export default function UndeclareMatchBetList() {
  const [filters, setFilters] = useState({
    marketId: "",
    username: "",
    showList: "10"
  });

  const [betData, setBetData] = useState<BetData[]>([]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    console.log("Applying filters:", filters);
    // TODO: Fetch data from API based on filters
  };

  const handleBack = () => {
    console.log("Going back");
    // TODO: Navigate back
  };

  const totalOddsBets = betData.length;
  const totalFancyBets = 0; // This would come from API

  return (
    <Layout>
      <div style={{ 
        background: "#fff", 
        borderRadius: "8px", 
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        margin: "16px"
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          background: "#17445A",
          color: "#fff",
          borderTopLeftRadius: "8px",
          borderTopRightRadius: "8px"
        }}>
          <span style={{ fontSize: "20px", fontWeight: "600" }}>
          All Undeclare Bet List
          </span>
          <Button
            variant="secondary"
            size="medium"
            onClick={handleBack}
          >
            Back
          </Button>
        </div>

        {/* Filters */}
        <div style={{ padding: "16px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "16px"
          }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>
                Market Id
              </label>
              <input
                type="text"
                value={filters.marketId}
                onChange={(e) => handleFilterChange("marketId", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>
                Username
              </label>
              <input
                type="text"
                value={filters.username}
                onChange={(e) => handleFilterChange("username", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>
                Show List
              </label>
              <select
                value={filters.showList}
                onChange={(e) => handleFilterChange("showList", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                  background: "#fff"
                }}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "end" }}>
              <Button
                variant="danger"
                size="medium"
                onClick={handleApply}
                style={{ width: "100%" }}
              >
                Apply
              </Button>
            </div>
          </div>

          {/* Summary */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            fontSize: "14px",
            fontWeight: "500",
            marginBottom: "16px"
          }}>
            <div>Total OddsBets: {totalOddsBets}</div>
            <div>Total FancyBets: {totalFancyBets}</div>
        </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #e5e7eb"
            }}>
            <thead>
                <tr style={{
                  background: "#17445A",
                  color: "#fff",
                  fontSize: "14px"
                }}>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>Sr no.</th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>Odds</th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>OddsType</th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>Amount</th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>Type</th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>Market Id</th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>Team</th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>Client</th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>Date</th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>Loss</th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>Profit</th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>IP</th>
              </tr>
            </thead>
            <tbody>
                {betData.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{
                      textAlign: "center",
                      padding: "16px",
                      fontSize: "14px",
                      color: "#6b7280"
                    }}>
                      No bet data available. Apply filters to load data.
                    </td>
                  </tr>
                ) : (
                  betData.map((bet) => (
                    <tr key={bet.id} style={{
                      background: "#7CC4F7",
                      color: "#000",
                      fontSize: "14px"
                    }}>
                      <td style={{ padding: "12px 8px", textAlign: "center" }}>{bet.srNo}</td>
                      <td style={{ padding: "12px 8px", textAlign: "center" }}>{bet.odds}</td>
                      <td style={{ padding: "12px 8px", textAlign: "center" }}>{bet.oddsType}</td>
                      <td style={{ padding: "12px 8px", textAlign: "center" }}>{bet.amount}</td>
                      <td style={{ padding: "12px 8px", textAlign: "center" }}>{bet.type}</td>
                      <td style={{ padding: "12px 8px", textAlign: "center" }}>{bet.marketId}</td>
                      <td style={{ padding: "12px 8px", textAlign: "center" }}>{bet.team}</td>
                      <td style={{ padding: "12px 8px", textAlign: "center" }}>{bet.client}</td>
                      <td style={{ padding: "12px 8px", textAlign: "center", whiteSpace: "nowrap" }}>{bet.date}</td>
                      <td style={{ padding: "12px 8px", textAlign: "center" }}>{bet.loss.toFixed(2)}</td>
                      <td style={{ padding: "12px 8px", textAlign: "center" }}>{bet.profit.toFixed(2)}</td>
                      <td style={{ padding: "12px 8px", textAlign: "center" }}>{bet.ip}</td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>

            {/* Fancy Bets Table */}
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #e5e7eb",
              marginTop: "16px"
            }}>
            <thead>
                <tr style={{
                  background: "#17445A",
                  color: "#fff",
                  fontSize: "14px"
                }}>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>Sr no.</th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>Odds</th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>Amount</th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>Type</th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>MarketId</th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }} colSpan={2}>SessionName</th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>Client</th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>Date</th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>Loss</th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>Profit</th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>IP</th>
              </tr>
            </thead>
            <tbody>
                <tr>
                  <td colSpan={11} style={{
                    textAlign: "center",
                    padding: "16px",
                    fontSize: "14px",
                    color: "#6b7280"
                  }}>
                    Not found
                  </td>
                </tr>
            </tbody>
          </table>
        </div>

          {/* Pagination */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "16px"
          }}>
            <div style={{
              display: "flex",
              gap: "8px",
              alignItems: "center"
            }}>
              <button style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor: "pointer",
                borderRadius: "4px"
              }}>
                ‹
              </button>
              <button style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                background: "#17445A",
                color: "#fff",
                cursor: "pointer",
                borderRadius: "4px"
              }}>
                1
              </button>
              <button style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor: "pointer",
                borderRadius: "4px"
              }}>
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 