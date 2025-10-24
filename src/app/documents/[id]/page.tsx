
"use client";

import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Eye } from 'lucide-react';
import Link from 'next/link';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import React, { useMemo } from 'react';
import type { Document, Category, Tag } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Skeleton } from '@/components/ui/skeleton';

function DocumentPageSkeleton() {
  return (
    <div className="container mx-auto max-w-5xl">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card className="overflow-hidden sticky top-24">
            <div className="relative aspect-[2/3] w-full">
              <Skeleton className="h-full w-full" />
            </div>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-8 w-1/2 mb-4" />
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-2 mb-8">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex flex-wrap gap-2 mb-8">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Card className="mb-8">
            <CardHeader>
                <CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
          </Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}


export default function DocumentPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsPromise);
  const firestore = useFirestore();

  const docRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'documents', params.id);
  }, [firestore, params.id]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);

  const tagsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'tags');
  }, [firestore]);

  const { data: document, isLoading: isLoadingDocument } = useDoc<Document>(docRef);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery);
  const { data: allTags, isLoading: isLoadingTags } = useCollection<Tag>(tagsQuery);

  const isLoading = isLoadingDocument || isLoadingCategories || isLoadingTags;

  const categoryName = useMemo(() => {
    if (!document || !categories) return '...';
    return categories.find(c => c.id === document.categoryId)?.name || 'Sin categoría';
  }, [document, categories]);

  const documentTags = useMemo(() => {
    if (!document?.tagIds || !allTags) return [];
    return allTags.filter(tag => document.tagIds?.includes(tag.id));
  }, [document, allTags]);

  if (isLoading) {
    return <DocumentPageSkeleton />;
  }

  if (!isLoading && !document) {
    notFound();
  }

  // This check is now safe because of the conditions above.
  if (!document) {
    return <DocumentPageSkeleton />; // Or a more specific "not found" component within the layout
  }

  // Find a placeholder image. Fallback to a default one.
  const randomImage = PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)];
  const thumbnailUrl = document?.thumbnailUrl || randomImage.imageUrl;

  return (
    <>
      <div className="container mx-auto max-w-5xl">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card className="overflow-hidden sticky top-24">
              <div className="relative aspect-[2/3] w-full">
                <Image
                  src={thumbnailUrl}
                  alt={`Cover of ${document.title}`}
                  fill
                  className="object-cover"
                  data-ai-hint="book cover"
                />
              </div>
            </Card>
          </div>

          <div className="md:col-span-2">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">{document.title}</h1>
            <p className="text-xl text-muted-foreground mb-4">{document.author}</p>
            <div className="flex items-center gap-4 mb-6">
              <Badge variant="default">{categoryName}</Badge>
              <span className="text-sm text-muted-foreground">Año: {document.year}</span>
            </div>

            <p className="text-base leading-relaxed mb-8">{document.description}</p>

            <div className="flex flex-wrap gap-2 mb-8">
              {documentTags.map((tag) => (
                <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
              ))}
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Información del Documento</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <p className="font-medium">Materia</p>
                          <p className="text-muted-foreground">{document.subject || 'N/A'}</p>
                      </div>
                      <div>
                          <p className="font-medium">Versión</p>
                          <p className="text-muted-foreground">{document.version || '1.0'}</p>
                      </div>
                      <div>
                          <p className="font-medium">Última Actualización</p>
                          <p className="text-muted-foreground">{new Date(document.lastUpdated).toLocaleDateString()}</p>
                      </div>
                  </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="flex-1">
                <Eye className="mr-2" /> Ver PDF Embebido
              </Button>
              <Button size="lg" variant="secondary" className="flex-1" asChild>
                <Link href={document.fileUrl} download>
                  <Download className="mr-2" /> Descargar Archivo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
