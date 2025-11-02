
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// IMPORTANTE: NO MODIFICAR ESTA FUNCIÓN
export function initializeFirebase() {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app);
  const functions = getFunctions(app, 'us-central1'); // Specify region

  if (process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST) {
    console.log("Using Firebase Emulators");
    const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST.split(':')[0];
    
    if (process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_PORT) {
        try {
            // connectFunctionsEmulator(functions, host, parseInt(process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_PORT));
        } catch (e) {
            console.warn("Could not connect to Functions emulator. Are you sure it's running?", e);
        }
    }
  }
  
  return {
    firebaseApp: app,
    auth: auth,
    firestore: firestore,
    storage: storage,
    functions: functions
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';
