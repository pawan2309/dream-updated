import React, { useState } from "react";
import Layout from "../layout";
import { Button } from "../../src/components/Button";

export default function LedgerDeclare() {
  const [diamondDate, setDiamondDate] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const handleDiamondDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDiamondDate(e.target.value);
  };

  const handleDiamondLedgerApply = () => {
    // TODO: Implement Diamond Casino Ledger functionality
    console.log("Applying Diamond Casino Ledger for date:", diamondDate);
    setStatusMessage("Diamond Casino Ledger applied successfully!");
  };

  const handleSaveCasinoResult = () => {
    // TODO: Implement Save Casino Result functionality
    console.log("Saving Casino Result");
    setStatusMessage("Casino Result saved successfully!");
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
              <span style={{ fontSize: 22, fontWeight: 600 }}>Casino Setting</span>
              <Button variant="secondary" size="medium" onClick={handleBack}>Back</Button>
            </div>

            {/* Controls */}
            <div style={{ padding: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Diamond Casino Ledger */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#000" }}>Diamond Casino Ledger</span>
                    <input
                      type="date"
                      name="diamondDate"
                      value={diamondDate}
                      onChange={handleDiamondDateChange}
                      style={{ padding: "6px 8px", fontSize: 12, border: "1px solid #ccc", borderRadius: 2, width: "100%" }}
                    />
                  </div>
                  <Button variant="primary" size="small" onClick={handleDiamondLedgerApply}>
                    Apply
                  </Button>
                </div>

                {/* Save Casino Result */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#000" }}>Save Casino Result</span>
                  </div>
                  <Button variant="primary" size="small" onClick={handleSaveCasinoResult}>
                    Apply
                  </Button>
                </div>
              </div>

              {/* Status Message */}
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "20px 0" }}>
                {statusMessage && (
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#008000", textTransform: "capitalize" }}>
                    {statusMessage}
                  </span>
                )}
        </div>
          </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 