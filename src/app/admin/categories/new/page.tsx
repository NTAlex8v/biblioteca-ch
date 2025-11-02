"use client";

import CategoryForm from "@/components/category-form";

export default function NewCategoryPage() {

    return (
        <div className="container mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Añadir Nueva Categoría</h1>
                <p className="text-muted-foreground">Completa el formulario para añadir una nueva categoría.</p>
            </div>
            <CategoryForm />
        </div>
    );
}
