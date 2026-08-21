import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAlzt_BU8L6rFI_7ERcKdfiuOAoPG_qFR0",
  authDomain: "cricket-373af.firebaseapp.com",
  databaseURL: "https://cricket-373af-default-rtdb.firebaseio.com",
  projectId: "cricket-373af",
  storageBucket: "cricket-373af.firebasestorage.app",
  messagingSenderId: "790641812011",
  appId: "1:790641812011:web:bb59f01f519693e756806e",
  measurementId: "G-X012VW1BLR"
};

export const firebaseConfigured = Object.values(firebaseConfig).every(Boolean);
export const fcmVapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

let app = null;
export let db = null;
export let auth = null;
export let storage = null;

if (firebaseConfigured) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
}

export async function getMessagingIfSupported() {
  if (!app || !fcmVapidKey) return null;
  try {
    return (await isSupported()) ? getMessaging(app) : null;
  } catch {
    return null;
  }
}

export { firebaseConfig };
