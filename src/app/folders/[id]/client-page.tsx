'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, getDocs } from 'firebase/firestore';
import type { Document as DocumentType, Folder, Category } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder as FolderIcon, PlusCircle, MoreHorizontal, Trash2, AlertTriangle, Loader2, Home as HomeIcon, ChevronRight } from 'lucide-react';
import DocumentCard from '@/components/document-card';
import DocumentListItem from '@/components/document-list-item';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface FolderClientPageProps {
  folderId: string;
}

const ItemSkeleton = () => (
    <div className="flex flex-col gap-2">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-5 w-3-4" />
        <Skeleton className="h-4 w-1-2" />
    </div>
);

function FolderCard({ folder }: { folder: Folder }) {
    const { user, userData } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();

    const canManage = userData?.role === 'Admin' || userData?.role === 'Editor' || folder.createdBy === user?.uid;

    const handleDelete = async () => {
        if (!firestore) return;

        const documentsQuery = query(collection(firestore, 'documents'), where('folderId', '==', folder.id));
        const documentSnapshot = await getDocs(documentsQuery);

        if (!documentSnapshot.empty) {
            toast({
                variant: "destructive",
                title: 'No se puede eliminar la carpeta',
                description: 'Primero debe eliminar todos los documentos dentro de la carpeta.',
            });
            return;
        }
        
        const docRef = doc(firestore, 'folders', folder.id);

        deleteDocumentNonBlocking(docRef);
        
        toast({
            variant: "destructive",
            title: 'Carpeta eliminada',
            description: `La carpeta '${folder.name}' ha sido eliminada.`,
        });
    };

    return (
        <Card className="group relative flex h-full flex-col items-center justify-center p-6 text-center transition-all duration-300 hover:shadow-lg hover:border-primary">
            <Link key={folder.id} href={`/folders/${folder.id}`} className="absolute inset-0 z-0" />
            {canManage && (
                 <div className="absolute top-2 right-2 z-10">
                    <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Abrir menú</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Eliminar
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente la carpeta.
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
            <FolderIcon className="h-12 w-12 mb-2 text-primary group-hover:scale-110 transition-transform"/>
            <p className="font-medium text-lg mt-2">{folder.name}</p>
        </Card>
    );
}

export default function FolderClientPage({ folderId }: FolderClientPageProps) {
  const firestore = useFirestore();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  const handleActionClick = () => {
    toast({
        variant: "destructive",
        title: "Acción requerida",
        description: "Debes iniciar sesión para realizar esta acción.",
    });
    router.push('/login');
  };

  const folderDocRef = useMemoFirebase(() => {
    if (!firestore || !folderId) return null;
    return doc(firestore, 'folders', folderId);
  }, [firestore, folderId]);

  const { data: folder, isLoading: isLoadingFolder, error: folderError } = useDoc<Folder>(folderDocRef);

  const subFoldersQuery = useMemoFirebase(() => {
    if (!firestore || !folderId) return null;
    return query(collection(firestore, 'folders'), where('parentFolderId', '==', folderId));
  }, [firestore, folderId]);

  const documentsQuery = useMemoFirebase(() => {
    if (!firestore || !folderId) return null;
    return query(collection(firestore, 'documents'), where('folderId', '==', folderId));
  }, [firestore, folderId]);

  const { data: subFolders, isLoading: isLoadingSubFolders } = useCollection<Folder>(subFoldersQuery);
  const { data: documents, isLoading: isLoadingDocuments } = useCollection<DocumentType>(documentsQuery);

  const categoryDocRef = useMemoFirebase(() => {
      if (!firestore || !folder?.categoryId) return null;
      return doc(firestore, 'categories', folder.categoryId);
  }, [firestore, folder?.categoryId]);
  const { data: category } = useDoc<Category>(categoryDocRef);

  const { documentsWithThumb, documentsWithoutThumb } = useMemo(() => {
    const withThumb = documents?.filter(doc => doc.thumbnailUrl) || [];
    const withoutThumb = documents?.filter(doc => !doc.thumbnailUrl) || [];
    return { documentsWithThumb: withThumb, documentsWithoutThumb: withoutThumb };
  }, [documents]);

  const isLoading = isLoadingFolder || isLoadingSubFolders || isLoadingDocuments;

  if (isLoading) {
      return (
         <div className="container mx-auto flex justify-center items-center h-[calc(100vh-10rem)]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-4 text-muted-foreground">Cargando carpeta...</p>
        </div>
      )
  }

  if (folderError) {
       return (
          <div className="container mx-auto flex justify-center items-center h-full">
              <Card className="w-full max-w-md text-center">
                  <CardHeader>
                      <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
                          <AlertTriangle className="h-8 w-8 text-destructive" />
                      </div>
                      <CardTitle className="mt-4">Error al Cargar</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-muted-foreground">No se pudo cargar la carpeta. Es posible que no tengas permisos o que haya ocurrido un error de red.</p>
                       <Button onClick={() => router.back()} className="mt-4">Volver</Button>
                  </CardContent>
              </Card>
          </div>
      );
  }

  if (!folder) {
      return (
           <div className="container mx-auto flex justify-center items-center h-full">
              <Card className="w-full max-w-md text-center">
                  <CardHeader>
                      <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                          <AlertTriangle className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="mt-4">Carpeta no encontrada</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-muted-foreground">La carpeta que estás buscando no existe o ha sido eliminada.</p>
                       <Button onClick={() => router.push('/')} className="mt-4">Ir a Inicio</Button>
                  </CardContent>
              </Card>
          </div>
      );
  }

  return (
    <div className="container mx-auto">
        <nav className="mb-4 text-sm text-muted-foreground flex items-center gap-1.5">
            <Link href="/" className="hover:underline flex items-center gap-1.5"><HomeIcon className="h-4 w-4" /> Inicio</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/category/${folder.categoryId}`} className="hover:underline">{category?.name || 'Categoría'}</Link>
            <ChevronRight className="h-4 w-4" />
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
             {user ? (
                <>
                    <Button asChild>
                        <Link href={`/folders/new?categoryId=${folder.categoryId}&parentFolderId=${folder.id}`}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nueva Sub-carpeta
                        </Link>
                    </Button>
                    <Button asChild variant="secondary">
                        <Link href={`/my-documents/new?categoryId=${folder.categoryId}&folderId=${folder.id}`}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nuevo Documento
                        </Link>
                    </Button>
                </>
             ) : (
                <>
                    <Button onClick={handleActionClick}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nueva Carpeta
                    </Button>
                    <Button onClick={handleActionClick} variant="secondary">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nuevo Documento
                    </Button>
                </>
             )}
        </div>
      </div>
      
      { (isLoadingSubFolders || (subFolders && subFolders.length > 0)) && (
          <>
            <h2 className="text-2xl font-semibold tracking-tight mb-4">Sub-carpetas</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                {isLoadingSubFolders ? (
                    Array.from({ length: 2 }).map((_, i) => (
                        <Card key={i} className="p-4 flex flex-col items-center justify-center text-center">
                            <Skeleton className="h-12 w-12 mb-2 rounded-lg" />
                            <Skeleton className="h-5 w-24" />
                        </Card>
                    ))
                ) : (
                    subFolders?.map(subFolder => (
                       <FolderCard key={subFolder.id} folder={subFolder} />
                    ))
                )}
            </div>
          </>
      )}


       <h2 className="text-2xl font-semibold tracking-tight mb-4">Documentos</h2>
       {isLoadingDocuments ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => <ItemSkeleton key={i} />)}
            </div>
       ) : (
        <>
          {documentsWithThumb.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
              {documentsWithThumb.map(doc => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
            </div>
          )}

          {documentsWithoutThumb.length > 0 && (
            <div className="space-y-3">
              {documentsWithoutThumb.map(doc => (
                <DocumentListItem key={doc.id} document={doc} />
              ))}
            </div>
          )}

          {documents && documents.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed rounded-lg mt-4">
              <h3 className="text-xl font-semibold text-muted-foreground">Esta carpeta está vacía</h3>
              <p className="text-muted-foreground mt-2">Puedes añadir una nueva sub-carpeta o un documento.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
