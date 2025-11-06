'use client';

import React from 'react';
import { doc } from 'firebase/firestore';
import { notFound, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import DocumentForm from "@/app/document-form";
import type { Document as DocumentType } from "@/lib/types";
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

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

function AccessDenied() {
    return (
        <div className="container mx-auto flex justify-center items-center h-full">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="mt-4">Acceso Denegado</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No tienes los permisos necesarios para editar este documento.</p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function EditDocumentClientPage({ documentId }: { documentId: string }) {
    const firestore = useFirestore();
    const { user, userData, isUserLoading } = useUser();

    const docRef = useMemoFirebase(() => {
        if (!firestore || !documentId) return null;
        return doc(firestore, 'documents', documentId);
    }, [firestore, documentId]);

    const { data: documentData, isLoading: isLoadingDocument, error } = useDoc<DocumentType>(docRef);

    const isLoading = isLoadingDocument || isUserLoading;

    if (isLoading) {
        return <EditDocumentPageSkeleton />;
    }

    if (!documentData || error) {
        notFound();
    }
    
    const isAuthorized = user && (documentData.createdBy === user.uid || userData?.role === 'Admin' || userData?.role === 'Editor');

    if (!isAuthorized) {
        return <AccessDenied />;
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
