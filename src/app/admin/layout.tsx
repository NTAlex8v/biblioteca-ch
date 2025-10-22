
"use client";

import { useUser, useUserClaims } from "@/firebase";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const { claims, isLoadingClaims } = useUserClaims();

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

  return <>{children}</>;
}
