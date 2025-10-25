'use client';

import React from 'react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Document as DocumentType, Category, Folder } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder as FolderIcon, PlusCircle } from 'lucide-react';
import DocumentCard from '@/components/document-card';
import { Skeleton } from '@/components/ui/skeleton';

interface CategoryClientPageProps {
  category: Category;
}

const ItemSkeleton = () => (
    <div className="flex flex-col gap-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
    </div>
);

export default function CategoryClientPage({ category }: CategoryClientPageProps) {
  const firestore = useFirestore();

  // Query for sub-folders within this category that are at the root level (no parent folder)
  const foldersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'folders'), where('categoryId', '==', category.id), where('parentFolderId', '==', null));
  }, [firestore, category.id]);

  // Query for documents within this category that are at the root level (folderId is null)
  const documentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'documents'), where('categoryId', '==', category.id), where('folderId', '==', null));
  }, [firestore, category.id]);

  const { data: folders, isLoading: isLoadingFolders } = useCollection<Folder>(foldersQuery);
  const { data: documents, isLoading: isLoadingDocuments } = useCollection<DocumentType>(documentsQuery);

  const isLoading = isLoadingFolders || isLoadingDocuments;

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight mt-4">{category.name}</h1>
            <p className="text-muted-foreground">{category.description}</p>
        </div>
        <div className="flex gap-2">
            <Button asChild>
                <Link href={`/folders/new?categoryId=${category.id}`}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nueva Carpeta
                </Link>
            </Button>
            <Button asChild variant="secondary">
                <Link href={`/my-documents/new?categoryId=${category.id}`}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nuevo Documento
                </Link>
            </Button>
        </div>
      </div>
      
      {/* Folders section */}
      { (isLoadingFolders || (folders && folders.length > 0)) && (
          <>
            <h2 className="text-2xl font-semibold tracking-tight mb-4">Carpetas</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                {isLoadingFolders ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="p-4 flex flex-col items-center justify-center text-center">
                            <Skeleton className="h-12 w-12 mb-2 rounded-lg" />
                            <Skeleton className="h-5 w-24" />
                        </Card>
                    ))
                ) : (
                    folders?.map(folder => (
                        <Link key={folder.id} href={`/folders/${folder.id}`} className="group">
                             <Card className="h-full flex flex-col items-center justify-center p-6 text-center transition-all duration-300 hover:shadow-lg hover:border-primary">
                                <FolderIcon className="h-12 w-12 mb-2 text-primary group-hover:scale-110 transition-transform"/>
                                <p className="font-medium text-lg mt-2">{folder.name}</p>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
          </>
      )}


      {/* Documents section */}
       <h2 className="text-2xl font-semibold tracking-tight mb-4">Documentos</h2>
       {isLoadingDocuments ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => <ItemSkeleton key={i} />)}
            </div>
       ) : documents && documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {documents.map(doc => (
                    <DocumentCard key={doc.id} document={doc} />
                ))}
            </div>
        ) : (
             <div className="text-center py-16 border-2 border-dashed rounded-lg mt-4">
                  <h3 className="text-xl font-semibold text-muted-foreground">No hay documentos aquí</h3>
                  <p className="text-muted-foreground mt-2">Puedes ser el primero en añadir un documento a esta categoría.</p>
              </div>
        )}
    </div>
  );
}
