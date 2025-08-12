import React from "react";
import Layout from "../layout";

export default function MatkaList() {
  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <div style={{ background: '#17445A', color: '#fff', padding: '16px 32px', borderRadius: 8, fontSize: 28, fontWeight: 600, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Matka List
          <button style={{ background: '#222', color: '#fff', border: '1px solid #388e3c', borderRadius: 4, padding: '8px 32px', fontWeight: 500, fontSize: 18, cursor: 'pointer' }}>Back</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontWeight: 700 }}>Select Matka Status</label>
            <select style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #ccc', fontSize: 16, width: 220 }}>
              <option>Yes</option>
            </select>
          </div>
          <button style={{ background: '#17445A', color: '#fff', border: 'none', borderRadius: 6, padding: '16px 48px', fontWeight: 700, fontSize: 22, cursor: 'pointer', marginTop: 22 }}>Create Matka</button>
        </div>
        <div style={{ background: '#17445A', color: '#fff', borderRadius: 0, fontWeight: 700, fontSize: 18, display: 'flex', marginTop: 8 }}>
          <div style={{ flex: 1, padding: '14px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>Matka Event Id</div>
          <div style={{ flex: 1, padding: '14px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>Name</div>
          <div style={{ flex: 1, padding: '14px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>Short Name</div>
          <div style={{ flex: 1, padding: '14px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>MinStake</div>
          <div style={{ flex: 1, padding: '14px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>MaxStake</div>
          <div style={{ flex: 1, padding: '14px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>Open Time</div>
          <div style={{ flex: 1, padding: '14px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>Close Time</div>
          <div style={{ flex: 1, padding: '14px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>Result Time</div>
          <div style={{ flex: 1, padding: '14px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>Bet Status</div>
          <div style={{ flex: 1, padding: '14px 8px', textAlign: 'center' }}>Action</div>
        </div>
      </div>
    </Layout>
  );
} 