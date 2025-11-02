
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect, useCallback } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import type { User as AppUser } from '@/lib/types';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;

  claims: { role?: 'Admin' | 'Editor' | 'User' } | null;
  isLoadingClaims: boolean;
}

export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface UserClaimsHookResult {
    claims: { role?: 'Admin' | 'Editor' | 'User' } | null;
    isLoadingClaims: boolean;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

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

  useEffect(() => {
    if (!auth) {
      setUserState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      setClaimsState({ claims: null, isLoadingClaims: false });
      return;
    }

    let roleUnsubscribe = () => {};

    const authUnsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        // Unsubscribe from the previous user's role listener
        roleUnsubscribe();

        if (firebaseUser) {
            try {
                // Force refresh the token to get the latest custom claims
                const idTokenResult = await firebaseUser.getIdTokenResult(true);
                const userClaims = idTokenResult.claims as { role?: 'Admin' | 'Editor' | 'User' };
                
                setUserState({ user: firebaseUser, isUserLoading: false, userError: null });
                setClaimsState({ claims: userClaims, isLoadingClaims: false });

            } catch (error) {
                console.error("Error refreshing user token or getting claims:", error);
                // Fallback to reading from Firestore if claims fail
                setUserState({ user: firebaseUser, isUserLoading: false, userError: null });
                setClaimsState(prevState => ({ ...prevState, isLoadingClaims: true }));
                
                const userDocRef = doc(firestore, 'users', firebaseUser.uid);
                roleUnsubscribe = onSnapshot(userDocRef, 
                    (docSnap) => {
                        if (docSnap.exists()) {
                            const userData = docSnap.data() as AppUser;
                            setClaimsState({ claims: { role: userData.role || 'User' }, isLoadingClaims: false });
                        } else {
                            setClaimsState({ claims: { role: 'User' }, isLoadingClaims: false });
                        }
                    },
                    (err) => {
                        console.error("Error fetching user document for role fallback:", err);
                        setClaimsState({ claims: { role: 'User' }, isLoadingClaims: false });
                    }
                );
            }
        } else {
            setUserState({ user: null, isUserLoading: false, userError: null });
            setClaimsState({ claims: null, isLoadingClaims: false });
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
      roleUnsubscribe();
    };
  }, [auth, firestore]);

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

const useFirebaseContext = (): FirebaseContextState => {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useFirebase must be used within a FirebaseProvider.');
    }
    return context;
};

export const useAuth = (): Auth => {
  const { auth } = useFirebaseContext();
  if (!auth) throw new Error('Auth service not available. Check FirebaseProvider props.');
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebaseContext();
  if (!firestore) throw new Error('Firestore service not available. Check FirebaseProvider props.');
  return firestore;
};

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

export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useFirebaseContext();
  return { user, isUserLoading, userError };
};

export const useUserClaims = (): UserClaimsHookResult => {
  const { claims, isLoadingClaims } = useFirebaseContext();
  return { claims, isLoadingClaims };
};

export const refreshClaims = async (auth: Auth): Promise<void> => {
    const user = auth.currentUser;
    if (user) {
        await user.getIdToken(true);
    }
};
