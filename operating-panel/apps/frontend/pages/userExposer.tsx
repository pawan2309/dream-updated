import React, { useState } from "react";
import Layout from "./layout";
import { Table } from "../src/components/Table";
import { Button } from "../src/components/Button";
import { TableRow } from "../src/types";

interface UserExposer extends TableRow {
  id: string;
  date: string;
  gameName: string;
  gameType: string;
  marketId: string;
  eventId: string;
  overallType: string;
  amount: number;
  remarks: string;
}

const tableColumns = [
  { key: "date", label: "Date", width: "120px" },
  { key: "gameName", label: "Game Name", width: "150px" },
  { key: "gameType", label: "Game Type", width: "120px" },
  { key: "marketId", label: "MarketId", width: "100px" },
  { key: "eventId", label: "EventId", width: "100px" },
  { key: "overallType", label: "Overall Type", width: "120px" },
  { key: "amount", label: "Amount", width: "100px" },
  { key: "remarks", label: "Remarks", width: "150px" },
];

export default function UserExposer() {
  const [username, setUsername] = useState("");
  const [exposerData, setExposerData] = useState<UserExposer[]>([]); // No hardcoded data

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handleApply = () => {
    // TODO: Implement get user exposer list functionality
    console.log("Getting user exposer list for:", username);
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <Layout>
      <div style={{ backgroundImage: 'url("/assets/body-bg.jpg")', minHeight: "100vh" }} className="h-full w-full overflow-y-auto">
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginTop: 24 }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#17445A", color: "#fff", borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 600 }}>User Exposer</span>
              <Button variant="secondary" size="medium" onClick={handleBack}>Back</Button>
            </div>

            {/* Controls */}
            <div style={{ padding: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                {/* Get User Exposer List */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#000" }}>Get User Exposer List</span>
                    <input
                      type="text"
                      id="userType"
                      name="username"
                      value={username}
                      onChange={handleUsernameChange}
                      style={{ padding: "6px 8px", fontSize: 12, border: "1px solid #ccc", borderRadius: 2, width: "100%", textTransform: "capitalize" }}
                      placeholder="Enter username"
                    />
                  </div>
                  <Button variant="primary" size="small" onClick={handleApply}>
                    Apply
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div style={{ padding: "12px 16px", height: "100%" }}>
                <div style={{ overflowY: "auto", height: "92%", width: "100%" }}>
                  {exposerData.length === 0 ? (
                    <div style={{ 
                      background: "#fff", 
                      borderRadius: 8, 
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)", 
                      padding: 48,
                      textAlign: "center",
                      color: "#6b7280"
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No Data Found</div>
                      <div style={{ fontSize: 14 }}>Enter a username and apply to load user exposer data</div>
                    </div>
                  ) : (
                    <Table
                      columns={tableColumns}
                      data={exposerData}
                      selectable={false}
                    />
                  )}
                </div>
              </div>
        </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 