import React, { useState } from "react";
import Layout from "../layout";
import { Table } from "../../src/components/Table";
import { Button } from "../../src/components/Button";

interface CasinoResult {
  srNo: number;
  roundId: string;
  eventId: string;
  gameType: string;
  date: string;
}

const tableColumns = [
  { key: "srNo", label: "Sr. No.", width: "80px" },
  { key: "roundId", label: "Round Id", width: "120px" },
  { key: "eventId", label: "Event Id", width: "120px" },
  { key: "gameType", label: "Game Type", width: "120px" },
  { key: "date", label: "Date", width: "120px" },
  { key: "actions", label: "Action", width: "100px" },
];

export default function DeclareCasinoResult() {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    casinoName: "",
  });
  const [results, setResults] = useState<CasinoResult[]>([]); // No hardcoded data

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    // TODO: Fetch results based on filters from API
  };

  const handleBack = () => {
    window.history.back();
  };

  // Prepare table data with actions
  const tableData = results.map((result) => ({
    ...result,
    actions: (
      <Button variant="primary" size="small" onClick={() => {}}>
        Edit
      </Button>
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
            <div style={{ display: "flex", alignItems: "flex-end", gap: 32, padding: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontWeight: 700 }}>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  style={{ padding: "10px 16px", borderRadius: 4, border: "1px solid #ccc", fontSize: 16, width: 220 }}
                />
          </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontWeight: 700 }}>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  style={{ padding: "10px 16px", borderRadius: 4, border: "1px solid #ccc", fontSize: 16, width: 220 }}
                />
          </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            <label style={{ fontWeight: 700 }}>Select Casino Name</label>
                <select
                  name="casinoName"
                  value={filters.casinoName}
                  onChange={handleFilterChange}
                  style={{ padding: "10px 16px", borderRadius: 4, border: "1px solid #ccc", fontSize: 16, width: "100%" }}
                >
                  <option value="">Select Casino Name</option>
                  {/* TODO: Populate with casino names from API */}
            </select>
          </div>
        </div>
            <div style={{ padding: 16 }}>
              <Table
                columns={tableColumns}
                data={tableData}
                selectable={false}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 