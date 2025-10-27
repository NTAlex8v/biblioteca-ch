'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Eye, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { Document as DocumentType, Tag } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useState, useEffect } from 'react';
import { useUser, useFirestore, deleteDocumentNonBlocking, FirestorePermissionError, errorEmitter } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
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
  document: DocumentType;
  categoryName: string;
  documentTags: Tag[];
};

export default function DocumentDetailClient({ document, categoryName, documentTags }: DocumentDetailProps) {
  const [isPdfVisible, setIsPdfVisible] = useState(false);
  const [formattedDate, setFormattedDate] = useState('');
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const isOwner = user && document.createdBy === user.uid;

  useEffect(() => {
    if (document.lastUpdated) {
      setFormattedDate(new Date(document.lastUpdated).toLocaleDateString());
    }
  }, [document.lastUpdated]);
  
  const randomImage = PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)];
  const thumbnailUrl = document?.thumbnailUrl || randomImage.imageUrl;

  const handleDelete = () => {
    if (!firestore) return;
    const docRef = doc(firestore, 'documents', document.id);
    
    deleteDoc(docRef)
      .then(() => {
        toast({
          variant: "destructive",
          title: 'Documento eliminado',
          description: 'El documento ha sido eliminado permanentemente.',
        });
        router.push('/');
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

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
             {isOwner && (
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
                        src={document.fileUrl}
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
