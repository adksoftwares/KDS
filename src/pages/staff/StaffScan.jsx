import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function StaffScan() {
  const [regId, setRegId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleScanSubmit = (e) => {
    e.preventDefault();
    const cleanId = regId.trim().toUpperCase();

    if (!cleanId) {
      setError('Please scan or type a Registration Number.');
      return;
    }

    if (!cleanId.startsWith('REG-2026-') || cleanId.length < 13) {
      setError('Invalid Registration key format. Format must match: REG-2026-XXXX');
      return;
    }

    // Lookup verified users in localStorage to confirm account legitimacy
    const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const userExists = mockUsers.find(u => u.id === cleanId);

    if (!userExists) {
      setError('This Registration Number was not found. Please verify user signup status.');
      return;
    }

    setError('');
    // Route to cashier food checkout panel with the validated customer ID
    navigate(`/staff/order/${cleanId}`);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center p-6 font-sans">
      {/* Premium Desktop Command Panel */}
      <div className="w-full max-w-lg bg-[#101625] rounded-[32px] border border-slate-800 shadow-[0_0_80px_rgba(139,92,246,0.08)] p-10 relative overflow-hidden">
        
        {/* Glow Decor */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />

        {/* Dashboard Title Header */}
        <div className="text-center mb-8">
          <span className="text-5xl block animate-pulse">🏪</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-3 text-slate-100">Shop Cashier Terminal</h1>
          <p className="text-slate-400 text-sm mt-1">Scan customer QR code or input registration key to dispatch orders</p>
        </div>

        {/* Dynamic scanner input Form */}
        <form onSubmit={handleScanSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Customer QR / Reg Number</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-500">🔍</span>
              <input 
                type="text" 
                placeholder="REG-2026-XXXX" 
                value={regId}
                onChange={e => {
                  setRegId(e.target.value);
                  setError('');
                }}
                className="w-full pl-12 pr-4 py-4 bg-[#1B2336] rounded-2xl border border-slate-700/60 text-slate-100 text-lg font-mono placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:shadow-[0_0_15px_rgba(139,92,246,0.15)] transition-all"
                autoFocus
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-mono">Example of valid verified key: REG-2026-XXXX</p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
              <p className="text-red-400 text-xs font-semibold">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-slate-100 rounded-2xl font-extrabold text-base tracking-wide transition-all shadow-lg shadow-purple-600/20 active:scale-[0.99]"
          >
            Check User & Dispatch Food →
          </button>
        </form>

        {/* Helpful hints */}
        <div className="border-t border-slate-800/80 pt-6 mt-8 flex items-center justify-between text-xs text-slate-500">
          <span>Counter cashier connection: <strong className="text-green-500 font-bold">Online</strong></span>
          <span>System Version 2.4.0</span>
        </div>
      </div>
    </div>
  );
}
