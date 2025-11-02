
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect, useCallback } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import type { User as AppUser } from '@/lib/types';
import { useDoc } from './firestore/use-doc';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

export interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  
  user: User | null;
  userData: AppUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface UserHookResult {
  user: User | null;
  userData: AppUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [authState, setAuthState] = useState<{
    user: User | null;
    isUserLoading: boolean;
    userError: Error | null;
  }>({
    user: auth?.currentUser || null,
    isUserLoading: !auth?.currentUser,
    userError: null,
  });

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authState.user) return null;
    return doc(firestore, 'users', authState.user.uid);
  }, [firestore, authState.user]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc<AppUser>(userDocRef);

  useEffect(() => {
    if (!auth) {
      setAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setAuthState({ user, isUserLoading: false, userError: null });
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );

    return () => unsubscribe();
  }, [auth]);

  const isOverallLoading = authState.isUserLoading || (!!authState.user && isUserDataLoading);

  const contextValue = useMemo((): FirebaseContextState => ({
    firebaseApp,
    firestore,
    auth,
    user: authState.user,
    userData: userData as AppUser | null,
    isUserLoading: isOverallLoading,
    userError: authState.userError,
  }), [firebaseApp, firestore, auth, authState, userData, isOverallLoading]);

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

export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T | (MemoFirebase<T>) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

export const useUser = (): UserHookResult => {
  const { user, userData, isUserLoading, userError } = useFirebaseContext();
  return { user, userData, isUserLoading, userError };
};
