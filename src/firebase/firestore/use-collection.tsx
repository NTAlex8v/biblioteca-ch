
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
    if (ref instanceof CollectionReference) {
        return ref.path;
    }
    // This is a more general way to get the path from a query.
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
      setIsLoading(true); 
      setError(null);
      return;
    }
    
    const path = typeof memoizedTargetRefOrQuery === 'string' ? memoizedTargetRefOrQuery : getPathFromRef(memoizedTargetRefOrQuery);

    // CRITICAL FIX: Prevent listing the 'users' collection for non-admins to avoid permission errors.
    if (path === 'users' && claims?.role !== 'Admin') {
        setData([]);
        setIsLoading(false);
        // This is not a "real" error, but a security measure. Setting an error message for the UI.
        setError(new Error("You do not have permission to list users."));
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

              // We only emit the error globally if it's NOT a user list permission error,
              // as we handle that gracefully in the UI.
              if (path !== 'users') {
                errorEmitter.emit('permission-error', contextualError);
              }
          }
      );
    }
    
    setup();

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery, auth?.currentUser, db, claims, isLoadingClaims]);

  return { data, isLoading, error };
}
