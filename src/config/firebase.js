import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_CONFIG = {
  apiKey: 'AIzaSyALrN3HqiDjfhY3CzUDHQs8xIeZ28jvZhI',
  authDomain: 'projeto-plat-moveis-26.firebaseapp.com',
  databaseURL: 'https://projeto-plat-moveis-26-default-rtdb.firebaseio.com',
  projectId: 'projeto-plat-moveis-26',
  storageBucket: 'projeto-plat-moveis-26.firebasestorage.app',
  messagingSenderId: '1062134800411',
  appId: '1:1062134800411:web:ef21d894d574ce290e98be',
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || DEFAULT_CONFIG.apiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || DEFAULT_CONFIG.authDomain,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || DEFAULT_CONFIG.databaseURL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || DEFAULT_CONFIG.projectId,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || DEFAULT_CONFIG.storageBucket,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_CONFIG.messagingSenderId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || DEFAULT_CONFIG.appId,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth persists the login in AsyncStorage. initializeAuth throws if called twice
// (fast refresh), so we fall back to getAuth.
function createAuth() {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();
export const db = getDatabase(app);
export const storage = getStorage(app);
