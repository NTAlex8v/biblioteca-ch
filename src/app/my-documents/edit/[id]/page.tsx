
import React from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { initializeFirebase } from '@/firebase'; // Use client-side initialization
import DocumentForm from "@/app/document-form";
import type { Document as DocumentType } from "@/lib/types";
import { Skeleton } from '@/components/ui/skeleton';

// Initialize firebase on the client
const { firestore } = initializeFirebase();

async function getDocument(id: string): Promise<DocumentType | null> {
    if (!firestore || !id) return null;
    try {
        const docRef = doc(firestore, 'documents', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }
        return { id: docSnap.id, ...docSnap.data() } as DocumentType;
    } catch (error) {
        console.error("Error fetching document:", error);
        return null;
    }
}

function EditDocumentPageSkeleton() {
    return (
        <div className="container mx-auto">
            <div className="mb-8">
                <Skeleton className="h-9 w-1/2 mb-2" />
                <Skeleton className="h-6 w-3/4" />
            </div>
            <Skeleton className="h-[500px] w-full" />
        </div>
    );
}

export default async function EditDocumentPage({ params }: { params: { id: string } }) {
    
    const documentData = await getDocument(params.id);

    if (!documentData) {
        notFound();
    }

    return (
        <div className="container mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Editar Documento</h1>
                <p className="text-muted-foreground">Actualiza la información del documento.</p>
            </div>
            <DocumentForm document={documentData} />
        </div>
    );
}
