import React from "react";
import Layout from "../layout";

export default function MatkaResultDeclare() {
  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <div style={{ background: '#17445A', color: '#fff', padding: '16px 32px', borderRadius: 8, fontSize: 32, fontWeight: 600, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Matka Result Declare
          <button style={{ background: '#222', color: '#fff', border: '1px solid #388e3c', borderRadius: 4, padding: '8px 32px', fontWeight: 500, fontSize: 18, cursor: 'pointer' }}>Back</button>
        </div>
        <div style={{ display: 'flex', gap: 32, marginBottom: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
            <label style={{ fontWeight: 700 }}>Select Matka</label>
            <select style={{ padding: '12px 16px', borderRadius: 4, border: '1px solid #ccc', fontSize: 18 }}>
              <option>Select Matka</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
            <label style={{ fontWeight: 700 }}>Select Bet Type</label>
            <select style={{ padding: '12px 16px', borderRadius: 4, border: '1px solid #ccc', fontSize: 18 }}>
              <option>OPEN</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
            <label style={{ fontWeight: 700 }}>Bet Number</label>
            <input style={{ padding: '12px 16px', borderRadius: 4, border: '1px solid #ccc', fontSize: 18 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
            <label style={{ fontWeight: 700 }}>Bet Number</label>
            <input type="date" defaultValue="2025-07-26" style={{ padding: '12px 16px', borderRadius: 4, border: '1px solid #ccc', fontSize: 18 }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 400 }}>
          <button style={{ background: '#222', color: '#fff', border: 'none', borderRadius: 4, padding: '20px 0', fontWeight: 700, fontSize: 28, cursor: 'pointer' }}>Submit</button>
          <button style={{ background: '#222', color: '#fff', border: 'none', borderRadius: 4, padding: '20px 0', fontWeight: 700, fontSize: 28, cursor: 'pointer' }}>Result Panel List</button>
        </div>
      </div>
    </Layout>
  );
} 