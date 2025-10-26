"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useCollection, useFirestore, useMemoFirebase, useUserClaims } from "@/firebase";
import { collection } from "firebase/firestore";
import { Users, FileText, Shapes } from "lucide-react";
import type { Document, User, Category } from "@/lib/types";

export default function AdminDashboardPage() {

    const firestore = useFirestore();
    const { claims, isLoadingClaims } = useUserClaims();
    const isAdmin = claims?.role === 'Admin';

    const usersQuery = useMemoFirebase(() => {
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

    return (
        <div className="container mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
                <p className="text-muted-foreground">Vista general del sistema.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isAdmin && <StatCard title="Total de Usuarios" value={users?.length || 0} icon={Users} isLoading={isLoadingUsers || isLoadingClaims} />}
                <StatCard title="Total de Documentos" value={documents?.length || 0} icon={FileText} isLoading={isLoadingDocs} />
                <StatCard title="Total de Categorías" value={categories?.length || 0} icon={Shapes} isLoading={isLoadingCats} />
            </div>
            
            {/* Future sections for recent activity or quick actions can be added here */}
        </div>
    );
}
