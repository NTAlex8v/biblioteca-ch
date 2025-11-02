"use client";

import DocumentForm from "@/components/document-form";

export default function NewDocumentPage() {

    return (
        <div className="container mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Añadir Nuevo Documento</h1>
                <p className="text-muted-foreground">Completa el formulario para añadir un nuevo recurso a la biblioteca.</p>
            </div>
            <DocumentForm />
        </div>
    );
}
