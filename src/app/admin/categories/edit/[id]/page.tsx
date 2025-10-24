
"use client";

import CategoryForm from "@/components/category-form";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { notFound } from "next/navigation";
import type { Category as CategoryType } from "@/lib/types";

export default function EditCategoryPage({ params }: { params: { id: string } }) {
    const firestore = useFirestore();
    const docRef = useMemoFirebase(() => firestore ? doc(firestore, 'categories', params.id) : null, [firestore, params.id]);
    const { data: category, isLoading } = useDoc<CategoryType>(docRef);

    if (isLoading) {
        return <div className="container mx-auto"><p>Cargando categoría...</p></div>;
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
