
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc, getFirestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, IdTokenResult } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  
  // User authentication state
  user: User | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener

  // User claims state
  claims: IdTokenResult['claims'] | null;
  isLoadingClaims: boolean;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUserClaims()
export interface UserClaimsHookResult {
    claims: IdTokenResult['claims'] | null;
    isLoadingClaims: boolean;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services, user authentication state,
 * and custom claims state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userState, setUserState] = useState<{
    user: User | null;
    isUserLoading: boolean;
    userError: Error | null;
  }>({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  const [claimsState, setClaimsState] = useState<{
    claims: IdTokenResult['claims'] | null;
    isLoadingClaims: boolean;
  }>({
    claims: null,
    isLoadingClaims: true,
  });

  // Effect to subscribe to Firebase auth state changes and manage claims
  useEffect(() => {
    if (!auth || !firestore) {
      setUserState({ user: null, isUserLoading: false, userError: new Error("Auth or Firestore service not provided.") });
      setClaimsState({ claims: null, isLoadingClaims: false });
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setUserState({ user: firebaseUser, isUserLoading: false, userError: null });

        if (firebaseUser) {
          setClaimsState(prevState => ({ ...prevState, isLoadingClaims: true }));
          try {
            // First, get the real claims from the token.
            const idTokenResult = await firebaseUser.getIdTokenResult(true);
            let finalClaims = idTokenResult.claims;

            // --- DEVELOPMENT OVERRIDE ---
            // In a real app, custom claims are set by a backend. Here, we read the user's
            // document from Firestore to simulate the 'Admin' role for development purposes.
            const userDocRef = doc(firestore, "users", firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists() && userDocSnap.data().role === 'Admin') {
                // If the user has 'Admin' role in Firestore, we add it to the claims object
                // on the client-side. This allows the UI and API calls to behave as if the
                // user had a real custom claim.
                finalClaims = { ...finalClaims, role: 'Admin' };
            }
             // --- END OVERRIDE ---

            setClaimsState({ claims: finalClaims, isLoadingClaims: false });
          } catch (error) {
            console.error("[FirebaseProvider] Error fetching user data or claims:", error);
            setClaimsState({ claims: null, isLoadingClaims: false });
          }
        } else {
          // No user, clear claims
          setClaimsState({ claims: null, isLoadingClaims: false });
        }
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserState({ user: null, isUserLoading: false, userError: error });
        setClaimsState({ claims: null, isLoadingClaims: false });
      }
    );
    return () => unsubscribe(); // Cleanup
  }, [auth, firestore]);

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      ...userState,
      ...claimsState,
    };
  }, [firebaseApp, firestore, auth, userState, claimsState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

// Base hook to access the full context. Avoid using directly in components.
const useFirebaseContext = (): FirebaseContextState => {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useFirebase must be used within a FirebaseProvider.');
    }
    return context;
};


/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebaseContext();
  if (!auth) throw new Error('Auth service not available. Check FirebaseProvider props.');
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebaseContext();
  if (!firestore) throw new Error('Firestore service not available. Check FirebaseProvider props.');
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebaseContext();
  if (!firebaseApp) throw new Error('Firebase App not available. Check FirebaseProvider props.');
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useFirebaseContext();
  return { user, isUserLoading, userError };
};


/**
 * Hook for accessing the authenticated user's custom claims from the central provider.
 * @returns {UserClaimsHookResult} Object with claims and isLoadingClaims.
 */
export const useUserClaims = (): UserClaimsHookResult => {
  const { claims, isLoadingClaims } = useFirebaseContext();
  return { claims, isLoadingClaims };
};
