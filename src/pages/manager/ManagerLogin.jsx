import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  verifyPassword, getOrCreateTOTPSecret, getTOTPUri,
  verifyTOTP, completeLogin, registerManager, sendOTPEmail
} from '../../services/auth';
import { saveManagerProfile } from '../../services/db';
import { Lock, Mail, Shield, Eye, EyeOff, AlertCircle, ChefHat, User, Phone } from 'lucide-react';
import './manager.css';

// Steps: 'password' | 'register' | 'verify_registration_email' | 'setup_totp' | 'verify_totp'
const ManagerLogin = ({ onLogin }) => {
  const [step, setStep]                     = useState('password');
  const [name, setName]                     = useState('');
  const [phone, setPhone]                   = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [otp, setOtp]                       = useState('');
  const [emailVerificationOtp, setEmailVerificationOtp] = useState('');
  const [sentOtp, setSentOtp]               = useState('');
  const [pendingRegistrationData, setPendingRegistrationData] = useState(null);
  const [error, setError]                   = useState('');
  const [showPass, setShowPass]             = useState(false);
  const [loading, setLoading]               = useState(false);
  const [totpUri, setTotpUri]               = useState('');

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await verifyPassword(email, password);
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }

      const secret = getOrCreateTOTPSecret(email);
      const uri    = getTOTPUri(email, secret);
      setTotpUri(uri);

      const verifiedKey = `kds_totp_verified_${email}`;
      const isFirstTime = !localStorage.getItem(verifiedKey);
      setStep(isFirstTime ? 'setup_totp' : 'verify_totp');
    } catch (err) {
      setError(err.message || 'An error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name.trim() || !phone.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      // 1. Generate secure 6-digit OTP code for email verification
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

      // 2. Dispatch OTP verification email to user using their credentials
      const isSent = await sendOTPEmail(email, generatedOtp);
      if (!isSent) {
        setError('Failed to send verification email. Please verify your email address is correct.');
        setLoading(false);
        return;
      }

      // 3. Keep registration info temporarily
      setPendingRegistrationData({ email, password, name, phone });
      setSentOtp(generatedOtp);
      setStep('verify_registration_email');
    } catch (err) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationOtpVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (emailVerificationOtp !== sentOtp) {
      setError('Invalid or expired verification code. Please check your email and try again.');
      setLoading(false);
      return;
    }

    try {
      // 1. Create the Firebase Auth account
      const result = await registerManager(
        pendingRegistrationData.email,
        pendingRegistrationData.password,
        pendingRegistrationData.name
      );

      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // 2. Persist the metadata (Name, Phone Number, Email) inside Firestore
      await saveManagerProfile(pendingRegistrationData.email, {
        name: pendingRegistrationData.name,
        phone: pendingRegistrationData.phone,
        email: pendingRegistrationData.email
      });

      // 3. Proceed directly to Two-Factor Authenticator Setup
      const secret = getOrCreateTOTPSecret(pendingRegistrationData.email);
      const uri    = getTOTPUri(pendingRegistrationData.email, secret);
      setTotpUri(uri);
      
      const verifiedKey = `kds_totp_verified_${pendingRegistrationData.email}`;
      localStorage.setItem(verifiedKey, '1');
      setStep('setup_totp');
    } catch (err) {
      setError(err.message || 'An error occurred during registration verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleTotpVerify = (e) => {
    e.preventDefault();
    setError('');
    const valid = verifyTOTP(email, otp);
    if (!valid) {
      setError('Invalid or expired code. Try again.');
      setOtp('');
      return;
    }
    const verifiedKey = `kds_totp_verified_${email}`;
    localStorage.setItem(verifiedKey, '1');
    const session = completeLogin(email);
    onLogin(session);
  };

  return (
    <div className="login-page">
      <div className="login-card card">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-icon">
            <ChefHat size={28} />
          </div>
          <h2>KDS Manager</h2>
          <p className="text-secondary">Secure Operations Dashboard</p>
        </div>

        {/* ── Step 1: Password ── */}
        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="login-form">
            <h3>Sign In</h3>
            <p className="text-secondary mb-4" style={{fontSize:'0.85rem'}}>
              Demo credentials: <span className="font-mono" style={{color:'var(--text-primary)'}}>manager@restaurant.com / admin1234</span>
            </p>

            {error && (
              <div className="alert alert-error mb-3">
                <AlertCircle size={16} />{error}
              </div>
            )}

            <div className="form-field">
              <label>Email Address</label>
              <div className="input-icon-wrap">
                <Mail size={16} className="input-icon" />
                <input id="manager-email" className="input input-padded" type="email"
                  placeholder="manager@restaurant.com" value={email}
                  onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="form-field">
              <label>Password</label>
              <div className="input-icon-wrap">
                <Lock size={16} className="input-icon" />
                <input id="manager-password" className="input input-padded" type={showPass ? 'text' : 'password'}
                  placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="input-icon-right" onClick={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <button id="login-submit" className="btn btn-primary btn-lg w-full mt-4" disabled={loading}>
              {loading ? 'Verifying...' : 'Continue →'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: '#888888' }}>
              Don't have an account?{' '}
              <button type="button" className="btn btn-link" style={{ display: 'inline', padding: 0, fontSize: '0.85rem', color: 'var(--primary)', cursor: 'pointer', background: 'none', border: 'none' }} onClick={() => { setStep('register'); setError(''); }}>
                Create Account
              </button>
            </p>
          </form>
        )}

        {/* ── Step 1.2: Register Account ── */}
        {step === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="login-form">
            <h3>Create Account</h3>
            <p className="text-secondary mb-4" style={{fontSize:'0.85rem'}}>
              Sign up as a shop owner to manage your restaurant.
            </p>

            {error && (
              <div className="alert alert-error mb-3">
                <AlertCircle size={16} />{error}
              </div>
            )}

            <div className="form-field">
              <label>Manager Name</label>
              <div className="input-icon-wrap">
                <User size={16} className="input-icon" />
                <input className="input input-padded" type="text"
                  placeholder="e.g. Chef Marco" value={name}
                  onChange={e => setName(e.target.value)} required />
              </div>
            </div>

            <div className="form-field">
              <label>Phone Number</label>
              <div className="input-icon-wrap">
                <Phone size={16} className="input-icon" />
                <input className="input input-padded" type="tel"
                  placeholder="e.g. +94 77 123 4567" value={phone}
                  onChange={e => setPhone(e.target.value)} required />
              </div>
            </div>

            <div className="form-field">
              <label>Email Address</label>
              <div className="input-icon-wrap">
                <Mail size={16} className="input-icon" />
                <input className="input input-padded" type="email"
                  placeholder="manager@restaurant.com" value={email}
                  onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="form-field">
              <label>Password</label>
              <div className="input-icon-wrap">
                <Lock size={16} className="input-icon" />
                <input className="input input-padded" type={showPass ? 'text' : 'password'}
                  placeholder="Min. 6 characters" value={password}
                  onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="input-icon-right" onClick={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <button className="btn btn-primary btn-lg w-full mt-4" disabled={loading}>
              {loading ? 'Sending Code...' : 'Register Account →'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: '#888888' }}>
              Already have an account?{' '}
              <button type="button" className="btn btn-link" style={{ display: 'inline', padding: 0, fontSize: '0.85rem', color: 'var(--primary)', cursor: 'pointer', background: 'none', border: 'none' }} onClick={() => { setStep('password'); setError(''); }}>
                Sign In
              </button>
            </p>
          </form>
        )}

        {/* ── Step 1.3: Verify Email OTP sent during Registration ── */}
        {step === 'verify_registration_email' && (
          <form onSubmit={handleRegistrationOtpVerify} className="login-form">
            <div className="totp-setup-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
              <Mail size={28} color="var(--primary)" />
              <h3 style={{ margin: 0 }}>Verify Email Code</h3>
            </div>
            <p className="text-secondary mb-4" style={{ fontSize: '0.85rem', textAlign: 'center', marginTop: '8px' }}>
              We've sent a 6-digit verification code to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>. Please enter it below.
            </p>

            {error && (
              <div className="alert alert-error mb-3">
                <AlertCircle size={16} />{error}
              </div>
            )}

            <div className="form-field">
              <label>6-Digit Verification Code</label>
              <input className="input otp-input" type="text"
                inputMode="numeric" maxLength={6} pattern="[0-9]{6}"
                placeholder="000000" value={emailVerificationOtp}
                onChange={e => setEmailVerificationOtp(e.target.value.replace(/\D/g, ''))} required />
            </div>

            {/* Developer Mode OTP Assistant */}
            <div className="dev-helper-alert" style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', border: '1px dashed var(--preparing)', backgroundColor: 'rgba(249, 115, 22, 0.08)', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--preparing)', opacity: 0.9 }}>
                <strong>🔧 Developer Helper:</strong> SMTPJS.com is globally defunct. We have printed the OTP to the browser console and display it here for testing:
              </p>
              <div style={{ marginTop: '8px', fontSize: '1.4rem', fontWeight: '800', letterSpacing: '6px', color: 'var(--primary)' }}>
                {sentOtp}
              </div>
            </div>

            <button className="btn btn-primary btn-lg w-full mt-4" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Code & Create Account →'}
            </button>

            <button type="button" className="btn btn-ghost w-full mt-2"
              onClick={() => { setStep('register'); setEmailVerificationOtp(''); setError(''); }}>
              ← Back
            </button>
          </form>
        )}

        {/* ── Step 1.5: TOTP Setup (first time) ── */}
        {step === 'setup_totp' && (
          <div className="login-form">
            <div className="totp-setup-header">
              <Shield size={22} color="var(--preparing)" />
              <h3>Set Up Two-Factor Auth</h3>
            </div>
            <p className="text-secondary mb-4" style={{fontSize:'0.88rem'}}>
              Scan this QR code with <strong>Google Authenticator</strong> or <strong>Authy</strong>, then enter the code below to activate 2FA.
            </p>
            <div className="qr-wrap">
              <div className="qr-inner">
                <QRCodeSVG value={totpUri} size={180} level="H" includeMargin />
              </div>
            </div>
            <button className="btn btn-primary w-full mt-4" onClick={() => setStep('verify_totp')}>
              I've scanned it →
            </button>
          </div>
        )}

        {/* ── Step 2: OTP Entry ── */}
        {step === 'verify_totp' && (
          <form onSubmit={handleTotpVerify} className="login-form">
            <div className="totp-setup-header">
              <Shield size={22} color="var(--preparing)" />
              <h3>Enter 2FA Code</h3>
            </div>
            <p className="text-secondary mb-4" style={{fontSize:'0.88rem'}}>
              Open your authenticator app and enter the 6-digit code.
            </p>

            {error && (
              <div className="alert alert-error mb-3">
                <AlertCircle size={16} />{error}
              </div>
            )}

            <div className="form-field">
              <label>6-Digit Code</label>
              <input id="otp-input" className="input otp-input" type="text"
                inputMode="numeric" maxLength={6} pattern="[0-9]{6}"
                placeholder="000000" value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} required />
            </div>

            <button id="otp-submit" className="btn btn-primary btn-lg w-full mt-4">
              Verify & Sign In
            </button>

            <button type="button" className="btn btn-ghost w-full mt-2"
              onClick={() => { setStep('password'); setOtp(''); setError(''); }}>
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ManagerLogin;
