import React, { useState, useEffect, useRef } from 'react';
import { listenToActiveOrders, updateOrderStatus } from '../../services/db';
import { Play, CheckCircle, ChefHat, Clock, AlertTriangle } from 'lucide-react';
import './kitchen.css';

const KitchenApp = () => {
  const [orders, setOrders] = useState([]);
  const [now, setNow] = useState(Date.now());
  const prevOrderIds = useRef(new Set());

  // ── Synthesized Service Bell Chime ──────────────────────────────────────────
  // Creates a highly authentic, loud, resonant physical desk bell using Web Audio
  const playBellChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const nowTime = ctx.currentTime;
      
      // Harmonics / Overtones to simulate physical bell transients
      const frequencies = [880, 1100, 1320, 1760];
      
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, nowTime);
        
        // Attack-Decay envelope
        gain.gain.setValueAtTime(0, nowTime);
        gain.gain.linearRampToValueAtTime(i === 0 ? 0.25 : 0.08, nowTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, nowTime + 1.2 - (i * 0.15));
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(nowTime);
        osc.stop(nowTime + 1.2);
      });
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = listenToActiveOrders((activeOrders) => {
      // Check for new pending orders to play the chime
      const currentPendingIds = activeOrders
        .filter(o => o.status === 'pending')
        .map(o => o.id);

      const hasNewTicket = currentPendingIds.some(id => !prevOrderIds.current.has(id));
      if (hasNewTicket && prevOrderIds.current.size > 0) {
        playBellChime();
      }

      // Update tracked pending IDs
      prevOrderIds.current = new Set(currentPendingIds);
      setOrders(activeOrders);
    });

    const timer = setInterval(() => setNow(Date.now()), 15000); // tick every 15s to update age

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const getElapsedTime = (createdAtString) => {
    const created = new Date(createdAtString);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins;
  };

  return (
    <div className="kitchen-kds-page">
      {/* Header bar */}
      <header className="kds-header">
        <div className="logo-group">
          <div className="logo-icon-wrap">
            <ChefHat size={22} />
          </div>
          <div>
            <h2>Kitchen Order Monitor</h2>
            <p className="subtitle">Live Shop Feed</p>
          </div>
        </div>

        <div className="status-summary">
          <div className="summary-pill pending">
            <span>{orders.filter(o => o.status === 'pending').length} PENDING</span>
          </div>
          <div className="summary-pill preparing">
            <span>{orders.filter(o => o.status === 'preparing').length} PREPARING</span>
          </div>
          <button onClick={playBellChime} className="btn-test-chime" title="Test Alert Volume">
            🔊 Test Volume
          </button>
        </div>
      </header>

      {/* Main Order Grid */}
      <div className="kds-grid-container">
        {orders.length === 0 ? (
          <div className="kds-empty-state">
            <h3>No active orders</h3>
            <p>Waiting for customers to scan QR codes and place orders...</p>
          </div>
        ) : (
          <div className="kds-grid">
            {orders.map((order) => {
              const age = getElapsedTime(order.created_at);
              const isOverdue = age >= 10;
              const isPending = order.status === 'pending';

              return (
                <div key={order.id} className={`kds-card ${order.status} ${isOverdue ? 'overdue' : ''}`}>
                  {/* Card Header */}
                  <div className="card-header-bar">
                    <span className="table-label">{order.table_id.replace(/_/g, ' ').toUpperCase()}</span>
                    <span className={`age-label ${isOverdue ? 'danger' : ''}`}>
                      <Clock size={13} /> {age === 0 ? 'Just now' : `${age}m ago`}
                    </span>
                  </div>

                  {/* Card Items */}
                  <div className="card-items-list">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="item-row">
                        <span className="item-qty">{item.quantity}×</span>
                        <div className="item-details">
                          <span className="item-name">{item.name}</span>
                          {item.notes && (
                            <span className="item-note">
                              <AlertTriangle size={12} /> {item.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="card-actions-bar">
                    {isPending ? (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="btn-kds-action start"
                      >
                        <Play size={16} /> START PREPARING
                      </button>
                    ) : (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="btn-kds-action complete"
                      >
                        <CheckCircle size={16} /> MARK COMPLETE
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenApp;
