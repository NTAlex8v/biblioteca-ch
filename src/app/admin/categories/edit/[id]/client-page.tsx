'use client';

import { useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import CategoryForm from "@/components/category-form";
import type { Category } from '@/lib/types';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

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


export default function EditCategoryClientPage({ categoryId }: { categoryId: string }) {
    const firestore = useFirestore();
    const router = useRouter();
    const { userData, isUserLoading } = useUser();

    const categoryDocRef = useMemoFirebase(() => {
        if (!firestore || !categoryId) return null;
        return doc(firestore, 'categories', categoryId);
    }, [firestore, categoryId]);

    const { data: category, isLoading: isLoadingCategory, error } = useDoc<Category>(categoryDocRef);

    useEffect(() => {
        // Wait until both user and category data have finished loading
        if (isLoadingCategory || isUserLoading) {
            return;
        }

        if (error) {
            router.push('/admin/categories');
            return;
        }

        // Now that loading is complete, we can safely check authorization
        const isAuthorized = userData?.role === 'Admin' || userData?.role === 'Editor';

        if (!category || !isAuthorized) {
            notFound();
        }
    }, [isLoadingCategory, isUserLoading, category, userData, error, router]);

    const isLoading = isLoadingCategory || isUserLoading;

    if (isLoading || !category) {
        return <EditCategorySkeleton />;
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
