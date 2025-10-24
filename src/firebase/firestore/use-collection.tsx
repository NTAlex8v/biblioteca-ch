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

export function useCollection<T = any>(memoizedTargetRefOrQuery: string | Query<DocumentData> | null): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData([]);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    let query: Query<DocumentData>;

    // Check if the input is a string path or a Query object
    if (typeof memoizedTargetRefOrQuery === 'string') {
        const PUBLIC_COLLECTIONS = ["documents", "categories", "folders"];
        if (!auth?.currentUser && !PUBLIC_COLLECTIONS.includes(memoizedTargetRefOrQuery)) {
            setData([]);
            setIsLoading(false);
            setError(null);
            return;
        }
        query = collection(db, memoizedTargetRefOrQuery) as Query<DocumentData>;
    } else {
        query = memoizedTargetRefOrQuery;
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
             const path = 'path' in query ? query.path : 'unknown path';

             const contextualError = new FirestorePermissionError({
                operation: 'list',
                path: path,
             });
            
            console.error("Firestore onSnapshot error:", err);
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