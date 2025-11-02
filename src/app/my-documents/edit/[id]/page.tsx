'use client';

import React, { useEffect } from 'react';
import { doc } from 'firebase/firestore';
import { notFound, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import DocumentForm from "@/components/document-form";
import type { Document as DocumentType } from "@/lib/types";
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

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

export default function EditDocumentPage({ params }: { params: { id: string } }) {
    const firestore = useFirestore();
    const router = useRouter();
    const { user, userData } = useUser();

    const docRef = useMemoFirebase(() => {
        if (!firestore || !params.id) return null;
        return doc(firestore, 'documents', params.id);
    }, [firestore, params.id]);

    const { data: documentData, isLoading, error } = useDoc<DocumentType>(docRef);

    const isAuthorized = documentData && user && (documentData.createdBy === user.uid || userData?.role === 'Admin' || userData?.role === 'Editor');

    useEffect(() => {
        if (!isLoading && (!documentData || !isAuthorized)) {
            notFound();
        }
        if(error) {
            router.push('/my-documents');
        }
    }, [isLoading, documentData, isAuthorized, error, router]);

    if (isLoading || !documentData || !isAuthorized) {
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
