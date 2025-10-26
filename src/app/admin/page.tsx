
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Users, FileText, Shapes, AlertTriangle } from "lucide-react";
import type { Document, User, Category } from "@/lib/types";
import { useEffect, useState } from "react";
import { useAuth } from "@/firebase";

// This is a simplified version of the function from the users page
async function checkAdminAccess(idToken: string): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, limit: 1 }), // We only need to check access, not get all users
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default function AdminDashboardPage() {
    const firestore = useFirestore();
    const auth = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

    useEffect(() => {
        const verifyAccess = async () => {
            if (!auth.currentUser) {
                setIsAdmin(false);
                setIsLoadingPermissions(false);
                return;
            }
            try {
                const idToken = await auth.currentUser.getIdToken(true);
                const hasAccess = await checkAdminAccess(idToken);
                setIsAdmin(hasAccess);
            } catch (error) {
                console.error("Error checking admin access:", error);
                setIsAdmin(false);
            } finally {
                setIsLoadingPermissions(false);
            }
        };

        verifyAccess();
    }, [auth.currentUser]);


    const usersQuery = useMemoFirebase(() => {
        // This query now only runs if the user is an admin.
        if (!firestore || !isAdmin) return null;
        return collection(firestore, 'users');
    }, [firestore, isAdmin]);
    
    const documentsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'documents') : null, [firestore]);
    const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'categories') : null, [firestore]);

    const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);
    const { data: documents, isLoading: isLoadingDocs } = useCollection<Document>(documentsQuery);
    const { data: categories, isLoading: isLoadingCats } = useCollection<Category>(categoriesQuery);

    const StatCard = ({ title, value, icon: Icon, isLoading }: { title: string, value: number, icon: React.ElementType, isLoading: boolean }) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                     <div className="h-8 w-1/4 animate-pulse rounded-md bg-muted"></div>
                ) : (
                    <div className="text-2xl font-bold">{value}</div>
                )}
            </CardContent>
        </Card>
    );

    if (isLoadingPermissions) {
        return <div className="container mx-auto flex justify-center items-center h-full"><p>Verificando permisos...</p></div>;
    }

    if (!isAdmin) {
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
                        <p className="text-muted-foreground">No tienes los permisos necesarios para acceder a esta sección.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
                <p className="text-muted-foreground">Vista general del sistema.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isAdmin && <StatCard title="Total de Usuarios" value={users?.length || 0} icon={Users} isLoading={isLoadingUsers} />}
                <StatCard title="Total de Documentos" value={documents?.length || 0} icon={FileText} isLoading={isLoadingDocs} />
                <StatCard title="Total de Categorías" value={categories?.length || 0} icon={Shapes} isLoading={isLoadingCats} />
            </div>
            
        </div>
    );
}
