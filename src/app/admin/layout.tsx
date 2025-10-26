
"use client";

import { useUserClaims } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { claims, isLoadingClaims } = useUserClaims();

  if (isLoadingClaims) {
    return <div className="container mx-auto flex justify-center items-center h-full"><p>Verificando permisos...</p></div>;
  }

  const isAdminOrEditor = claims?.role === 'Admin' || claims?.role === 'Editor';

  if (!isAdminOrEditor) {
    return (
        <div className="container mx-auto flex justify-center items-center h-full">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-destructive/20 p-3 rounded-full">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="mt-4">Acceso Denegado</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-muted-foreground">No tienes los permisos necesarios para acceder a esta sección. Por favor, contacta a un administrador si crees que esto es un error.</p>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
        {children}
    </div>
  );
}
