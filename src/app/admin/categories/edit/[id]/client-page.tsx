'use client';

import { useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import CategoryForm from "@/components/category-form";
import type { Category } from '@/lib/types';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
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

    const categoryDocRef = useMemoFirebase(() => {
        if (!firestore || !categoryId) return null;
        return doc(firestore, 'categories', categoryId);
    }, [firestore, categoryId]);

    const { data: category, isLoading, error } = useDoc<Category>(categoryDocRef);

    useEffect(() => {
        if (!isLoading && !category && !error) {
            notFound();
        }
        if (error) {
            // Assuming the hook handles permission errors globally
            // Redirect or show a message if needed
            router.push('/admin/categories');
        }
    }, [isLoading, category, error, router]);

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
