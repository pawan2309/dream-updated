import React, { useState } from "react";
import Layout from "./layout";
import { Button } from "../src/components/Button";

export default function Settings() {
  const [userType, setUserType] = useState("");
  const [exposure, setExposure] = useState("");
  const [passUserType, setPassUserType] = useState("");

  const handleUserTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUserType(e.target.value);
  };

  const handleExposureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExposure(e.target.value);
  };

  const handlePassUserTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPassUserType(e.target.value);
  };

  const handleEditCommonSetting = () => {
    // TODO: Implement edit common setting functionality
    console.log("Edit Common Setting");
  };

  const handleGetTransaction = () => {
    // TODO: Implement get transaction functionality
    console.log("Get Transaction");
  };

  const handleUsersList = () => {
    // TODO: Implement users list functionality
    console.log("Users List");
  };

  const handleFlushRedisKeys = () => {
    // TODO: Implement flush redis keys functionality
    console.log("Flush Redis Keys");
  };

  const handleUpdateDiamondVideo = () => {
    // TODO: Implement update diamond video functionality
    console.log("Update Diamond Video");
  };

  const handleUpdateGapCasinoList = () => {
    // TODO: Implement update gap casino list functionality
    console.log("Update Gap Casino List");
  };

  const handleForceLogout = () => {
    // TODO: Implement force logout functionality
    console.log("Force Logout for user type:", userType);
  };

  const handleUpdateExposure = () => {
    // TODO: Implement update exposure functionality
    console.log("Update Exposure for:", exposure);
  };

  const handleForcePasswordUpdate = () => {
    // TODO: Implement force password update functionality
    console.log("Force Password Update for user type:", passUserType);
  };

  const handleCheckRollBackFancies = () => {
    // TODO: Implement check roll back fancies functionality
    console.log("Check Roll Back Fancies");
  };

  const handleDistributeBonus = () => {
    // TODO: Implement distribute bonus functionality
    console.log("Distribute Bonus");
  };

  return (
    <Layout>
      <div style={{ backgroundImage: 'url("/assets/body-bg.jpg")', minHeight: "100vh" }} className="h-full w-full overflow-y-auto">
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: 16 }}>
          <div style={{ marginTop: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
              
              {/* Update Common Setting */}
              <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#17445A", color: "#fff", borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 600 }}>Update Common Setting</span>
                  <Button variant="secondary" size="small" onClick={handleEditCommonSetting}>Edit</Button>
                </div>
              </div>

              {/* Get Transaction */}
              <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#17445A", color: "#fff", borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 600 }}>Get Transaction</span>
                  <Button variant="secondary" size="small" onClick={handleGetTransaction}>Get Transaction</Button>
                </div>
              </div>

              {/* Negative User Details */}
              <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#17445A", color: "#fff", borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 600 }}>Negative User Details</span>
                  <Button variant="secondary" size="small" onClick={handleUsersList}>Users List</Button>
                </div>
              </div>

              {/* Flush Redis Keys */}
              <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#17445A", color: "#fff", borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 600 }}>Flush Redis Keys</span>
                  <Button variant="secondary" size="small" onClick={handleFlushRedisKeys}>Apply</Button>
                </div>
        </div>

              {/* Update Diamond Video */}
              <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#17445A", color: "#fff", borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 600 }}>Update Diamond Video</span>
                  <Button variant="secondary" size="small" onClick={handleUpdateDiamondVideo}>Update</Button>
        </div>
        </div>

              {/* Update Gap Casino List */}
              <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#17445A", color: "#fff", borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 600 }}>Update Gap Casino List</span>
                  <Button variant="secondary" size="small" onClick={handleUpdateGapCasinoList}>Update</Button>
        </div>
        </div>

              {/* Logout */}
              <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#17445A", color: "#fff", borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 600 }}>Logout</span>
        </div>
                <div style={{ padding: "8px 16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#000" }}>Force Logout User</span>
                      <select
                        id="userType"
                        name="userType"
                        value={userType}
                        onChange={handleUserTypeChange}
                        style={{ padding: "6px 8px", fontSize: 12, border: "1px solid #ccc", borderRadius: 2, width: "100%", textTransform: "capitalize" }}
                      >
                        <option value="">All User</option>
                        <option value="owner">owner</option>
                        <option value="subowner">subowner</option>
                        <option value="superadmin">superadmin</option>
                        <option value="admin">admin</option>
                        <option value="subadmin">subadmin</option>
                        <option value="master">master</option>
                        <option value="superagent">superagent</option>
                        <option value="agent">agent</option>
                        <option value="client">client</option>
              </select>
                    </div>
                    <Button variant="primary" size="small" onClick={handleForceLogout}>Apply</Button>
            </div>
          </div>
        </div>

              {/* Exposure Update */}
              <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#17445A", color: "#fff", borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 600 }}>Exposure Update</span>
                </div>
                <div style={{ padding: "8px 16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#000" }}>Update Exposure</span>
                      <input
                        type="text"
                        name="exposure"
                        value={exposure}
                        onChange={handleExposureChange}
                        placeholder="Enter Username"
                        style={{ padding: "6px 8px", fontSize: 12, border: "1px solid #ccc", borderRadius: 2, width: "100%" }}
                      />
                    </div>
                    <Button variant="primary" size="small" onClick={handleUpdateExposure}>Apply</Button>
            </div>
          </div>
        </div>

              {/* Password Update */}
              <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#17445A", color: "#fff", borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 600 }}>Password Update</span>
                </div>
                <div style={{ padding: "8px 16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#000" }}>Force Password Update</span>
                      <select
                        id="passUserType"
                        name="passUserType"
                        value={passUserType}
                        onChange={handlePassUserTypeChange}
                        style={{ padding: "6px 8px", fontSize: 12, border: "1px solid #ccc", borderRadius: 2, width: "100%", textTransform: "capitalize" }}
                      >
                        <option value="">All User</option>
                        <option value="owner">owner</option>
                        <option value="subowner">subowner</option>
                        <option value="superadmin">superadmin</option>
                        <option value="admin">admin</option>
                        <option value="subadmin">subadmin</option>
                        <option value="master">master</option>
                        <option value="superagent">superagent</option>
                        <option value="agent">agent</option>
                        <option value="client">client</option>
              </select>
                    </div>
                    <Button variant="primary" size="small" onClick={handleForcePasswordUpdate}>Apply</Button>
                  </div>
                </div>
              </div>

              {/* Check Roll Back Fancies */}
              <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#17445A", color: "#fff", borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 600 }}>Check Roll Back Fancies</span>
                  <Button variant="secondary" size="small" onClick={handleCheckRollBackFancies}>View</Button>
                </div>
              </div>

              {/* Distribute Bonus */}
              <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#17445A", color: "#fff", borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 600 }}>Distribute Bonus</span>
                  <Button variant="secondary" size="small" onClick={handleDistributeBonus}>Submit</Button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 