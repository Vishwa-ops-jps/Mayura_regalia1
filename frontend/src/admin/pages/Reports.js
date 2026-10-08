import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../services/adminApi';
import { formatCurrency } from '../utils';
import { DailyRevenueChart } from '../components/Charts';

const RANGES = [7, 30, 90];

const Reports = () => {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setReport(await dashboardApi.reports(days));
        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [days]);

  const totalRevenue = report ? report.salesByDay.reduce((s, r) => s + r.revenue, 0) : 0;
  const totalOrders = report ? report.salesByDay.reduce((s, r) => s + r.orders, 0) : 0;
  const maxCategoryRevenue = report && report.salesByCategory.length ? Math.max(...report.salesByCategory.map((c) => c.revenue), 1) : 1;

  return (
    <section>
      <div className="admin-toolbar">
        <div className="pill-list">
          {RANGES.map((r) => (
            <button key={r} className={`admin-btn small ${days === r ? 'primary' : ''}`} onClick={() => setDays(r)}>Last {r} days</button>
          ))}
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {loading || !report ? <div className="admin-loading">Loading report...</div> : (
        <>
          <div className="stats-grid">
            <div className="stat-card"><span>Revenue</span><strong>{formatCurrency(totalRevenue)}</strong><em>Last {days} days</em></div>
            <div className="stat-card"><span>Orders</span><strong>{totalOrders}</strong><em>Last {days} days</em></div>
            <div className="stat-card"><span>Avg Order Value</span><strong>{formatCurrency(totalOrders ? totalRevenue / totalOrders : 0)}</strong><em>Per order</em></div>
          </div>

          <div className="report-grid">
            <div className="admin-panel-card chart-card">
              <div className="panel-heading"><div><span>TREND</span><h2>Revenue by day</h2></div></div>
              {report.salesByDay.length ? (
                <DailyRevenueChart data={report.salesByDay} />
              ) : <div className="empty-table">No sales in this range.</div>}
            </div>

            <div className="admin-panel-card">
              <div className="panel-heading"><div><span>BREAKDOWN</span><h2>Orders by status</h2></div></div>
              <div className="simple-bar-list">
                {report.statusBreakdown.map((s) => (
                  <div key={s.status} className="simple-bar-row">
                    <span style={{ textTransform: 'capitalize' }}>{s.status}</span>
                    <div className="simple-bar-track"><div className="simple-bar-fill" style={{ width: `${Math.min(100, (s.count / Math.max(1, totalOrders || 1)) * 100)}%` }} /></div>
                    <span>{s.count}</span>
                  </div>
                ))}
                {!report.statusBreakdown.length && <div className="empty-table">No orders yet.</div>}
              </div>
            </div>
          </div>

          <div className="report-grid">
            <div className="admin-panel-card table-card">
              <div className="panel-heading"><div><span>CATEGORIES</span><h2>Revenue by category</h2></div></div>
              <div className="simple-bar-list" style={{ padding: '16px 20px' }}>
                {report.salesByCategory.map((c) => (
                  <div key={c.category} className="simple-bar-row">
                    <span>{c.category}</span>
                    <div className="simple-bar-track"><div className="simple-bar-fill" style={{ width: `${(c.revenue / maxCategoryRevenue) * 100}%` }} /></div>
                    <span>{formatCurrency(c.revenue)}</span>
                  </div>
                ))}
                {!report.salesByCategory.length && <div className="empty-table">No category sales yet.</div>}
              </div>
            </div>

            <div className="admin-panel-card table-card">
              <div className="panel-heading"><div><span>PAYMENTS</span><h2>By method</h2></div></div>
              <div className="table-wrap">
                <table className="admin-table">
                  <thead><tr><th>METHOD</th><th>COUNT</th><th>TOTAL</th></tr></thead>
                  <tbody>
                    {report.paymentBreakdown.map((p) => (
                      <tr key={p.method}><td>{p.method}</td><td>{p.count}</td><td>{formatCurrency(p.total)}</td></tr>
                    ))}
                  </tbody>
                </table>
                {!report.paymentBreakdown.length && <div className="empty-table">No payments yet.</div>}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default Reports;
