import React, { useState } from "react";
import Layout from "../layout";
import { Button } from "../../src/components/Button";

export default function ReDeclareCasinoResult() {
  const [roundId, setRoundId] = useState("");
  const [avaitorRoundId, setAvaitorRoundId] = useState("");

  const handleRoundIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoundId(e.target.value);
  };

  const handleAvaitorRoundIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvaitorRoundId(e.target.value);
  };

  const handleReDeclareResult = () => {
    // TODO: Implement re-declare casino result functionality
    console.log("Re-declaring casino result for RoundId:", roundId);
  };

  const handleDeclareAllAvaitorResult = () => {
    // TODO: Implement declare all aviator result functionality
    console.log("Declaring all aviator results");
  };

  const handleReDeclareAvaitorResult = () => {
    // TODO: Implement re-declare aviator result functionality
    console.log("Re-declaring aviator result for RoundId:", avaitorRoundId);
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
              <span style={{ fontSize: 22, fontWeight: 600 }}>Declare Casino Result</span>
              <Button variant="secondary" size="medium" onClick={handleBack}>Back</Button>
            </div>

            {/* Casino Result Section */}
            <div style={{ padding: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", width: "100%", padding: "0 12px" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#000", whiteSpace: "nowrap" }}>
                  Enter RoundId
                </label>
                <input
                  type="text"
                  name="roundId"
                  value={roundId}
                  onChange={handleRoundIdChange}
                  style={{ width: "100%", padding: "8px", fontSize: 12, color: "#000", border: "1px solid #ccc", outline: "none" }}
                />
        </div>
              <div style={{ width: "100%", paddingTop: 12 }}>
                <Button 
                  variant="primary" 
                  size="large" 
                  onClick={handleReDeclareResult}
                  style={{ 
                    display: "flex", 
                    justifyContent: "center", 
                    padding: "8px 20px", 
                    margin: "0 auto", 
                    fontSize: 18, 
                    fontWeight: 600, 
                    textTransform: "uppercase",
                    transition: "duration-150 ease-in-out",
                    border: "1px solid #73766F",
                    borderRadius: 4
                  }}
                >
                  Re Declare Result
                </Button>
          </div>
        </div>

            {/* Avaitor Result Section */}
            <div style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end", width: "100%", margin: "0 20px 0 0" }}>
                <Button 
                  variant="primary" 
                  size="small" 
                  onClick={handleDeclareAllAvaitorResult}
                  style={{ 
                    display: "flex", 
                    justifyContent: "flex-end", 
                    padding: "8px 8px", 
                    fontSize: 12, 
                    fontWeight: 400, 
                    textTransform: "uppercase"
                  }}
                >
                  Declare All Avaitor Result
                </Button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", width: "100%", padding: "0 12px" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#000", whiteSpace: "nowrap" }}>
                  Enter Avaitor RoundId
                </label>
                <input
                  type="text"
                  name="avaitorRoundId"
                  value={avaitorRoundId}
                  onChange={handleAvaitorRoundIdChange}
                  style={{ width: "100%", padding: "8px", fontSize: 12, color: "#000", border: "1px solid #ccc", outline: "none" }}
                />
              </div>
              <div style={{ width: "100%", paddingTop: 12 }}>
                <Button 
                  variant="primary" 
                  size="large" 
                  onClick={handleReDeclareAvaitorResult}
                  style={{ 
                    display: "flex", 
                    justifyContent: "center", 
                    padding: "8px 20px", 
                    margin: "0 auto", 
                    fontSize: 18, 
                    fontWeight: 600, 
                    textTransform: "uppercase",
                    transition: "duration-150 ease-in-out",
                    border: "1px solid #73766F",
                    borderRadius: 4
                  }}
                >
                  Re Declare Avaitor Result
                </Button>
              </div>
          </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 