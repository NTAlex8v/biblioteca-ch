
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Users, FileText, Shapes } from "lucide-react";
import type { User as AppUser, Document, Category } from "@/lib/types";
import React from 'react';

// Este componente SOLO se renderiza si el usuario es un Admin verificado.
// Es seguro consultar la colección 'users' aquí.
function TotalUsersCardContent() {
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  
  const { data: users, isLoading: areUsersLoading } = useCollection<AppUser>(usersQuery);
  const totalUsers = users?.length ?? 0;

  return (
    <>
      <div className="text-2xl font-bold">{areUsersLoading ? '...' : totalUsers}</div>
      <p className="text-xs text-muted-foreground">
        Usuarios registrados en el sistema
      </p>
    </>
  );
}

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const currentUserDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc<AppUser>(currentUserDocRef);

  const documentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'documents');
  }, [firestore]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);

  const { data: documents, isLoading: areDocumentsLoading } = useCollection<Document>(documentsQuery);
  const { data: categories, isLoading: areCategoriesLoading } = useCollection<Category>(categoriesQuery);
  
  const totalDocuments = documents?.length ?? 0;
  const totalCategories = categories?.length ?? 0;

  const isLoading = isUserLoading || isCurrentUserDataLoading;

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Panel de Administración</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{areDocumentsLoading ? '...' : totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              Recursos disponibles en la biblioteca
            </p>
          </CardContent>
        </Card>
        
        { // Esta sección solo renderizará su contenido una vez que el rol del usuario esté confirmado.
          !isLoading && currentUserData?.role === 'Admin' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuarios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <TotalUsersCardContent />
              </CardContent>
            </Card>
          )
        }

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Categorías</CardTitle>
            <Shapes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{areCategoriesLoading ? '...' : totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              Categorías de material definidas
            </p>
          </CardContent>
        </Card>
      </div>

       <Card className="mt-8">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">La sección de actividad reciente estará disponible en una futura actualización.</p>
          </CardContent>
        </Card>
    </div>
  );
}
