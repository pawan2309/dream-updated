import React, { useState } from "react";
import Layout from "../layout";
import { Table } from "../../src/components/Table";
import { Filter } from "../../src/components/Filter";
import { Button } from "../../src/components/Button";
import { Bet, FilterProps } from "../../src/types";

const tableColumns = [
  { key: "date", label: "Date", width: "150px" },
  { key: "client", label: "Client", width: "120px" },
  { key: "market", label: "Market", width: "80px" },
  { key: "roundId", label: "RoundId", width: "140px" },
  { key: "player", label: "Player", width: "100px" },
  { key: "winner", label: "Winner", width: "100px" },
  { key: "stack", label: "Stack", width: "80px" },
  { key: "rate", label: "Rate", width: "80px" },
  { key: "profit", label: "Profit", width: "80px" },
  { key: "loss", label: "Loss", width: "80px" },
  { key: "pnl", label: "P&L", width: "80px" },
  { key: "ip", label: "IP", width: "200px" },
];

export default function BetList() {
  const [filters, setFilters] = useState<FilterProps>({
    startDate: "2025-07-25",
    endDate: "2025-07-25",
    showList: 10
  });
  const [selectedBets, setSelectedBets] = useState<string[]>([]);
  const [betData, setBetData] = useState<Bet[]>([]);

  const handleFilterChange = (newFilters: FilterProps) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleApplyFilters = () => {
    // TODO: Implement filter logic - fetch data from API
    console.log("Applying filters:", filters);
    // This would typically call an API to fetch bet data
    // setBetData(await fetchBets(filters));
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: "2025-07-25",
      endDate: "2025-07-25",
      showList: 10
    });
    setBetData([]);
  };

  const handleBetSelection = (selectedIds: string[]) => {
    setSelectedBets(selectedIds);
  };

  const handleTodayPL = () => {
    // TODO: Implement today P/L calculation
    console.log("Calculating today P/L");
  };

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <div style={{ background: '#17445A', color: '#fff', padding: '16px 32px', borderRadius: 8, fontSize: 28, fontWeight: 600, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          All Bets
          <Button variant="secondary" size="medium">Back</Button>
        </div>

        <Filter
          {...filters}
          onFilterChange={handleFilterChange}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Button variant="danger" size="small" onClick={handleTodayPL}>
            Today P/L
          </Button>
          <span style={{ fontWeight: 500 }}>
            Selected: {selectedBets.length} bets
          </span>
        </div>

        {betData.length === 0 ? (
          <div style={{ 
            background: '#fff', 
            borderRadius: 8, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)', 
            padding: 48,
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: 24, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No bet data available</div>
            <div style={{ fontSize: 14 }}>Apply filters to load bet data or check your connection</div>
          </div>
        ) : (
          <Table
            columns={tableColumns}
            data={betData}
            selectable={true}
            selectedIds={selectedBets}
            onSelectionChange={handleBetSelection}
          />
        )}
      </div>
    </Layout>
  );
} 