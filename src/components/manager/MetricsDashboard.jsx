import React, { useState, useEffect } from 'react';
import { listenToAllOrders } from '../../services/db';
import { Activity, DollarSign, Clock } from 'lucide-react';

const MetricsDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const unsub = listenToAllOrders(setOrders);
    const tick = setInterval(() => setNow(Date.now()), 30_000); // refresh timer every 30s
    return () => { unsub(); clearInterval(tick); };
  }, []);

  const active    = orders.filter(o => ['pending', 'preparing'].includes(o.status));
  const today     = new Date().toISOString().split('T')[0];
  const todayComp = orders.filter(o => o.status === 'completed' && o.created_at?.startsWith(today));
  const revenue   = todayComp.reduce((s, o) => s + (o.total_price || 0), 0);

  const withTime  = todayComp.filter(o => o.completed_at);
  const avgMs     = withTime.length
    ? withTime.reduce((s, o) => s + (new Date(o.completed_at) - new Date(o.created_at)), 0) / withTime.length
    : 0;
  const avgMin    = Math.round(avgMs / 60000);

  const recent = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8);

  return (
    <div>
      {/* Stat Cards */}
      <div className="metrics-grid">
        <div className="metric-card card">
          <div className="metric-icon" style={{ background: 'rgba(59,130,246,.12)', color: 'var(--preparing)' }}>
            <Activity size={22} />
          </div>
          <div className="metric-info">
            <h4>Active Orders</h4>
            <div className="metric-val">{active.length}</div>
          </div>
        </div>

        <div className="metric-card card">
          <div className="metric-icon" style={{ background: 'rgba(16,185,129,.12)', color: 'var(--ready)' }}>
            <DollarSign size={22} />
          </div>
          <div className="metric-info">
            <h4>Today's Revenue</h4>
            <div className="metric-val">${revenue.toFixed(2)}</div>
          </div>
        </div>

        <div className="metric-card card">
          <div className="metric-icon" style={{ background: 'rgba(245,158,11,.12)', color: 'var(--pending)' }}>
            <Clock size={22} />
          </div>
          <div className="metric-info">
            <h4>Avg. Fulfillment</h4>
            <div className="metric-val">{withTime.length ? `${avgMin}m` : '—'}</div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="activity-card card">
        <h4>Recent Activity</h4>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Table</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {recent.map(o => (
              <tr key={o.id}>
                <td className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>#{o.id.slice(-6)}</td>
                <td style={{ fontWeight: 600 }}>{o.table_id.replace(/_/g, ' ').toUpperCase()}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{o.items.length} item{o.items.length !== 1 ? 's' : ''}</td>
                <td style={{ fontWeight: 600 }}>${o.total_price?.toFixed(2)}</td>
                <td><span className={`badge badge-${o.status}`}>{o.status}</span></td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MetricsDashboard;
