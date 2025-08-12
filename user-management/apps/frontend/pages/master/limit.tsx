import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../../components/Layout';
import Link from 'next/link';

interface SubAgent {
  id: string;
  code?: string;
  name?: string;
  creditLimit: number;
}

const SubAgentLimitUpdatePage = () => {
  const [subAgents, setSubAgents] = useState<SubAgent[]>([]);
  const [myLimit, setMyLimit] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchSubAgents();
  }, []);

  const fetchSubAgents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users?role=SUB');
      const data = await res.json();
      if (res.ok && data.users) {
        setSubAgents(data.users);
        setMyLimit(data.myLimit || 0);
      } else {
        setError(data.error || 'Failed to fetch sub agents');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (id: string, value: string) => {
    setInputValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleLimitUpdate = async (id: string, type: 'Add' | 'Minus') => {
    const value = inputValues[id];
    // handleLimitUpdate called
    
    if (!value || isNaN(Number(value))) {
      alert('Please enter a valid amount');
      return;
    }
    
    const amount = Number(value);
    if (amount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }
    
    try {
      // Sending request to update limit
      
      const res = await fetch('/api/users/update-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, amount, type }),
      });
      
              const data = await res.json();
        // Response data
      
      if (res.ok && data.success) {
        alert(`Limit ${type.toLowerCase()}ed successfully!`);
        fetchSubAgents();
        setInputValues((prev) => ({ ...prev, [id]: '' }));
      } else {
        alert(data.message || data.error || 'Failed to update limit');
      }
    } catch (err) {
      console.error('Error updating limit:', err);
      alert('Network error occurred');
    }
  };

  return (
    <Layout>
      <Head>
        <title>Update Sub Agent Limit</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <section className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1>SubAgent</h1>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item"><Link href="/user_details/sub">SubAgent</Link></li>
                <li className="breadcrumb-item active">Update SubAgent Limit</li>
              </ol>
            </div>
          </div>
        </div>
      </section>
      <section className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="card card-indigo">
                <div className="card-header">
                  <h4>Sub Agent Coin Details</h4>
                </div>
                <div className="card-body">
                  {error && <div className="alert alert-danger">{error}</div>}
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>SNo</th>
                        <th>Sub Agent Name</th>
                        <th>Limit</th>
                        <th>Enter Limit</th>
                        <th>My Limit : {myLimit}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={5}>Loading...</td></tr>
                      ) : subAgents.length === 0 ? (
                        <tr><td colSpan={5}>No sub agents found.</td></tr>
                      ) : (
                        subAgents.map((agent, idx) => (
                          <tr key={agent.id}>
                            <td>{idx + 1}</td>
                            <td>{agent.code} {agent.name}</td>
                            <td>{agent.creditLimit || 0}</td>
                            <td style={{ minWidth: 120 }}>
                              <input
                                required
                                type="number"
                                className="form-control"
                                step="0.01"
                                name="limit"
                                value={inputValues[agent.id] || ''}
                                onChange={e => handleInputChange(agent.id, e.target.value)}
                              />
                            </td>
                            <td style={{ minWidth: 150 }}>
                              <button className="btn-sm btn-primary" type="button" style={{ marginRight: '2px' }} onClick={() => handleLimitUpdate(agent.id, 'Add')}>Add</button>
                              <button className="btn-sm btn-danger" type="button" onClick={() => handleLimitUpdate(agent.id, 'Minus')}>Minus</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SubAgentLimitUpdatePage; 