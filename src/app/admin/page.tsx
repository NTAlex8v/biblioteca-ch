
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { Users, FileText, Shapes } from "lucide-react";
import type { User, Document, Category } from "@/lib/types";

interface AdminDashboardPageProps {
  user: User;
}

export default function AdminDashboardPage({ user }: AdminDashboardPageProps) {
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    // Consulta segura: solo se crea si el usuario es Admin.
    if (!firestore || user.role !== 'Admin') return null;
    return collection(firestore, 'users');
  }, [firestore, user]);

  const documentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'documents');
  }, [firestore]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);

  const { data: users } = useCollection<User>(usersQuery);
  const { data: documents } = useCollection<Document>(documentsQuery);
  const { data: categories } = useCollection<Category>(categoriesQuery);

  const totalDocuments = documents?.length ?? 0;
  const totalUsers = users?.length ?? 0;
  const totalCategories = categories?.length ?? 0;

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
            <div className="text-2xl font-bold">{totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              Recursos disponibles en la biblioteca
            </p>
          </CardContent>
        </Card>
        {user.role === 'Admin' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Usuarios registrados en el sistema
              </p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Categorías</CardTitle>
            <Shapes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCategories}</div>
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
