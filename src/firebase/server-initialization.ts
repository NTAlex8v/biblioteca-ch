
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// This file is intended for server-side use ONLY.

interface FirebaseServerServices {
    firebaseApp: FirebaseApp;
    firestore: Firestore;
}

// Memoization variable to ensure Firebase is initialized only once on the server.
let services: FirebaseServerServices | null = null;

/**
 * Initializes and/or returns the Firebase app and Firestore instances for server-side operations.
 * This function ensures that Firebase is initialized only once per server instance.
 *
 * IMPORTANT: This should ONLY be used in server components (pages, layouts) for data fetching.
 *
 * @returns An object containing the initialized FirebaseApp and Firestore instances.
 */
export function initializeFirebase(): FirebaseServerServices {
    if (services) {
        return services;
    }

    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const firestore = getFirestore(app);
    
    services = {
        firebaseApp: app,
        firestore: firestore,
    };
    
    return services;
}
