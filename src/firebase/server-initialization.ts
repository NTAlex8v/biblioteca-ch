
import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';

// This file is intended for server-side use ONLY, specifically in Firebase Functions.

interface FirebaseServerServices {
    firebaseApp: App;
    firestore: Firestore;
}

// Memoization variable to ensure Firebase Admin is initialized only once.
let services: FirebaseServerServices | null = null;
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

/**
 * Initializes and/or returns the Firebase Admin app and Firestore instances for server-side operations.
 * This function ensures that Firebase Admin is initialized only once per server instance.
 */
export function initializeFirebase(): FirebaseServerServices {
    if (services) {
        return services;
    }

    const app = !getApps().length 
        ? initializeApp({
            credential: serviceAccount ? cert(serviceAccount) : undefined,
            databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
          }) 
        : getApp();

    const firestore = getFirestore(app);
    
    services = {
        firebaseApp: app,
        firestore: firestore,
    };
    
    return services;
}
