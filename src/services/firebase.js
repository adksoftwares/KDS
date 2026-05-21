import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCQCuiJI3nGhAEM4_y8BCBGtfgyBGkPS9c",
  authDomain: "live-kitchen-display.firebaseapp.com",
  projectId: "live-kitchen-display",
  storageBucket: "live-kitchen-display.firebasestorage.app",
  messagingSenderId: "436041295134",
  appId: "1:436041295134:web:d13181f95da5ba93f7d50f",
  measurementId: "G-LWHN1E1H0X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
