import React, { useState, useEffect } from 'react';
import { listenToActiveOrders, updateOrderStatus } from '../../services/db';

export default function StaffKitchen() {
  const [activeTickets, setActiveTickets] = useState([]);

  // Load active orders in real-time
  useEffect(() => {
    const unsubscribe = listenToActiveOrders((orders) => {
      setActiveTickets(orders);
    });
    return () => unsubscribe();
  }, []);

  const handleCookComplete = async (ticketId) => {
    // Fulfills requirement: marking complete updates status to 'completed' and triggers customer's mobile bell.
    // The order automatically filters out from active tickets (pending/preparing) and slides off the screen!
    await updateOrderStatus(ticketId, 'completed');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-6 font-sans flex flex-col">
      {/* KDS Monitor Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🍳</span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Kitchen display Monitor</h1>
            <p className="text-[10px] text-slate-400">Real-time order ticket dispatcher and customer chimer</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-slate-400 font-mono">Active Tickets: {activeTickets.length}</span>
        </div>
      </div>

      {/* Ticket Grid Board */}
      {activeTickets.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-slate-500 py-20">
          <span className="text-6xl block animate-bounce mb-3">🍔</span>
          <h2 className="text-xl font-extrabold text-slate-400">All caught up!</h2>
          <p className="text-xs text-slate-500 mt-1">No active cooking tickets. Wait for customer checkouts...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {activeTickets.map(ticket => (
            <TicketCard 
              key={ticket.id} 
              ticket={ticket} 
              onComplete={handleCookComplete} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Sub-Component: Dynamic Ticket Card with Time-Elapsed Counter
function TicketCard({ ticket, onComplete }) {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Calculate cooking duration in real-time
  useEffect(() => {
    const start = new Date(ticket.created_at).getTime();
    
    const interval = setInterval(() => {
      const now = Date.now();
      setElapsedTime(Math.floor((now - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [ticket.created_at]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Ticket color-code status based on elapsed cooking duration (caution states)
  const isOverdue = elapsedTime > 5 * 60; // 5 minutes caution

  return (
    <div className={`bg-[#101625] border rounded-3xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden transition-all duration-300 ${
      isOverdue ? 'border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.05)]' : 'border-slate-800 hover:border-slate-700'
    }`}>
      {/* Overflow Time warning accent */}
      {isOverdue && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 animate-pulse" />
      )}

      <div>
        {/* Ticket Title Meta */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">{ticket.user_id}</span>
            <strong className="text-sm font-extrabold text-slate-200">{ticket.user_name}</strong>
          </div>
          
          {/* Real-time cooking timer */}
          <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold tracking-wider ${
            isOverdue ? 'bg-red-500/10 text-red-400 animate-pulse' : 'bg-slate-800 text-purple-400'
          }`}>
            ⏱️ {formatTime(elapsedTime)}
          </span>
        </div>

        {/* Ordered Food items */}
        <ul className="space-y-2 mb-4">
          {ticket.items.map((food, idx) => (
            <li key={idx} className="flex items-center justify-between bg-[#1B2336] p-2.5 rounded-xl border border-slate-750">
              <span className="text-xs font-bold text-slate-200">
                {food.name} <strong className="text-purple-400 text-xs ml-1">x{food.quantity}</strong>
              </span>
            </li>
          ))}
        </ul>

        {/* Cashier kitchen cooking comments */}
        {ticket.notes && (
          <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl mb-4">
            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest block mb-0.5">Cook Comment</span>
            <p className="text-xs text-amber-300 font-medium">{ticket.notes}</p>
          </div>
        )}
      </div>

      {/* Complete trigger action */}
      <button
        onClick={() => onComplete(ticket.id)}
        className="w-full py-3 bg-green-600 hover:bg-green-500 text-slate-100 font-extrabold text-sm rounded-xl transition-all shadow-md hover:shadow-green-600/15 active:scale-[0.98]"
      >
        ✔ Cook Complete (OK)
      </button>
    </div>
  );
}
