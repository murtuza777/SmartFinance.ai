import { initializeApp } from 'firebase/app';
import { getAuth, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db }; 

// Simple guest login without Firebase - stores guest name in localStorage
export async function signInAsGuest(guestName?: string) {
  try {
    if (guestName && guestName.trim()) {
      // Store guest info in localStorage
      localStorage.setItem('guestName', guestName.trim());
      localStorage.setItem('isGuest', 'true');
      localStorage.setItem('guestLoginTime', new Date().toISOString());
      return { name: guestName.trim(), isGuest: true };
    }
    throw new Error('Guest name is required');
  } catch (error) {
    console.error("Error signing in as guest:", error);
    throw error;
  }
}

// Get guest info from localStorage
export function getGuestInfo() {
  if (typeof window === 'undefined') return null;
  const isGuest = localStorage.getItem('isGuest') === 'true';
  const guestName = localStorage.getItem('guestName');
  
  if (isGuest && guestName) {
    return { name: guestName, isGuest: true };
  }
  return null;
}

// Logout guest
export function logoutGuest() {
  localStorage.removeItem('guestName');
  localStorage.removeItem('isGuest');
  localStorage.removeItem('guestLoginTime');
}
