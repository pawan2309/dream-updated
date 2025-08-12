import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

interface LedgerEntry {
  id: string;
  remark: string;
  debit: number;
  credit: number;
  balanceAfter: number;
  createdAt: string;
}

const StatementPage = () => {
  const router = useRouter();
  const { userId } = router.query;
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError('');
    // Fetch ledger
    fetch(`/api/users/${userId}/ledger`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLedger(data.ledger || []);
        } else {
          setError('Failed to fetch statement');
        }
      })
      .catch(() => setError('Failed to fetch statement'))
      .finally(() => setLoading(false));
    // Fetch user info
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setUser(data.user);
      });
  }, [userId]);

  return (
    <Layout>
      <section className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h4>Account Statement {user ? `- ${user.code || ''} ${user.name || ''}` : ''}</h4>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item"><a href="/">Home</a></li>
                <li className="breadcrumb-item active text-capitalize">Statement</li>
              </ol>
            </div>
          </div>
        </div>
      </section>
      <section className="user-tablereport">
        <div className="container-fluid px-0">
          <div className="row mx-auto w-100 login-report-table">
            <div className="col-12 px-0">
              <div className="card">
                <div className="card-body yellow-table-login2">
                  {loading ? (
                    <div className="text-center"><i className="fas fa-spinner fa-spin fa-2x"></i><p>Loading statement...</p></div>
                  ) : error ? (
                    <div className="alert alert-danger">{error}</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table table-bordered table-striped">
                        <thead className="bg-warning">
                          <tr>
                            <th className="text-nowrap">Statement Id</th>
                            <th className="text-nowrap">Remark</th>
                            <th className="text-nowrap">C/D</th>
                            <th className="text-nowrap">Amount</th>
                            <th className="text-nowrap">Balance</th>
                            <th className="text-nowrap">Date & Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ledger.length === 0 ? (
                            <tr><td colSpan={6} className="text-center">No statement entries found.</td></tr>
                          ) : ledger.map((entry, idx) => {
                            const isCredit = entry.credit > 0;
                            const isDebit = entry.debit > 0;
                            return (
                              <tr key={entry.id}>
                                <td>{ledger.length - idx}</td>
                                <td className="minWidthRemark">{entry.remark || (isCredit ? 'Deposit' : 'Withdraw')}</td>
                                <td className={isCredit ? 'text-green p-2.5' : 'text-red p-2.5'}>{isCredit ? 'Deposit' : 'Withdraw'}</td>
                                <td className={isCredit ? 'text-green p-2.5' : 'text-red p-2.5'}>{isCredit ? entry.credit.toFixed(2) : '-' + entry.debit.toFixed(2)}</td>
                                <td className="text-green p-2.5">{entry.balanceAfter.toFixed(2)}</td>
                                <td>{new Date(entry.createdAt).toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <style jsx>{`
        .text-green { color: #28a745; }
        .text-red { color: #dc3545; }
        .minWidthRemark { min-width: 200px; }
      `}</style>
    </Layout>
  );
};

export default StatementPage; 