"use client";

import React from "react";
import { useUser } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userData, isUserLoading } = useUser();
  const router = useRouter();

  if (isUserLoading) {
    return (
      <div className="container mx-auto flex justify-center items-center h-[calc(100vh-10rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="ml-4 text-muted-foreground">Verificando permisos de administrador...</p>
      </div>
    );
  }

  const userRole = userData?.role;
  if (userRole !== 'Admin' && userRole !== 'Editor') {
     return (
          <div className="container mx-auto flex justify-center items-center h-full">
              <Card className="w-full max-w-md text-center">
                  <CardHeader>
                      <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
                          <AlertTriangle className="h-8 w-8 text-destructive" />
                      </div>
                      <CardTitle className="mt-4">Acceso Denegado</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-muted-foreground">No tienes los permisos necesarios para acceder a esta sección. Contacta a un administrador.</p>
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
