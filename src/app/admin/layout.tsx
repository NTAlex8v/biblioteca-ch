
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
  
  // Primary loading state until user role is determined
  if (isUserLoading || isUserDataLoading) {
    return (
        <div className="flex h-[80vh] items-center justify-center">
            <p>Cargando...</p>
        </div>
    );
  }

  // Strict access control. If not an Admin or Editor, deny access and DO NOT render children.
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

  // If authorized, clone the child element and pass the fetched user data as props.
  // The child page will be responsible for fetching its own data based on the user's role.
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { user: userData } as any);
    }
    return child;
  });

  // Render children only after all checks have passed
  return <>{childrenWithProps}</>;
}
