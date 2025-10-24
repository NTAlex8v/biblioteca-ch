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
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import type { WithId } from './use-doc';


// Optional: habilitar logs detallados solo en dev
if (process.env.NODE_ENV === "development") {
  try { setLogLevel("debug"); } catch (e) { /* ignore if unavailable */ }
}

type UseCollectionResult<T = any> = {
  data: WithId<T>[];
  isLoading: boolean;
  error: string | null;
};

export function useCollection<T = any>(collectionPath: string | null): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    // Si no hay collectionPath, no hacemos nada
    if (!collectionPath) {
      setData([]);
      setIsLoading(false);
      return;
    }

    const PUBLIC_COLLECTIONS = ["documents", "categories"];
    
    // PROTECCIÓN CRÍTICA: no intentar listar si no hay usuario autenticado, a menos que sea una colección pública.
    if (!auth?.currentUser && !PUBLIC_COLLECTIONS.includes(collectionPath)) {
      setData([]);
      setIsLoading(false);
      setError(null); // no consideramos esto un "error" visible por defecto
      return;
    }

    const colRef = collection(db, collectionPath) as Query<DocumentData>;
    let unsub: Unsubscribe | null = null;

    try {
      unsub = onSnapshot(
        colRef,
        (snapshot) => {
          try {
            const docs = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as WithId<T>[];
            setData(docs);
            setIsLoading(false);
            setError(null);
          } catch (procErr) {
            console.error("Error procesando snapshot:", procErr);
            setError("Error procesando datos.");
            setIsLoading(false);
          }
        },
        (err) => {
          console.error("Firestore onSnapshot error:", err);

          // Manejo explícito de permisos: no permitir que la excepción crashee la app
          if (err && (err.code === "permission-denied" || err.message?.includes("permission"))) {
            setData([]);
            setError("No tiene permisos para ver estos datos.");
            setIsLoading(false);
            return;
          }

          // Otros errores
          setError("Error al cargar datos.");
          setIsLoading(false);
        }
      );
    } catch (e: any) {
      // Captura adicional para llamadas sincrónicas que fallean
      console.error("Error iniciando suscripción:", e);
      if (e && (e.code === "permission-denied" || e.message?.includes("permission"))) {
        setError("No tiene permisos para ver estos datos.");
      } else {
        setError("Error al iniciar la consulta.");
      }
      setIsLoading(false);
    }

    return () => {
      if (unsub) unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionPath, auth?.currentUser?.uid]); // re-suscribirse si cambia el usuario

  return { data, isLoading, error };
}