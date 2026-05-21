import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function StaffScan() {
  const [regId, setRegId] = useState('');
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const navigate = useNavigate();
  const scannerRef = useRef(null);

  // Real-Time Webcam QR Scanning Engine Lifecycle hook
  useEffect(() => {
    if (!isScanning) return;

    setError('');
    // Delayed startup to guarantee HTML elements have fully mounted in the DOM
    const timer = setTimeout(() => {
      try {
        if (typeof Html5Qrcode === 'undefined') {
          setError("Webcam engine not loaded yet. Check internet connection.");
          setIsScanning(false);
          return;
        }

        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        html5QrCode.start(
          { facingMode: "user" }, // Perfect for PC Webcams
          {
            fps: 15,
            qrbox: { width: 220, height: 220 }
          },
          (decodedText) => {
            const cleanId = decodedText.trim().toUpperCase();
            
            // Verify customer exists inside registered local database
            const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
            const userExists = mockUsers.find(u => u.id === cleanId);
            
            if (userExists) {
              // Successfully decoded and verified -> Stop camera and redirect
              html5QrCode.stop().then(() => {
                scannerRef.current = null;
                setIsScanning(false);
                navigate(`/staff/order/${cleanId}`);
              }).catch(err => {
                scannerRef.current = null;
                setIsScanning(false);
                navigate(`/staff/order/${cleanId}`);
              });
            } else {
              setError(`Scanned key '${cleanId}' was not found in verified database.`);
              html5QrCode.stop().then(() => {
                scannerRef.current = null;
                setIsScanning(false);
              });
            }
          },
          (err) => {
            // Silent block to prevent console log floods on raw camera frames
          }
        ).catch(err => {
          console.error("Camera startup failed:", err);
          setError("Webcam access denied. Please grant camera permission in your browser.");
          setIsScanning(false);
        });
      } catch (err) {
        console.error("Scanner exception:", err);
        setError("Scanning engine failed to initialize.");
        setIsScanning(false);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(err => console.log("Silent stop error:", err));
          scannerRef.current = null;
        } catch (e) {}
      }
    };
  }, [isScanning, navigate]);

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

    const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const userExists = mockUsers.find(u => u.id === cleanId);

    if (!userExists) {
      setError('This Registration Number was not found. Please verify user signup status.');
      return;
    }

    setError('');
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

        {/* Real-time Camera QR Scanner Trigger and Fields */}
        <div className="space-y-6 relative z-10">
          
          {/* A. Dynamic scan button trigger */}
          <button 
            type="button"
            onClick={() => setIsScanning(true)}
            className="w-full py-4 bg-[#1B2336] hover:bg-slate-800 text-purple-400 hover:text-purple-300 rounded-2xl font-extrabold text-base tracking-wide border border-purple-500/25 flex items-center justify-center gap-3 transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] active:scale-[0.99]"
          >
            📷 Open PC Camera to Scan QR
          </button>

          {/* Separation matrix bar */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-[1px] bg-slate-800/80" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Or enter manually</span>
            <div className="flex-1 h-[1px] bg-slate-800/80" />
          </div>

          {/* B. Manual Form entry fallback */}
          <form onSubmit={handleScanSubmit} className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Manual Registration ID</label>
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
                />
              </div>
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
        </div>

        {/* Helpful hints */}
        <div className="border-t border-slate-800/80 pt-6 mt-8 flex items-center justify-between text-xs text-slate-500">
          <span>Webcam scan mode: <strong className="text-purple-400 font-bold">Ready</strong></span>
          <span>System Version 2.5.0</span>
        </div>
      </div>

      {/* C. GLASSMORPHIC REAL-TIME WEBCAM CAMERA MODAL OVERLAY */}
      {isScanning && (
        <div className="fixed inset-0 bg-[#0B0F19]/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#121A2F] border border-slate-700/80 rounded-[32px] p-8 max-w-md w-full text-center shadow-[0_0_80px_rgba(139,92,246,0.15)] animate-in fade-in zoom-in duration-300">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <strong className="text-base text-slate-200">📷 Real-Time QR Scanner</strong>
              <button 
                onClick={() => setIsScanning(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-bold transition-colors"
              >
                Close Camera
              </button>
            </div>

            {/* Webcam Video Viewport Container */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-purple-500/30 bg-[#161a22] shadow-inner mb-6 mx-auto w-full aspect-square max-w-[280px]">
              {/* Dynamic canvas tag target */}
              <div id="reader" className="w-full h-full object-cover" />
              
              {/* Animated scanning scanning target line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-purple-500 animate-bounce shadow-[0_0_15px_#8b5cf6]" />
            </div>

            <p className="text-xs text-slate-400">Position the customer's mobile profile QR Code within the camera frame for instant check-in detection.</p>
          </div>
        </div>
      )}
    </div>
  );
}
