
"use client";

import { useUser } from "@/firebase";
import React, { useEffect, useState } from "react";

type UserClaims = {
  role?: string;
  [key: string]: any;
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const [claims, setClaims] = useState<UserClaims | null>(null);
  const [isLoadingClaims, setIsLoadingClaims] = useState(true);

  useEffect(() => {
    if (isUserLoading) {
      return;
    }
    if (!user) {
      setIsLoadingClaims(false);
      return;
    }

    user.getIdTokenResult()
      .then((idTokenResult) => {
        setClaims(idTokenResult.claims);
      })
      .catch(() => {
        // Handle error fetching claims if necessary
        setClaims(null);
      })
      .finally(() => {
        setIsLoadingClaims(false);
      });
  }, [user, isUserLoading]);

  
  if (isUserLoading || isLoadingClaims) {
    return (
        <div className="flex h-[80vh] items-center justify-center">
            <p>Verificando permisos...</p>
        </div>
    );
  }

  const isAdmin = claims?.role === 'Admin';
  const isEditor = claims?.role === 'Editor';


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

  // Pass claims to children
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { claims } as { claims: UserClaims });
    }
    return child;
  });

  return <>{childrenWithProps}</>;
}
