import React, { useState, useEffect } from 'react';
import Layout, { BackArrow } from '../../components/Layout';
import Head from 'next/head';
import Link from 'next/link';

interface Admin {
  id: string;
  name: string;
  code: string;
  creditLimit: number;
}

interface LedgerEntry {
  id: string;
  createdAt: string;
  collection: string;
  debit: number;
  credit: number;
  balanceAfter: number;
  type: string;
  remark: string;
  transactionType?: string;
}

export default function CashAdminPage() {
  const [form, setForm] = useState({
    admin: '',
    collection: '1',
    amount: '',
    paymentType: 'Payment Paid',
    remark: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    if (form.admin) {
      fetchLedgerEntries();
    } else {
      setLedgerEntries([]);
    }
  }, [form.admin]);

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/users?role=ADMIN');
      if (response.ok) {
        const data = await response.json();
        setAdmins(Array.isArray(data) ? data : data.users || []);
      } else {
        setError('Failed to fetch admins');
      }
    } catch (err) {
      setError('Error fetching admins');
    } finally {
      setLoading(false);
    }
  };

  // This page should only show manual adjustments
  const isAdjustmentEntry = (entry: LedgerEntry) => {
    return entry.type === 'ADJUSTMENT';
  };

  const fetchLedgerEntries = async () => {
    if (!form.admin) return;
    setLoadingLedger(true);
    try {
      const response = await fetch(`/api/users/${form.admin}/ledger`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.ledger) {
          setLedgerEntries(data.ledger.filter(isAdjustmentEntry));
        } else {
          setLedgerEntries([]);
        }
      } else {
        setError('Failed to fetch ledger entries');
        setLedgerEntries([]);
      }
    } catch (err) {
      setError('Error fetching ledger entries');
      setLedgerEntries([]);
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    if (!form.remark || form.remark.trim().length === 0) {
      setError('Remark is required');
      setSubmitting(false);
      return;
    }

    try {
      const paymentType = form.paymentType === 'Payment Paid' ? 'dena' : 'lena';
      const requestBody = {
        amount: parseFloat(form.amount),
        paymentType,
        remark: form.remark.trim(),
      };
      const response = await fetch(`/api/users/${form.admin}/manual-ledger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      if (response.ok) {
        setMessage('Transaction completed successfully!');
        setForm(prev => ({ ...prev, amount: '', remark: '' }));
        fetchAdmins();
        fetchLedgerEntries();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to process transaction');
      }
    } catch (err) {
      setError('Error processing transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAdminData = admins.find(a => a.id === form.admin);
  const totalDebit = ledgerEntries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredit = ledgerEntries.reduce((sum, entry) => sum + entry.credit, 0);
  const currentBalance = totalCredit - totalDebit;

  return (
    <Layout>
      <Head>
        <title>Cash Transaction - Admin</title>
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
                    <li className="breadcrumb-item"><Link href="/ct" className="text-dark">Cash Transaction</Link></li>
                    <li className="breadcrumb-item active" aria-current="page">Admin</li>
                  </ol>
                </nav>
              </div>
              <h1 className="m-0 text-dark mt-2">Cash Transaction - Admin</h1>
            </div>
          </div>
        </div>
      </div>
      <section className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="card">
                <form id="myForm" onSubmit={handleSubmit}>
                  <div className="card-header">
                    <h4 className="text-capitalize">Admin Ledger</h4>
                    <div className="form-row col-md-9">
                      <div className="form-group col-md-4">
                        <label htmlFor="admin" className="text-capitalize">Admin</label>
                        <select
                          className="form-control"
                          required
                          id="admin"
                          name="admin"
                          value={form.admin}
                          onChange={handleChange}
                          disabled={loading}
                        >
                          <option value="">Select Admin...</option>
                          {admins.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.code} - {a.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group col-md-4">
                        <label htmlFor="collection">Collection</label>
                        <select
                          className="form-control custom-select"
                          required
                          id="collection"
                          name="collection"
                          value={form.collection}
                          onChange={handleChange}
                        >
                          <option value="1">CA1 CASH</option>
                        </select>
                      </div>
                      <div className="form-group col-md-4">
                        <label htmlFor="amount">Amount</label>
                        <input
                          type="number"
                          className="form-control"
                          step="any"
                          id="amount"
                          name="amount"
                          value={form.amount}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="form-group col-md-4">
                        <label htmlFor="type">Payment Type</label>
                        <select
                          className="form-control custom-select"
                          required
                          id="type"
                          name="paymentType"
                          value={form.paymentType}
                          onChange={handleChange}
                        >
                          <option value="dena">DENA (Credit)</option>
                          <option value="lena">LENA (Debit)</option>
                        </select>
                      </div>
                      <div className="form-group col-md-4">
                        <label htmlFor="remark">Remark</label>
                        <input
                          type="text"
                          className="form-control"
                          id="remark"
                          name="remark"
                          value={form.remark}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="form-group col-md-4">
                        <label className="control-label text-purple" htmlFor="btn">&nbsp;</label>
                        <button
                          className="form-control btn-primary"
                          name="isSubmit"
                          value="true"
                          type="submit"
                          disabled={submitting || loading}
                        >
                          {submitting ? (
                            <>
                              <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                              Processing...
                            </>
                          ) : (
                            'Submit'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  {error && (
                    <div className="alert alert-danger">
                      <h6>{error}</h6>
                    </div>
                  )}
                  {message && (
                    <div className="alert alert-success">
                      <h6>{message}</h6>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
          {form.admin && (
            <div className="row">
              <div className="col-12">
                <div className="mb-3">
                  <h4>Transaction History</h4>
                </div>
                <div>
                  {loadingLedger ? (
                    <div className="text-center">
                      <div className="spinner-border" role="status">
                        <span className="sr-only">Loading...</span>
                      </div>
                      <p>Loading transaction history...</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table id="example1" className="table table-bordered table-striped">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Collection Name</th>
                            <th>Debit</th>
                            <th>Credit</th>
                            <th>Balance</th>
                            <th>Payment Type</th>
                            <th>Remark</th>
                          </tr>
                          <tr>
                            <th></th>
                            <th></th>
                            <th className="text-blue">Total Amount</th>
                            <th>{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</th>
                            <th>{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</th>
                            <th className={currentBalance < 0 ? 'text-danger' : 'text-blue'}>
                              {currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </th>
                            <th></th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {ledgerEntries.map((entry, index) => (
                            <tr key={entry.id}>
                              <td>{index + 1}</td>
                              <td>{new Date(entry.createdAt).toLocaleString('en-IN')}</td>
                              <td>CA1 CASH</td>
                              <td>{(entry.debit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td>{(entry.credit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className={(entry.balanceAfter || 0) < 0 ? 'text-danger' : ''}>
                                {(entry.balanceAfter || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td>{entry.credit > 0 ? 'lena' : 'dena'}</td>
                              <td>{entry.remark || ''}</td>
                            </tr>
                          ))}
                          {ledgerEntries.length === 0 && (
                            <tr>
                              <td colSpan={8} className="text-center">No transactions found</td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot></tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
} 