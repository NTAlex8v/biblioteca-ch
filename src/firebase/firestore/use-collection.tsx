'use client';

import { useEffect, useState } from "react";
import type { Unsubscribe } from "firebase/firestore";
import {
  collection,
  onSnapshot,
  Query,
  DocumentData,
  getFirestore,
  setLogLevel,
  QuerySnapshot,
  FirestoreError,
  CollectionReference,
  doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useUserClaims } from "../provider";


// Optional: habilitar logs detallados solo en dev
if (process.env.NODE_ENV === "development") {
  try { setLogLevel("debug"); } catch (e) { /* ignore if unavailable */ }
}

type WithId<T> = T & { id: string };

type UseCollectionResult<T = any> = {
  data: WithId<T>[];
  isLoading: boolean;
  error: Error | null;
};

// Helper function to get path from a query or collection reference
const getPathFromRef = (ref: Query<DocumentData> | CollectionReference<DocumentData>): string => {
    if ((ref as any).__fetchAll) return (ref as any)._query.path.segments.join('/');

    if (ref instanceof CollectionReference) {
        return ref.path;
    }
    const internalQuery: any = ref;
    if (internalQuery?._query?.path?.segments) {
        return internalQuery._query.path.segments.join('/');
    }
    return 'unknown path';
};


export function useCollection<T = any>(memoizedTargetRefOrQuery: string | Query<DocumentData> | null): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const db = getFirestore();
  const auth = getAuth();
  const { claims, isLoadingClaims } = useUserClaims();

  useEffect(() => {
    let unsubscribe: Unsubscribe = () => {};

    if (memoizedTargetRefOrQuery === null || isLoadingClaims) {
      setData([]);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const setup = async () => {
      let query: Query<DocumentData>;

      if (typeof memoizedTargetRefOrQuery === 'string') {
          query = collection(db, memoizedTargetRefOrQuery) as Query<DocumentData>;
      } else {
          query = memoizedTargetRefOrQuery;
      }
      
      const currentUser = auth.currentUser;
      const uid = currentUser?.uid ?? null;
      const path = getPathFromRef(query);
      const isAdmin = claims?.role === 'Admin';
      
      if (path === "users") {
        if (isAdmin) {
          const colRef = collection(db, "users");
          unsubscribe = onSnapshot(
            colRef,
            (querySnap) => {
              const items = querySnap.docs.map(d => ({ id: d.id, ...d.data() } as WithId<T>));
              setData(items);
              setIsLoading(false);
            },
            (err) => {
               const contextualError = new FirestorePermissionError({ operation: 'list', path });
               setError(contextualError);
               setIsLoading(false);
               errorEmitter.emit('permission-error', contextualError);
            }
          );
          return;
        } else if (uid) {
          const userDocRef = doc(db, "users", uid);
          unsubscribe = onSnapshot(
            userDocRef,
            (docSnap) => {
              if (!docSnap.exists()) {
                setData([]);
              } else {
                setData([{ id: docSnap.id, ...docSnap.data() } as WithId<T>]);
              }
              setIsLoading(false);
            },
            (err) => {
              const contextualError = new FirestorePermissionError({ operation: 'get', path: userDocRef.path });
              setError(contextualError);
              setIsLoading(false);
              errorEmitter.emit('permission-error', contextualError);
            }
          );
          return;
        } else {
          // Not authenticated and not admin trying to list users
          setData([]);
          setIsLoading(false);
          const contextualError = new FirestorePermissionError({ operation: 'list', path });
          setError(contextualError);
          errorEmitter.emit('permission-error', contextualError);
          return;
        }
      }

      // Default behavior for other collections
      unsubscribe = onSnapshot(
          query,
          (snapshot: QuerySnapshot<DocumentData>) => {
              const docs = snapshot.docs.map((doc) => ({ ...doc.data() as T, id: doc.id }));
              setData(docs);
              setIsLoading(false);
              setError(null);
          },
          (err: FirestoreError) => {
               const contextualError = new FirestorePermissionError({
                  operation: 'list',
                  path: path,
               });
              
              setData([]);
              setError(contextualError); 
              setIsLoading(false);

              errorEmitter.emit('permission-error', contextualError);
          }
      );
    }
    
    setup();

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery, auth?.currentUser, db, claims, isLoadingClaims]);

  return { data, isLoading, error };
}
