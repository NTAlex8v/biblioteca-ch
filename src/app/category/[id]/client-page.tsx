'use client';

import React from 'react';
import Link from 'next/link';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import type { Document as DocumentType, Category } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder as FolderIcon, FileText, PlusCircle, ArrowLeft } from 'lucide-react';
import DocumentCard from '@/components/document-card';
import { Skeleton } from '@/components/ui/skeleton';

interface CategoryClientPageProps {
  category: Category;
  parentCategory: Category | null;
}

const ItemSkeleton = () => (
    <div className="flex flex-col gap-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
    </div>
);

export default function CategoryClientPage({ category, parentCategory }: CategoryClientPageProps) {
  const firestore = useFirestore();

  const subCategoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'categories'), where('parentCategoryId', '==', category.id));
  }, [firestore, category.id]);

  const documentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'documents'), where('categoryId', '==', category.id));
  }, [firestore, category.id]);

  const { data: subCategories, isLoading: isLoadingSubCategories } = useCollection<Category>(subCategoriesQuery);
  const { data: documents, isLoading: isLoadingDocuments } = useCollection<DocumentType>(documentsQuery);

  const isLoading = isLoadingSubCategories || isLoadingDocuments;

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
            <div className="flex items-center gap-4">
                 {parentCategory && (
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/category/${parentCategory.id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4"/>
                            Volver a {parentCategory.name}
                        </Link>
                    </Button>
                )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight mt-4">{category.name}</h1>
            <p className="text-muted-foreground">{category.description}</p>
        </div>
        <div className="flex gap-2">
            <Button asChild>
                <Link href="/admin/categories/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nueva Carpeta
                </Link>
            </Button>
            <Button asChild variant="secondary">
                <Link href="/my-documents/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nuevo Documento
                </Link>
            </Button>
        </div>
      </div>
      
      {/* Sub-categories section */}
      { (subCategories && subCategories.length > 0) || isLoading ? (
          <>
            <h2 className="text-2xl font-semibold tracking-tight mb-4">Carpetas</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="p-4 flex flex-col items-center justify-center text-center">
                            <Skeleton className="h-12 w-12 mb-2 rounded-lg" />
                            <Skeleton className="h-5 w-24" />
                        </Card>
                    ))
                ) : (
                    subCategories?.map(subCat => (
                        <Link key={subCat.id} href={`/category/${subCat.id}`} className="group">
                             <Card className="h-full flex flex-col items-center justify-center p-6 text-center transition-all duration-300 hover:shadow-lg hover:border-primary">
                                <FolderIcon className="h-12 w-12 mb-2 text-primary group-hover:scale-110 transition-transform"/>
                                <p className="font-medium text-lg mt-2">{subCat.name}</p>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
          </>
      ): null}


      {/* Documents section */}
       <h2 className="text-2xl font-semibold tracking-tight mb-4">Documentos</h2>
       {isLoading ? (
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
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <h3 className="text-xl font-semibold text-muted-foreground">No hay documentos</h3>
                <p className="text-muted-foreground mt-2">Puedes ser el primero en añadir uno en esta categoría.</p>
            </div>
        )}
    </div>
  );
}
