
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect, useCallback } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, IdTokenResult } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

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
  refreshClaims: () => Promise<void>;
}

export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface UserClaimsHookResult {
    claims: { role?: 'Admin' | 'Editor' | 'User' } | null;
    isLoadingClaims: boolean;
    refreshClaims: () => Promise<void>;
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

  const refreshClaims = useCallback(async () => {
    const currentUser = auth?.currentUser;
    if (currentUser) {
        setClaimsState(prevState => ({ ...prevState, isLoadingClaims: true }));
        try {
            const idTokenResult = await currentUser.getIdTokenResult(true);
            const role = (idTokenResult.claims.role as 'Admin' | 'Editor' | 'User' | undefined) || 'User';
            setClaimsState({ claims: { role }, isLoadingClaims: false });
        } catch (error) {
             console.error("Error refreshing user claims:", error);
             setClaimsState({ claims: { role: 'User' }, isLoadingClaims: false });
        }
    } else {
         setClaimsState({ claims: null, isLoadingClaims: false });
    }
  }, [auth]);

  useEffect(() => {
    if (!auth) {
      setUserState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      setClaimsState({ claims: null, isLoadingClaims: false });
      return;
    }
    
    const authUnsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setUserState({ user: firebaseUser, isUserLoading: false, userError: null });
        if (firebaseUser) {
          await refreshClaims();
        } else {
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
    };
  }, [auth, refreshClaims]);

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
  const { claims, isLoadingClaims, refreshClaims } = useFirebaseContext();
  return { claims, isLoadingClaims, refreshClaims };
};
