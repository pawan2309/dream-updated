import React, { useState, useEffect } from 'react';
import Layout, { BackArrow } from '../../../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface Client {
  id: string;
  username: string;
  name: string;
  code: string;
  creditLimit: number;
}

export default function ClientPlusMinusPage() {
  const [siteName, setSiteName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('lena');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const site = hostname.split('.')[1]?.toUpperCase() || 'SITE';
      setSiteName(hostname);
      setBrandName(site);
      document.title = site;
    }
  }, []);

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/users?role=USER');
        const data = await res.json();
        if (data.success) {
          setClients(data.users || []);
        } else {
          setError('Failed to fetch clients');
        }
      } catch (err) {
        setError('Failed to fetch clients');
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient) {
      setError('Please select a client');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (!remark.trim()) {
      setError('Please enter a remark');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/users/${selectedClient}/manual-ledger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentType,
          remark: remark.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(`Ledger entry added successfully. New limit: ${data.newLimit.toLocaleString()}`);
        // Reset form
        setAmount('');
        setRemark('');
        // Update client's credit limit in the list
        setClients(prev => prev.map(client => 
          client.id === selectedClient 
            ? { ...client, creditLimit: data.newLimit }
            : client
        ));
      } else {
        setError(data.message || 'Failed to add ledger entry');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedClientData = clients.find(client => client.id === selectedClient);

  if (loading) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Client Plus/Minus - {brandName}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-12">
              <div className="d-flex align-items-center">
                <BackArrow />
                <nav aria-label="breadcrumb" className="ml-auto">
                  <ol className="breadcrumb" style={{ backgroundColor: 'transparent', padding: 0, margin: 0 }}>
                    <li className="breadcrumb-item"><Link href="/" className="text-dark">Dashboard</Link></li>
                    <li className="breadcrumb-item"><Link href="/ledger" className="text-dark">Ledger</Link></li>
                    <li className="breadcrumb-item"><Link href="/ledger/client" className="text-dark">Client</Link></li>
                    <li className="breadcrumb-item active" aria-current="page">Plus/Minus</li>
                  </ol>
                </nav>
              </div>
              <h1 className="m-0 text-dark mt-2">Client Plus/Minus</h1>
            </div>
          </div>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Add Manual Ledger Entry</h3>
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="card-body">
                    {error && (
                      <div className="alert alert-danger">
                        <h6>{error}</h6>
                      </div>
                    )}
                    
                    {success && (
                      <div className="alert alert-success">
                        <h6>{success}</h6>
                      </div>
                    )}

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="client">Select Client *</label>
                          <select
                            id="client"
                            className="form-control"
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                            required
                          >
                            <option value="">Choose a client...</option>
                            {clients.map(client => (
                              <option key={client.id} value={client.id}>
                                {client.code} - {client.name} (Limit: {client.creditLimit.toLocaleString()})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="amount">Amount *</label>
                          <input
                            type="number"
                            id="amount"
                            className="form-control"
                            placeholder="Enter amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            step="0.01"
                            min="0.01"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="paymentType">Payment Type *</label>
                          <select
                            id="paymentType"
                            className="form-control"
                            value={paymentType}
                            onChange={(e) => setPaymentType(e.target.value)}
                            required
                          >
                            <option value="dena">DENA (Credit)</option>
                            <option value="lena">LENA (Debit)</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="remark">Remark *</label>
                          <input
                            type="text"
                            id="remark"
                            className="form-control"
                            placeholder="Enter remark"
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>


                  </div>

                  <div className="card-footer">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                          Processing...
                        </>
                      ) : (
                        'Add Ledger Entry'
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary ml-2"
                      onClick={() => {
                        setSelectedClient('');
                        setAmount('');
                        setPaymentType('lena');
                        setRemark('');
                        setError('');
                        setSuccess('');
                      }}
                    >
                      Reset Form
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
} 