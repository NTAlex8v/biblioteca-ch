'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Eye, Edit, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import type { Document as DocumentType, Category } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter, notFound } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type DocumentDetailProps = {
  documentId: string;
};

export default function DocumentDetailClient({ documentId }: DocumentDetailProps) {
  const [isPdfVisible, setIsPdfVisible] = useState(false);
  const [formattedDate, setFormattedDate] = useState('');
  const { user, userData } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const docRef = useMemoFirebase(() => firestore ? doc(firestore, 'documents', documentId) : null, [firestore, documentId]);
  const { data: document, isLoading: isLoadingDocument, error: documentError } = useDoc<DocumentType>(docRef);
  
  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'categories') : null, [firestore]);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery);

  const categoryName = useMemo(() => {
    if (!document || !categories) return 'Cargando...';
    return categories.find(c => c.id === document.categoryId)?.name || 'Sin categoría';
  }, [document, categories]);

  useEffect(() => {
    if (document?.lastUpdated) {
      setFormattedDate(new Date(document.lastUpdated).toLocaleDateString());
    }
  }, [document?.lastUpdated]);

  useEffect(() => {
    if ((!isLoadingDocument && !document) || documentError) {
      notFound();
    }
  }, [isLoadingDocument, document, documentError]);

  if (isLoadingDocument || isLoadingCategories || !document) {
    return (
        <div className="container mx-auto flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
  }
  
  const canManage = user && (document.createdBy === user.uid || userData?.role === 'Admin' || userData?.role === 'Editor');
  
  const placeholderIndex = document.id.charCodeAt(0) % PlaceHolderImages.length;
  const placeholderImage = PlaceHolderImages[placeholderIndex];
  const thumbnailUrl = document?.thumbnailUrl || placeholderImage.imageUrl;


  const handleDelete = () => {
    if (!firestore) return;
    const docRef = doc(firestore, 'documents', document.id);
    
    deleteDocumentNonBlocking(docRef);
    toast({
      variant: "destructive",
      title: 'Documento eliminado',
      description: 'El documento ha sido eliminado permanentemente.',
    });
    router.push('/');
  };

  const pdfViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(document.fileUrl)}&embedded=true`;

  return (
    <>
      <div className="container mx-auto max-w-5xl">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card className="overflow-hidden sticky top-24">
              <div className="relative aspect-[3/4] w-full">
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
                          <p className="text-muted-foreground">{formattedDate || 'Cargando...'}</p>
                      </div>
                  </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="flex-1" onClick={() => setIsPdfVisible(!isPdfVisible)}>
                <Eye className="mr-2" /> {isPdfVisible ? 'Ocultar PDF' : 'Ver PDF Embebido'}
              </Button>
              <Button size="lg" variant="secondary" className="flex-1" asChild>
                <Link href={document.fileUrl} target="_blank" rel="noopener noreferrer" download>
                  <Download className="mr-2" /> Descargar Archivo
                </Link>
              </Button>
            </div>
             {canManage && (
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <Button size="lg" variant="outline" className="flex-1" asChild>
                        <Link href={`/my-documents/edit/${document.id}`}>
                            <Edit className="mr-2" /> Editar
                        </Link>
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="lg" variant="destructive" className="flex-1">
                                <Trash2 className="mr-2" /> Eliminar
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente el documento de la base de datos.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
             {isPdfVisible && (
              <div className="mt-8">
                <Card>
                  <CardContent className="p-2">
                    <div className="relative w-full aspect-[4/5]">
                       <iframe
                        src={pdfViewerUrl}
                        title={`PDF Viewer for ${document.title}`}
                        className="w-full h-full"
                        style={{ border: 'none' }}
                        allowFullScreen
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
