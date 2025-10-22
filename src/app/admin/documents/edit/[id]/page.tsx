
"use client";

import DocumentForm from "@/components/document-form";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { notFound } from "next/navigation";
import type { Document as DocumentType } from "@/lib/types";

export default function EditDocumentPage({ params }: { params: { id: string } }) {
    const firestore = useFirestore();
    const docRef = useMemoFirebase(() => firestore ? doc(firestore, 'documents', params.id) : null, [firestore, params.id]);
    const { data: document, isLoading } = useDoc<DocumentType>(docRef);

    if (isLoading) {
        return <div className="container mx-auto"><p>Cargando documento...</p></div>;
    }

    if (!document) {
        notFound();
    }

    return (
        <div className="container mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Editar Documento</h1>
                <p className="text-muted-foreground">Actualiza la información del documento.</p>
            </div>
            <DocumentForm document={document} />
        </div>
    );
}
