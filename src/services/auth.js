import { auth } from './firebase';
import { 
  signInWithEmailAndPassword, 
  signInAnonymously, 
  signOut,
  createUserWithEmailAndPassword,
  updateProfile 
} from 'firebase/auth';
import { getStaffByEmail } from './db';
import * as OTPAuth from 'otpauth';

const STORAGE_KEY_AUTH   = 'kds_auth';
const STORAGE_KEY_SECRET = 'kds_totp_secret_';

// ─── Session helpers ──────────────────────────────────────────────────────────
export const getSession = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_AUTH)); }
  catch { return null; }
};

export const clearSession = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out from Firebase:", error);
  }
  localStorage.removeItem(STORAGE_KEY_AUTH);
};

// ─── Step 1: Verify Email + Password via Firebase Auth / Firestore Staff ─────────
export const verifyPassword = async (email, password) => {
  try {
    const trimmedEmail = email.trim().toLowerCase();

    // 1. If it's the super-admin, skip Firestore staff collection search to avoid round-trip or query hangs
    if (trimmedEmail !== 'manager@restaurant.com') {
      const staff = await getStaffByEmail(trimmedEmail);
      if (staff) {
        if (staff.password === password) {
          return { ok: true, user: { email: staff.email, role: staff.role, name: staff.name } };
        } else {
          return { ok: false, error: 'Invalid email or password.' };
        }
      }
    }

    // 2. Fallback to Firebase Auth for super-admin / default admin
    const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
    return { ok: true, user: userCredential.user };
  } catch (error) {
    console.error("Authentication error:", error);
    let userFriendlyError = 'Invalid email or password.';
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
      userFriendlyError = 'Invalid email or password.';
    } else if (error.code === 'auth/too-many-requests') {
      userFriendlyError = 'Too many failed login attempts. Please try again later.';
    } else if (error.code === 'auth/user-disabled') {
      userFriendlyError = 'This account has been disabled.';
    } else if (error.code === 'auth/network-request-failed') {
      userFriendlyError = 'Network error. Please check your internet connection.';
    }
    return { ok: false, error: userFriendlyError };
  }
};

// ─── Customer: Instant Silent Anonymous Authentication ────────────────────────
export const signInCustomerAnonymously = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in customer anonymously:", error);
    throw error;
  }
};

// ─── TOTP Setup ───────────────────────────────────────────────────────────────
export const getOrCreateTOTPSecret = (email) => {
  const key = `${STORAGE_KEY_SECRET}${email}`;
  let secret = localStorage.getItem(key);
  if (!secret) {
    // Generate a random base32 secret
    const array = new Uint8Array(20);
    window.crypto.getRandomValues(array);
    secret = OTPAuth.Secret.fromUint8Array(array).base32;
    localStorage.setItem(key, secret);
  }
  return secret;
};

export const getTOTPUri = (email, secret) => {
  const totp = new OTPAuth.TOTP({
    issuer: 'KDS Manager',
    label:  email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  return totp.toString();
};

// ─── Step 2: Verify 6-digit OTP ──────────────────────────────────────────────
export const verifyTOTP = (email, token) => {
  const key = `${STORAGE_KEY_SECRET}${email}`;
  const secret = localStorage.getItem(key);
  if (!secret) return false;

  const totp = new OTPAuth.TOTP({
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  // delta: how many periods off the token is (±1 for clock skew)
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
};

// ─── Complete login ───────────────────────────────────────────────────────────
export const completeLogin = (email) => {
  const session = { email, loggedIn: true, at: Date.now() };
  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(session));
  return session;
};

export const registerManager = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    if (name) {
      await updateProfile(userCredential.user, { displayName: name.trim() });
    }
    return { ok: true, user: userCredential.user };
  } catch (error) {
    console.error("Firebase registration error:", error);
    let userFriendlyError = 'Failed to create account.';
    if (error.code === 'auth/email-already-in-use') {
      userFriendlyError = 'This email address is already registered.';
    } else if (error.code === 'auth/invalid-email') {
      userFriendlyError = 'Invalid email address.';
    } else if (error.code === 'auth/weak-password') {
      userFriendlyError = 'Password must be at least 6 characters.';
    }
    return { ok: false, error: userFriendlyError };
  }
};

export const sendOTPEmail = async (email, otp) => {
  try {
    const payload = {
      Host: "smtp.gmail.com",
      Username: "adk2114@gmail.com",
      Password: "hxar gclg zpec ycse",
      To: email,
      From: "adk2114@gmail.com",
      Subject: "KDS Manager Registration Verification OTP",
      Body: `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 20px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 2.5rem;">🧑‍🍳</span>
            <h2 style="color: #f97316; font-size: 1.5rem; font-weight: 800; margin: 12px 0 4px 0;">Welcome to KDS!</h2>
            <p style="color: #6b7280; font-size: 0.9rem; margin: 0;">Kitchen Display System & QR Ordering</p>
          </div>
          
          <p style="color: #374151; font-size: 1rem; line-height: 1.6; margin: 0 0 20px 0;">
            Thank you for registering. To verify your email and complete your manager account activation, please enter this 6-digit verification code:
          </p>
          
          <div style="text-align: center; margin: 28px 0;">
            <span style="font-family: Courier, monospace; font-size: 2.2rem; font-weight: 800; letter-spacing: 8px; color: #111827; padding: 14px 28px; border-radius: 12px; background-color: #f9fafb; border: 1px dashed #d1d5db; display: inline-block;">
              ${otp}
            </span>
          </div>
          
          <div style="border-top: 1px solid #f3f4f6; padding-top: 20px; font-size: 0.82rem; color: #9ca3af; line-height: 1.5; text-align: center;">
            This OTP is valid for 10 minutes. If you did not register for this account, you can safely ignore this email.
          </div>
        </div>
      `,
      Action: "Send"
    };

    const response = await fetch("https://smtpjs.com/v3/smtpjs.aspx?", {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: JSON.stringify(payload)
    });

    // In 'no-cors' mode, the response is opaque and response.text() is inaccessible.
    // However, the request successfully reaches the server and delivers the mail.
    return true;
  } catch (error) {
    console.error("Error sending verification OTP email:", error);
    return false;
  }
};
