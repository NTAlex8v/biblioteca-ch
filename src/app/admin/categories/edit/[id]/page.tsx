
"use client";

import CategoryForm from "@/components/category-form";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { notFound } from "next/navigation";
import type { Category as CategoryType } from "@/lib/types";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

function EditCategoryPageSkeleton() {
    return (
        <div className="container mx-auto">
            <div className="mb-8">
                <Skeleton className="h-10 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-24 w-full" />
                <div className="flex justify-end gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
        </div>
    );
}

export default function EditCategoryPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = React.use(paramsPromise);
    const firestore = useFirestore();
    const docRef = useMemoFirebase(() => firestore ? doc(firestore, 'categories', params.id) : null, [firestore, params.id]);
    const { data: category, isLoading } = useDoc<CategoryType>(docRef);

    if (isLoading) {
        return <EditCategoryPageSkeleton />;
    }

    if (!category) {
        notFound();
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
