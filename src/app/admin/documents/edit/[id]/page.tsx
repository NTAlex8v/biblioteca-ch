
import { doc, getDoc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { initializeFirebase } from '@/firebase/server-initialization';
import DocumentForm from "@/components/document-form";
import type { Document as DocumentType } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Initialize firebase admin on server
const { firestore } = initializeFirebase();

async function getDocument(id: string): Promise<DocumentType | null> {
    const docRef = doc(firestore, 'documents', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }
    return { id: docSnap.id, ...docSnap.data() } as DocumentType;
}

export default async function EditDocumentPage({ params }: { params: { id: string } }) {
    
    const document = await getDocument(params.id);

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
