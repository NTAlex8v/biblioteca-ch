
'use client';

import React from 'react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Document as DocumentType, Folder } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder as FolderIcon, PlusCircle, ArrowLeft } from 'lucide-react';
import DocumentCard from '@/components/document-card';
import { Skeleton } from '@/components/ui/skeleton';

interface FolderClientPageProps {
  folder: Folder;
}

const ItemSkeleton = () => (
    <div className="flex flex-col gap-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
    </div>
);

export default function FolderClientPage({ folder }: FolderClientPageProps) {
  const firestore = useFirestore();

  // Query for sub-folders within this folder
  const subFoldersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'folders'), where('parentFolderId', '==', folder.id));
  }, [firestore, folder.id]);

  // Query for documents inside this folder
  const documentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'documents'), where('folderId', '==', folder.id));
  }, [firestore, folder.id]);

  const { data: subFolders, isLoading: isLoadingFolders } = useCollection<Folder>(subFoldersQuery);
  const { data: documents, isLoading: isLoadingDocuments } = useCollection<DocumentType>(documentsQuery);

  const isLoading = isLoadingFolders || isLoadingDocuments;

  return (
    <div className="container mx-auto">
        <nav className="mb-4 text-sm text-muted-foreground">
            <Link href={`/category/${folder.categoryId}`} className="hover:underline">Categoría</Link>
             {' > '}
            <span>{folder.name}</span>
        </nav>
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <FolderIcon className="h-8 w-8 text-primary" />
                {folder.name}
            </h1>
        </div>
        <div className="flex gap-2">
            <Button asChild>
                <Link href={`/folders/new?categoryId=${folder.categoryId}&parentFolderId=${folder.id}`}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nueva Carpeta
                </Link>
            </Button>
            <Button asChild variant="secondary">
                <Link href={`/my-documents/new?categoryId=${folder.categoryId}&folderId=${folder.id}`}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nuevo Documento
                </Link>
            </Button>
        </div>
      </div>
      
      {/* Sub-folders section */}
      { (isLoadingFolders || (subFolders && subFolders.length > 0)) && (
          <>
            <h2 className="text-2xl font-semibold tracking-tight mb-4">Sub-carpetas</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                {isLoadingFolders ? (
                    Array.from({ length: 2 }).map((_, i) => (
                        <Card key={i} className="p-4 flex flex-col items-center justify-center text-center">
                            <Skeleton className="h-12 w-12 mb-2 rounded-lg" />
                            <Skeleton className="h-5 w-24" />
                        </Card>
                    ))
                ) : (
                    subFolders?.map(subFolder => (
                        <Link key={subFolder.id} href={`/folders/${subFolder.id}`} className="group">
                             <Card className="h-full flex flex-col items-center justify-center p-6 text-center transition-all duration-300 hover:shadow-lg hover:border-primary">
                                <FolderIcon className="h-12 w-12 mb-2 text-primary group-hover:scale-110 transition-transform"/>
                                <p className="font-medium text-lg mt-2">{subFolder.name}</p>
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
                  <h3 className="text-xl font-semibold text-muted-foreground">Esta carpeta está vacía</h3>
                  <p className="text-muted-foreground mt-2">Puedes añadir una nueva carpeta o un documento.</p>
              </div>
        )}
    </div>
  );
}
