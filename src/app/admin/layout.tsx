
"use client";

import { useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { User as AppUser } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

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

  const isLoading = isUserLoading || isUserDataLoading;

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><p>Verificando permisos...</p></div>;
  }

  const isAdminOrEditor = userData?.role === 'Admin' || userData?.role === 'Editor';

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

  return <>{children}</>;
}
