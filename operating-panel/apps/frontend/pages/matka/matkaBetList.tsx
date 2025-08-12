import React from "react";
import Layout from "../layout";

export default function MatkaBetList() {
  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <div style={{ background: '#17445A', color: '#fff', padding: '16px 32px', borderRadius: 8, fontSize: 32, fontWeight: 600, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          All Bets
          <button style={{ background: '#222', color: '#fff', border: '1px solid #388e3c', borderRadius: 4, padding: '8px 32px', fontWeight: 500, fontSize: 18, cursor: 'pointer' }}>Back</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontWeight: 700 }}>Start Date</label>
            <input type="date" defaultValue="2025-07-26" style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc', fontSize: 16, width: 220 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontWeight: 700 }}>End Date</label>
            <input type="date" defaultValue="2025-07-26" style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc', fontSize: 16, width: 220 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            <label style={{ fontWeight: 700 }}>Select Matka Name</label>
            <select style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc', fontSize: 16, width: '100%' }}>
              <option>Select Matka Name</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontWeight: 700 }}>Select Matka Status</label>
            <select style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc', fontSize: 16, width: 220 }}>
              <option>Non-Declare Matka</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontWeight: 700 }}>Select Matka Type</label>
            <select style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc', fontSize: 16, width: 220 }}>
              <option>Non-Deleted Matka</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <button style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 32px', fontWeight: 600, fontSize: 18, cursor: 'pointer' }}>Apply</button>
            <button style={{ background: '#222', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 32px', fontWeight: 600, fontSize: 18, cursor: 'pointer' }}>Today P/L</button>
          </div>
        </div>
        <div style={{ background: '#17445A', color: '#fff', borderRadius: 0, fontWeight: 700, fontSize: 18, display: 'flex', marginTop: 8 }}>
          <div style={{ flex: 1, padding: '14px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>Date</div>
          <div style={{ flex: 1, padding: '14px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>Client</div>
          <div style={{ flex: 1, padding: '14px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>Matka Name</div>
          <div style={{ flex: 1, padding: '14px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>Game Type</div>
          <div style={{ flex: 1, padding: '14px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>Bet No.</div>
          <div style={{ flex: 1, padding: '14px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>Winner</div>
          <div style={{ flex: 1, padding: '14px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>Stack</div>
          <div style={{ flex: 1, padding: '14px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>Profit</div>
          <div style={{ flex: 1, padding: '14px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>Loss</div>
          <div style={{ flex: 1, padding: '14px 8px', textAlign: 'center' }}>pnl</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 0, fontWeight: 600, fontSize: 18, display: 'flex', marginTop: 0, minHeight: 48, alignItems: 'center' }}>
          <div style={{ flex: 1, textAlign: 'center', color: '#222' }}>Data not found</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>{'<'}</button>
          <button style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #ccc', background: '#17445A', color: '#fff', cursor: 'pointer' }}>1</button>
          <button style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>{'>'}</button>
        </div>
      </div>
    </Layout>
  );
} 