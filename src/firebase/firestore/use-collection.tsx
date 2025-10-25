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
    // For queries, we can get the path from the internal _query property
    // This is a bit of a hack, but it's the most reliable way to get the path
    // in the v9 SDK without major refactoring.
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
        const PUBLIC_COLLECTIONS = ["documents", "categories", "folders", "tags"];
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
             const path = getPathFromRef(query);

             const contextualError = new FirestorePermissionError({
                operation: 'list',
                path: path,
             });
            
            // DO NOT log to console. The global listener will handle it.
            setData([]);
            setError(contextualError); // Set local error state for UI feedback
            setIsLoading(false);

            // Emit the rich error for global handling (e.g., Next.js error overlay)
            errorEmitter.emit('permission-error', contextualError);
        }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery, auth?.currentUser?.uid, db]);

  return { data, isLoading, error };
}
