
"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import type { User as AppUser } from "@/lib/types";
import { doc } from "firebase/firestore";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc<AppUser>(userDocRef);
  
  if (isUserLoading || isUserDataLoading) {
    return (
        <div className="flex h-[80vh] items-center justify-center">
            <p>Cargando...</p>
        </div>
    );
  }

  if (!user || !userData || (userData.role !== 'Admin' && userData.role !== 'Editor')) {
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

  // Clone the child element and pass the definitive user data from Firestore.
  // This ensures the child page always has the correct user prop.
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // The key is important to ensure React re-renders the child when userData changes.
      // We use the user's UID to ensure stability once loaded.
      return React.cloneElement(child, { user: userData, key: userData.id } as any);
    }
    return child;
  });

  return <>{childrenWithProps}</>;
}
