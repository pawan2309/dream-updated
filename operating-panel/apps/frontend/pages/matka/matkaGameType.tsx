import React from "react";
import Layout from "../layout";

export default function MatkaGameType() {
  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <div style={{ background: '#17445A', color: '#fff', padding: '16px 32px', borderRadius: 8, fontSize: 32, fontWeight: 600, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Matka Game Type List
          <button style={{ background: '#222', color: '#fff', border: '1px solid #388e3c', borderRadius: 4, padding: '8px 32px', fontWeight: 500, fontSize: 18, cursor: 'pointer' }}>Back</button>
        </div>
        <div style={{ background: '#17445A', color: '#fff', borderRadius: 0, fontWeight: 700, fontSize: 18, display: 'flex', marginTop: 8 }}>
          <div style={{ flex: 1, padding: '14px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>Game Type</div>
          <div style={{ flex: 1, padding: '14px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>Times Amount</div>
          <div style={{ flex: 1, padding: '14px 8px', textAlign: 'center' }}>Action</div>
        </div>
      </div>
    </Layout>
  );
} 