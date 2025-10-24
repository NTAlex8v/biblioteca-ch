
"use client";

import DocumentForm from "@/components/document-form";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { notFound } from "next/navigation";
import type { Document as DocumentType } from "@/lib/types";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

function EditDocumentPageSkeleton() {
    return (
        <div className="container mx-auto">
            <div className="mb-8">
                <Skeleton className="h-10 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-24 w-full md:col-span-2" />
                 </div>
                <div className="flex justify-end gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
        </div>
    );
}


export default function EditDocumentPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = React.use(paramsPromise);
    const firestore = useFirestore();
    const docRef = useMemoFirebase(() => firestore ? doc(firestore, 'documents', params.id) : null, [firestore, params.id]);
    const { data: document, isLoading } = useDoc<DocumentType>(docRef);

    if (isLoading) {
        return <EditDocumentPageSkeleton />;
    }

    if (!isLoading && !document) {
        notFound();
    }

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
