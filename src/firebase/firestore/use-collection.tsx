'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  setLogLevel,
  getFirestore,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useFirestore as useAppFirestore, useAuth as useAppAuth } from '@/firebase/provider';


/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | string | null; // Error object, or null.
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

if (process.env.NODE_ENV === "development") {
  try { 
    // setLogLevel("debug"); 
  } catch (e) { /* ignore if unavailable */ }
}


/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 * 
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start as loading
  const [error, setError] = useState<FirestoreError | Error | string | null>(null);
  const firestore = useAppFirestore();
  const auth = useAppAuth();

  const collectionPath = useMemo(() => {
    if (!memoizedTargetRefOrQuery) return null;
    return memoizedTargetRefOrQuery.type === 'collection'
            ? (memoizedTargetRefOrQuery as CollectionReference).path
            : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString()
  }, [memoizedTargetRefOrQuery]);

  useEffect(() => {
    // If we don't have a query yet, don't do anything.
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    // Protection against unauthorized calls if rules require authentication
    // Note: This assumes public collections don't need auth. 
    // If some public collections should be readable by anonymous users, 
    // this check needs to be more nuanced (e.g., check against a list of public paths).
    const publicPaths = ['documents', 'categories'];
    const isPublicPath = publicPaths.some(p => collectionPath?.startsWith(p));
    
    if (!auth.currentUser && !isPublicPath) {
        setData([]);
        setIsLoading(false);
        setError(null); // Not considered an error, just empty data for non-authed user
        return;
    }


    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        try {
            const results: ResultItemType[] = [];
            for (const doc of snapshot.docs) {
              results.push({ ...(doc.data() as T), id: doc.id });
            }
            setData(results);
            setError(null);
            setIsLoading(false);
        } catch (procErr: any) {
            console.error("Error processing snapshot:", procErr);
            setError("Error procesando datos.");
            setIsLoading(false);
        }
      },
      (error: FirestoreError) => {
        console.error("Firestore onSnapshot error:", error);

        if (error && (error.code === "permission-denied" || error.message?.includes("permission"))) {
            setData([]);
            setError("No tiene permisos para ver estos datos.");
            setIsLoading(false);

            // This logic extracts the path from either a ref or a query
            const path: string =
            memoizedTargetRefOrQuery.type === 'collection'
                ? (memoizedTargetRefOrQuery as CollectionReference).path
                : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString()

            const contextualError = new FirestorePermissionError({
                operation: 'list',
                path,
            });

            errorEmitter.emit('permission-error', contextualError);
            return;
        }

        setError("Error al cargar datos.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoizedTargetRefOrQuery, auth?.currentUser?.uid]); // re-run if the target query/reference or user changes.
  
  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    console.warn('A query/reference passed to useCollection was not memoized with useMemoFirebase. This can cause infinite loops.', memoizedTargetRefOrQuery);
  }

  return { data, isLoading, error };
}
