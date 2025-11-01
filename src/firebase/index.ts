
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
  const functions = getFunctions(app);

  if (process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST) {
    console.log("Using Firebase Emulators");
    // It's important to check if the functions emulator is running before connecting.
    // The other services handle this gracefully, but functions does not.
    // You can't just connect to a port if the service isn't there.
    // This logic assumes you are running all emulators on the same host.
    const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST.split(':')[0];
    
    // Check if the functions emulator is explicitly enabled via an env var
    // as it's not always running in all dev environments.
    if (process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_PORT) {
        try {
            // Attempt to connect. This might still fail if the port is specified but not running,
            // but it's a more deliberate attempt.
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
