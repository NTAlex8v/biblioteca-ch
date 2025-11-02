'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { useDoc, type WithId } from './firestore/use-doc';
import type { User as AppUser } from '@/lib/types';


// Combined state for the Firebase context
export interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  userData: WithId<AppUser> | null;
  isUserLoading: boolean;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export function FirebaseProvider({
  children,
  firebaseApp,
  firestore,
  auth,
}: {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const userDocRef = useMemo(() => {
    if (firestore && user) {
      return doc(firestore, 'users', user.uid);
    }
    return null;
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc<AppUser>(userDocRef);

  const contextValue = useMemo((): FirebaseContextState => ({
    firebaseApp,
    firestore,
    auth,
    user,
    userData,
    isUserLoading: isAuthLoading || isUserDataLoading,
  }), [firebaseApp, firestore, auth, user, userData, isAuthLoading, isUserDataLoading]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};


function useFirebaseContext() {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useFirebase must be used within a FirebaseProvider.');
    }
    return context;
}

export const useFirebaseApp = (): FirebaseApp => useFirebaseContext().firebaseApp!;
export const useAuth = (): Auth => useFirebaseContext().auth!;
export const useFirestore = (): Firestore => useFirebaseContext().firestore!;

export function useUser() {
    const { user, userData, isUserLoading } = useFirebaseContext();
    return { user, userData, isUserLoading };
}

export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T {
    const memoized = useMemo(factory, deps);
    if (typeof memoized === 'object' && memoized !== null) {
        Object.assign(memoized, { __memo: true });
    }
    return memoized;
}