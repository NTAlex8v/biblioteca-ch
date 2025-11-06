'use client';

import React, { useEffect } from 'react';
import { doc } from 'firebase/firestore';
import { notFound, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import DocumentForm from "@/app/document-form";
import type { Document as DocumentType } from "@/lib/types";
import { Skeleton } from '@/components/ui/skeleton';

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

export default function EditDocumentClientPage({ documentId }: { documentId: string }) {
    const firestore = useFirestore();
    const router = useRouter();
    const { user, userData, isUserLoading } = useUser();

    const docRef = useMemoFirebase(() => {
        if (!firestore || !documentId) return null;
        return doc(firestore, 'documents', documentId);
    }, [firestore, documentId]);

    const { data: documentData, isLoading: isLoadingDocument, error } = useDoc<DocumentType>(docRef);

    useEffect(() => {
        // Wait until both user and document data have finished loading
        if (isLoadingDocument || isUserLoading) {
            return;
        }

        if (error) {
            router.push('/my-documents');
            return;
        }
        
        // Now that loading is complete, we can safely check authorization
        const isAuthorized = documentData && user && (documentData.createdBy === user.uid || userData?.role === 'Admin' || userData?.role === 'Editor');
        
        if (!isAuthorized) {
            notFound();
        }

    }, [isLoadingDocument, isUserLoading, documentData, userData, user, error, router]);

    const isLoading = isLoadingDocument || isUserLoading;

    if (isLoading || !documentData) {
        return <EditDocumentPageSkeleton />;
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
