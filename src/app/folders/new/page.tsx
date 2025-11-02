"use client";

import FolderForm from "@/components/folder-form";
import { Suspense } from 'react';

function NewFolderPageContents() {
    return (
        <div className="container mx-auto max-w-2xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Crear Nueva Carpeta</h1>
                <p className="text-muted-foreground">Dale un nombre a tu nueva carpeta.</p>
            </div>
            <FolderForm />
        </div>
    );
}

export default function NewFolderPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <NewFolderPageContents />
        </Suspense>
    );
}
