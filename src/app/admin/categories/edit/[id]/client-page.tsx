'use client';

import React from 'react';
import { notFound } from 'next/navigation';
import CategoryForm from "@/components/category-form";
import type { Category } from '@/lib/types';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

function EditCategorySkeleton() {
    return (
        <div className="container mx-auto">
             <div className="mb-8">
                <Skeleton className="h-9 w-1/2 mb-2" />
                <Skeleton className="h-6 w-3/4" />
            </div>
            <Skeleton className="h-[250px] w-full" />
        </div>
    );
}

function AccessDenied() {
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
                    <p className="text-muted-foreground">No tienes los permisos necesarios para editar esta categoría.</p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function EditCategoryClientPage({ categoryId }: { categoryId: string }) {
    const firestore = useFirestore();
    const { userData, isUserLoading } = useUser();

    const categoryDocRef = useMemoFirebase(() => {
        if (!firestore || !categoryId) return null;
        return doc(firestore, 'categories', categoryId);
    }, [firestore, categoryId]);

    const { data: category, isLoading: isLoadingCategory, error } = useDoc<Category>(categoryDocRef);

    const isLoading = isLoadingCategory || isUserLoading;

    if (isLoading) {
        return <EditCategorySkeleton />;
    }

    if (!category || error) {
        notFound();
    }
    
    const isAuthorized = userData?.role === 'Admin' || userData?.role === 'Editor';

    if (!isAuthorized) {
        return <AccessDenied />;
    }

    return (
        <div className="container mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Editar Categoría</h1>
                <p className="text-muted-foreground">Actualiza la información de la categoría.</p>
            </div>
            <CategoryForm category={category} />
        </div>
    );
}
