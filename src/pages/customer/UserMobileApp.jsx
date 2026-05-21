import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUpUser, verifyUserOTP, loginUser, getUserSession, logoutUser } from '../../services/auth';
import { listenToUserActiveOrders, acknowledgeOrderBell } from '../../services/db';
import { QRCodeSVG } from 'qrcode.react';

export default function UserMobileApp() {
  const [view, setView] = useState('register'); // register | verify | login | profile
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [loginEmail, setLoginEmail] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [activeOrders, setActiveOrders] = useState([]);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBellModal, setShowBellModal] = useState(false);
  const [lastReadyOrder, setLastReadyOrder] = useState(null);
  
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const bellAudioRef = useRef(null);

  // Load existing session on mount
  useEffect(() => {
    const session = getUserSession();
    if (session) {
      setCurrentUser(session);
      setView('profile');
    }
  }, []);

  // Listen to active orders in real-time when in profile view
  useEffect(() => {
    if (!currentUser || view !== 'profile') return;

    const unsubscribe = listenToUserActiveOrders(currentUser.id, (orders) => {
      setActiveOrders(orders);

      // Check if there is an active order with completed status and bell_triggered = true
      const triggeredOrder = orders.find(o => o.status === 'completed' && o.bell_triggered === true);
      if (triggeredOrder) {
        // Trigger high-decibel bell chime
        playBellChime();
        setLastReadyOrder(triggeredOrder);
        setShowBellModal(true);
        
        // Acknowledge bell trigger to avoid repeating chimes on reload
        acknowledgeOrderBell(triggeredOrder.id);
      }
    });

    return () => unsubscribe();
  }, [currentUser, view]);

  const [audioAlertsPrimed, setAudioAlertsPrimed] = useState(false);

  const playSynthesizedBell = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const ringTone = (time, frequency, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, time);
        gain.gain.setValueAtTime(0.6, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };

      const now = ctx.currentTime;
      ringTone(now, 880, 1.2);
      ringTone(now + 0.08, 1320, 1.0);
      ringTone(now + 0.35, 880, 1.2);
      ringTone(now + 0.43, 1320, 1.0);
    } catch (e) {
      console.warn("Synthesizer chime failed:", e);
    }
  };

  const primeAudioContext = () => {
    playSynthesizedBell();
    setAudioAlertsPrimed(true);
  };

  const playBellChime = () => {
    // 1. Play Synthesized Chime (Guaranteed browser-native double chime)
    playSynthesizedBell();

    // 2. Play Physical Audio WAV File
    if (bellAudioRef.current) {
      bellAudioRef.current.currentTime = 0;
      bellAudioRef.current.play().catch(err => {
        console.warn("Audio file playback blocked, synthesized chime played.", err);
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      setError('Please fill in all details.');
      return;
    }
    setError('');
    setLoading(true);
    
    const res = await signUpUser(name, email, phone);
    setLoading(false);
    
    if (res.ok) {
      setSimulatedOtp(res.simulatedOtp);
      setView('verify');
    } else {
      setError(res.error || 'Failed to sign up.');
    }
  };

  const handleOtpChange = (index, val) => {
    if (isNaN(val)) return;
    const newOtp = [...otpCode];
    newOtp[index] = val.substring(val.length - 1);
    setOtpCode(newOtp);

    // Auto-focus next field
    if (val && index < 5) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const code = otpCode.join('');
    if (code.length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setError('');
    setLoading(true);

    const res = await verifyUserOTP(email, code);
    setLoading(false);

    if (res.ok) {
      setCurrentUser(res.user);
      setView('profile');
    } else {
      setError(res.error || 'Invalid OTP.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail) {
      setError('Please enter your email.');
      return;
    }
    setError('');
    setLoading(true);

    const res = await loginUser(loginEmail);
    setLoading(false);

    if (res.ok) {
      setCurrentUser(res.user);
      setView('profile');
    } else {
      setError(res.error || 'Login failed.');
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setView('register');
    setName('');
    setEmail('');
    setPhone('');
    setOtpCode(['', '', '', '', '', '']);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-purple-500/30">
      {/* Dynamic service bell audio source */}
      <audio 
        ref={bellAudioRef} 
        src="https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav" 
        preload="auto"
      />

      {/* Modern High-End Phone Frame Mockup Viewport */}
      <div className="w-full max-w-[400px] h-[780px] bg-[#101625] rounded-[48px] border-4 border-slate-800 shadow-[0_0_80px_rgba(139,92,246,0.15)] flex flex-col overflow-hidden relative">
        {/* Smartphone Speaker / Notch Banner */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center">
          <div className="w-12 h-1 bg-slate-900 rounded-full" />
        </div>

        {/* Viewport content area */}
        <div className="flex-1 flex flex-col px-6 pt-10 pb-6 overflow-y-auto custom-scrollbar">
          
          {/* A. REGISTRATION VIEW */}
          {view === 'register' && (
            <div className="flex-1 flex flex-col justify-between pt-4">
              <div>
                <div className="text-center mb-6">
                  <span className="text-4xl inline-block animate-bounce mt-2">📱</span>
                  <h1 className="text-2xl font-extrabold tracking-tight mt-2 text-slate-100">Create Account</h1>
                  <p className="text-slate-400 text-xs mt-1">Get your unique QR code for instant counter checkouts</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="John Doe" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-[#1B2336] rounded-xl border border-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="john@example.com" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-[#1B2336] rounded-xl border border-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="+94 77 123 4567" 
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-[#1B2336] rounded-xl border border-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-all text-sm"
                    />
                  </div>

                  {error && <p className="text-red-400 text-xs font-medium text-center">{error}</p>}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-slate-100 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-purple-600/20 active:scale-[0.98] transition-all"
                  >
                    {loading ? 'Initiating Verification...' : 'Send Verification OTP'}
                  </button>
                </form>
              </div>

              <div className="text-center mt-6">
                <p className="text-slate-400 text-xs">
                  Already have an account?{' '}
                  <button onClick={() => { setView('login'); setError(''); }} className="text-purple-400 font-bold hover:underline">
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* B. OTP VERIFICATION VIEW */}
          {view === 'verify' && (
            <div className="flex-1 flex flex-col justify-between pt-4">
              <div>
                <div className="text-center mb-6">
                  <span className="text-4xl inline-block mt-2">✉️</span>
                  <h1 className="text-2xl font-extrabold tracking-tight mt-2 text-slate-100">Verify Email</h1>
                  <p className="text-slate-400 text-xs mt-1">We sent a 6-digit OTP code to <br/><strong className="text-slate-200">{email}</strong></p>
                </div>

                <div className="space-y-6">
                  {/* Code Grid Input */}
                  <div className="flex justify-between gap-2">
                    {otpCode.map((digit, idx) => (
                      <input 
                        key={idx}
                        ref={otpRefs[idx]}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={e => handleOtpChange(idx, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                        className="w-12 h-14 text-center bg-[#1B2336] rounded-xl border border-slate-700/50 text-slate-100 text-xl font-bold focus:outline-none focus:border-purple-500 focus:shadow-[0_0_10px_rgba(139,92,246,0.2)] transition-all"
                      />
                    ))}
                  </div>

                  {simulatedOtp && (
                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-center">
                      <span className="text-xs text-purple-300 block font-semibold mb-1">Simulated OTP Code (For Demo)</span>
                      <strong className="text-lg tracking-widest text-purple-200 font-mono">{simulatedOtp}</strong>
                    </div>
                  )}

                  {error && <p className="text-red-400 text-xs font-medium text-center">{error}</p>}

                  <button 
                    onClick={handleVerifyOTP} 
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-slate-100 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-purple-600/20 active:scale-[0.98] transition-all"
                  >
                    {loading ? 'Verifying OTP...' : 'Verify & Activate'}
                  </button>
                </div>
              </div>

              <div className="text-center mt-6">
                <button onClick={() => setView('register')} className="text-slate-400 text-xs hover:text-slate-300 transition-colors">
                  ← Back to Sign Up
                </button>
              </div>
            </div>
          )}

          {/* C. SIGN IN / LOGIN VIEW */}
          {view === 'login' && (
            <div className="flex-1 flex flex-col justify-between pt-4">
              <div>
                <div className="text-center mb-6">
                  <span className="text-4xl inline-block mt-2">🔐</span>
                  <h1 className="text-2xl font-extrabold tracking-tight mt-2 text-slate-100">Welcome Back</h1>
                  <p className="text-slate-400 text-xs mt-1">Sign in to access your digital ID & live food orders</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="john@example.com" 
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-[#1B2336] rounded-xl border border-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-all text-sm"
                    />
                  </div>

                  {error && <p className="text-red-400 text-xs font-medium text-center">{error}</p>}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-slate-100 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-purple-600/20 active:scale-[0.98] transition-all"
                  >
                    {loading ? 'Signing In...' : 'Verify Email & Sign In'}
                  </button>
                </form>
              </div>

              <div className="text-center mt-6">
                <p className="text-slate-400 text-xs">
                  Don't have an account?{' '}
                  <button onClick={() => { setView('register'); setError(''); }} className="text-purple-400 font-bold hover:underline">
                    Register
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* D. LIVE PROFILE DASHBOARD */}
          {view === 'profile' && currentUser && (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                {/* Header Profile Info */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4 mt-2">
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Digital Profile</span>
                    <strong className="text-base text-slate-100 font-extrabold">{currentUser.name}</strong>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded-lg font-bold transition-colors"
                  >
                    Logout
                  </button>
                </div>

                {/* Digital ID QR Code Card */}
                <div className="bg-gradient-to-br from-[#1E294B] to-[#121A2F] border border-slate-700/50 rounded-3xl p-5 text-center shadow-lg mb-6 relative overflow-hidden group">
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-purple-500/10 rounded-full blur-xl" />
                  
                  <span className="text-xs font-bold text-slate-300 block mb-1">Your Scan Ticket ID</span>
                  <strong className="text-lg text-purple-400 tracking-wider font-mono select-all block">{currentUser.id}</strong>

                  {/* QR Code Container */}
                  <div className="w-48 h-48 bg-white p-3 rounded-2xl mx-auto my-4 shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex items-center justify-center relative">
                    <QRCodeSVG 
                      value={currentUser.id}
                      size={160}
                      bgColor={"#ffffff"}
                      fgColor={"#0f172a"}
                      level={"H"}
                      includeMargin={false}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Present this QR code to the cashier counter to register your food items.</p>
                </div>

                {/* Visual Audio Alert Primer Banner */}
                {!audioAlertsPrimed ? (
                  <button
                    onClick={primeAudioContext}
                    className="w-full mb-6 p-4 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 rounded-[20px] flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                  >
                    <span className="text-xl animate-bounce">🛎️</span>
                    <div className="text-left">
                      <span className="text-[11px] font-extrabold text-amber-300 uppercase tracking-widest block">Enable Audio Alerts</span>
                      <span className="text-[9px] text-amber-400/80 block">Click to unlock and test digital double service bell</span>
                    </div>
                  </button>
                ) : (
                  <div className="w-full mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-[20px] flex items-center justify-center gap-3">
                    <span className="text-xl">🔔</span>
                    <div className="text-left">
                      <span className="text-[11px] font-extrabold text-green-400 uppercase tracking-widest block">Chime Alert Primed</span>
                      <span className="text-[9px] text-green-500/80 block">Double electronic bell notification active</span>
                    </div>
                  </div>
                )}

                {/* Real-Time Food Preparation Queue status */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Active Orders</h3>

                  {activeOrders.length === 0 ? (
                    <div className="p-4 bg-[#141A2A]/40 border border-dashed border-slate-800 rounded-2xl text-center py-6">
                      <span className="text-2xl block mb-1">🛎️</span>
                      <p className="text-xs text-slate-500">No active checkout rows. Visit the counter cashier to place an order.</p>
                    </div>
                  ) : (
                    activeOrders.map(order => (
                      <div key={order.id} className="p-4 bg-[#141A2A] border border-slate-800/80 rounded-2xl flex flex-col gap-2 relative overflow-hidden">
                        {/* Order Phase Indicator Accent */}
                        <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                          order.status === 'completed' ? 'bg-green-500' :
                          order.status === 'preparing' ? 'bg-purple-500 animate-pulse' : 'bg-amber-500'
                        }`} />

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                          <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full tracking-wider ${
                            order.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            order.status === 'preparing' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {order.status === 'completed' ? 'Cooked / Ready' : order.status}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-slate-200">
                          {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                        </div>

                        {order.status !== 'completed' ? (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex gap-0.5">
                              <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce delay-100" />
                              <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce delay-200" />
                              <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce delay-300" />
                            </div>
                            <span className="text-[10px] text-purple-400 font-semibold">Kitchen is cooking...</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-green-400 font-bold flex items-center gap-1 mt-1">
                            <span>✅</span> Food cooked! Pick up at the counter.
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Status footer info */}
              <div className="text-center mt-6 text-[10px] text-slate-500 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live Notification Channel Active
              </div>
            </div>
          )}

        </div>
      </div>

      {/* STUNNING ANIMATED ALERTS BELL CHIME MODAL (TRIGGERS INSTANTLY ON USER'S DEVICE) */}
      {showBellModal && lastReadyOrder && (
        <div className="fixed inset-0 bg-[#0B0F19]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121A2F] border border-slate-700/80 rounded-[32px] p-8 max-w-sm w-full text-center shadow-[0_0_80px_rgba(16,185,129,0.2)] animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <span className="text-4xl">🔔</span>
            </div>
            
            <span className="text-xs font-bold text-green-400 uppercase tracking-widest block mb-1">Food Ready!</span>
            <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">Order is Cooked</h2>
            
            <div className="my-5 p-4 bg-[#1B2336] rounded-2xl border border-slate-800 text-left">
              <div className="text-xs text-slate-400 font-mono mb-1">Ticket ID: #{lastReadyOrder.id.slice(-6).toUpperCase()}</div>
              <strong className="text-sm text-slate-200 block">{lastReadyOrder.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</strong>
            </div>

            <p className="text-xs text-slate-400 mb-6">Please head over to the food collection counter. Ringing chime alert verified!</p>

            <button 
              onClick={() => {
                setShowBellModal(false);
                setLastReadyOrder(null);
              }}
              className="w-full py-3.5 bg-green-600 hover:bg-green-500 text-slate-100 rounded-xl font-extrabold text-sm tracking-wide transition-all shadow-lg shadow-green-600/20"
            >
              Collect Food
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
