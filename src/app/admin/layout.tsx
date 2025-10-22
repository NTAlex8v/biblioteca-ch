
"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import React from "react";
import { doc } from "firebase/firestore";
import type { User as AppUser } from "@/lib/types";


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc<AppUser>(userDocRef);

  if (isUserLoading || isUserDataLoading) {
    return (
        <div className="flex h-[80vh] items-center justify-center">
            <p>Verificando permisos...</p>
        </div>
    );
  }

  const isAdmin = userData?.role === 'Admin';
  const isEditor = userData?.role === 'Editor';

  if (!user || (!isAdmin && !isEditor)) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Acceso Denegado</h1>
          <p className="text-muted-foreground">
            No tienes permiso para ver esta página.
          </p>
        </div>
      </div>
    );
  }

  // If permissions are sufficient, render the children pages.
  return <>{children}</>;
}
