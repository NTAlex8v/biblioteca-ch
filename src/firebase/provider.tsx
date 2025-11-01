
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect, useCallback } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, IdTokenResult } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { setDocumentNonBlocking } from './non-blocking-updates';

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

  // User claims state from the user's Firestore document
  claims: { role?: 'Admin' | 'Editor' | 'User' } | null;
  isLoadingClaims: boolean;
  refreshClaims: () => Promise<void>; // Function to manually trigger a claims refresh
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUserClaims()
export interface UserClaimsHookResult {
    claims: { role?: 'Admin' | 'Editor' | 'User' } | null;
    isLoadingClaims: boolean;
    refreshClaims: () => Promise<void>;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services, user authentication state,
 * and role state by reading directly from the user's Firestore document.
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
    claims: { role?: 'Admin' | 'Editor' | 'User' } | null;
    isLoadingClaims: boolean;
  }>({
    claims: null,
    isLoadingClaims: true,
  });

  // This function is now the single source of truth for fetching user data and role.
  const fetchUserAndRole = useCallback(async (firebaseUser: User | null) => {
    setUserState({ user: firebaseUser, isUserLoading: false, userError: null });

    if (firebaseUser && firestore) {
        setClaimsState(prevState => ({ ...prevState, isLoadingClaims: true }));
        try {
            const userDocRef = doc(firestore, "users", firebaseUser.uid);
            
            // Set up a real-time listener for the user's document
            const unsubscribe = onSnapshot(userDocRef, 
              (docSnap) => {
                if (docSnap.exists()) {
                    // Document exists, get the role
                    const userData = docSnap.data();
                    setClaimsState({ claims: { role: userData.role }, isLoadingClaims: false });
                } else {
                    // Document doesn't exist, might be a new user. Create it.
                    const newUserData = {
                        email: firebaseUser.email,
                        name: firebaseUser.displayName,
                        avatarUrl: firebaseUser.photoURL,
                        role: 'User', // Default role
                        createdAt: new Date().toISOString(),
                    };
                    setDocumentNonBlocking(userDocRef, newUserData, { merge: false });
                    setClaimsState({ claims: { role: 'User' }, isLoadingClaims: false });
                }
              },
              (error) => {
                console.error("[FirebaseProvider] Error listening to user document:", error);
                setClaimsState({ claims: null, isLoadingClaims: false });
              }
            );

            // Return the unsubscribe function to be called on cleanup
            return unsubscribe;

        } catch (error) {
            console.error("[FirebaseProvider] Error fetching user role:", error);
            setClaimsState({ claims: null, isLoadingClaims: false });
        }
    } else {
        // No user, clear claims
        setClaimsState({ claims: null, isLoadingClaims: false });
    }
  }, [firestore]);

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth) {
      setUserState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      setClaimsState({ claims: null, isLoadingClaims: false });
      return;
    }
    
    let roleUnsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        // Clean up previous role listener
        if (roleUnsubscribe) {
            roleUnsubscribe();
        }
        // Set up new role listener and get its unsubscribe function
        const unsubscribePromise = fetchUserAndRole(firebaseUser);
        if (unsubscribePromise) {
            roleUnsubscribe = await unsubscribePromise;
        }
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserState({ user: null, isUserLoading: false, userError: error });
        setClaimsState({ claims: null, isLoadingClaims: false });
      }
    );

    return () => {
      authUnsubscribe();
      if (roleUnsubscribe) {
        roleUnsubscribe();
      }
    };
  }, [auth, fetchUserAndRole]);


  const refreshClaims = useCallback(async () => {
    if (userState.user) {
        await fetchUserAndRole(userState.user);
    }
  }, [userState.user, fetchUserAndRole]);

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
      refreshClaims,
    };
  }, [firebaseApp, firestore, auth, userState, claimsState, refreshClaims]);

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
 * Hook for accessing the authenticated user's role from the central provider.
 * The role is sourced from the user's Firestore document.
 * @returns {UserClaimsHookResult} Object with claims and isLoadingClaims.
 */
export const useUserClaims = (): UserClaimsHookResult => {
  const { claims, isLoadingClaims, refreshClaims } = useFirebaseContext();
  return { claims, isLoadingClaims, refreshClaims };
};
