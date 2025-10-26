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

  useEffect(() => {
    if (memoizedTargetRefOrQuery === null) {
      setData([]);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    let query: Query<DocumentData>;

    if (typeof memoizedTargetRefOrQuery === 'string') {
        query = collection(db, memoizedTargetRefOrQuery) as Query<DocumentData>;
    } else {
        query = memoizedTargetRefOrQuery;
    }
    
    const uid = auth?.currentUser?.uid ?? null;
    const path = getPathFromRef(query);

    // If trying to list the 'users' collection and we have a UID,
    // subscribe to the user's own document instead of listing the whole collection.
    if (path === "users" && uid) {
      const userDocRef = doc(db, "users", uid);
      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (!docSnap.exists()) {
            setData([]); // Doc doesn't exist
            setIsLoading(false);
            setError(null);
            return;
          }
          // Wrap the single document in an array to maintain hook compatibility
          const payload = [{ id: docSnap.id, ...docSnap.data() } as WithId<T>];
          setData(payload);
          setIsLoading(false);
          setError(null);
        },
        (err) => {
           const contextualError = new FirestorePermissionError({
                operation: 'get', // It's a 'get' on a single doc now
                path: userDocRef.path,
             });
            setData([]);
            setError(contextualError); 
            setIsLoading(false);
            errorEmitter.emit('permission-error', contextualError);
        }
      );

      return () => unsubscribe();
    }


    const unsubscribe = onSnapshot(
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

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery, auth?.currentUser?.uid, db]);

  return { data, isLoading, error };
}
