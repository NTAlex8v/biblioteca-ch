import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';

interface FirebaseServerServices {
    firebaseApp: App;
    firestore: Firestore;
}

let services: FirebaseServerServices | null = null;
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

export function initializeFirebase(): FirebaseServerServices {
    if (services) {
        return services;
    }

    if (!serviceAccount) {
        throw new Error("Service account credentials are not available. Make sure FIREBASE_SERVICE_ACCOUNT environment variable is set.");
    }

    const app = !getApps().length 
        ? initializeApp({
            credential: cert(serviceAccount),
            databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
            storageBucket: `${firebaseConfig.projectId}.appspot.com`
          }) 
        : getApp();

    const firestore = getFirestore(app);
    
    services = {
        firebaseApp: app,
        firestore: firestore,
    };
    
    return services;
}
