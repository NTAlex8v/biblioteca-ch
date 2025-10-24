
"use client";

import DocumentForm from "@/components/document-form";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { notFound } from "next/navigation";
import type { Document as DocumentType } from "@/lib/types";
import React from "react";

export default function EditDocumentPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = React.use(paramsPromise);
    const firestore = useFirestore();
    const docRef = useMemoFirebase(() => firestore ? doc(firestore, 'documents', params.id) : null, [firestore, params.id]);
    const { data: document, isLoading } = useDoc<DocumentType>(docRef);

    if (isLoading) {
        return <div className="container mx-auto"><p>Cargando documento...</p></div>;
    }

    if (!document && !isLoading) {
        notFound();
    }

    // Render the form only when the document has been loaded
    return (
        <div className="container mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Editar Documento</h1>
                <p className="text-muted-foreground">Actualiza la información del documento.</p>
            </div>
            {document && <DocumentForm document={document} />}
        </div>
    );
}
