'use client';

import React from 'react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc, FirestorePermissionError, errorEmitter } from '@/firebase';
import { collection, query, where, doc, deleteDoc, getDocs } from 'firebase/firestore';
import type { Document as DocumentType, Folder, User as AppUser } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder as FolderIcon, PlusCircle, MoreHorizontal, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import DocumentCard from '@/components/document-card';
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
import { notFound } from 'next/navigation';

interface FolderClientPageProps {
  folderId: string;
}

const ItemSkeleton = () => (
    <div className="flex flex-col gap-2">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-5 w-3-4" />
        <Skeleton className="h-4 w-1/2" />
    </div>
);

function FolderCard({ folder }: { folder: Folder }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, "users", user.uid);
    }, [firestore, user]);

    const { data: userData } = useDoc<AppUser>(userDocRef);
    const isAdmin = userData?.role === 'Admin';

    const handleDelete = async () => {
        if (!firestore) return;

        // Check for documents within the folder
        const documentsQuery = query(collection(firestore, 'documents'), where('folderId', '==', folder.id));
        const documentSnapshot = await getDocs(documentsQuery);

        if (!documentSnapshot.empty) {
            toast({
                variant: "destructive",
                title: 'No se puede eliminar la carpeta',
                description: 'Primero debe eliminar todos los documentos dentro de la carpeta antes de poder eliminarla.',
            });
            return;
        }

        const docRef = doc(firestore, 'folders', folder.id);
        
        deleteDoc(docRef)
            .then(() => {
                toast({
                    variant: "destructive",
                    title: 'Carpeta eliminada',
                    description: `La carpeta '${folder.name}' ha sido eliminada.`,
                });
                if (folder.parentFolderId) {
                    router.push(`/folders/${folder.parentFolderId}`);
                } else {
                    router.push(`/category/${folder.categoryId}`);
                }
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
        <Card className="group relative flex h-full flex-col items-center justify-center p-6 text-center transition-all duration-300 hover:shadow-lg hover:border-primary">
            <Link key={folder.id} href={`/folders/${folder.id}`} className="absolute inset-0 z-0" />
            {isAdmin && (
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

  const { data: subFolders, isLoading: isLoadingFolders } = useCollection<Folder>(subFoldersQuery);
  const { data: documents, isLoading: isLoadingDocuments } = useCollection<DocumentType>(documentsQuery);

  const isLoading = isLoadingFolders || isLoadingDocuments || isLoadingFolder;

  // Handle not found after loading
  React.useEffect(() => {
    if (!isLoadingFolder && !folder && !folderError) {
        notFound();
    }
  }, [isLoadingFolder, folder, folderError]);

  if (isLoadingFolder) {
      return (
         <div className="container mx-auto flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-4 text-muted-foreground">Cargando carpeta...</p>
        </div>
      )
  }

  if (folderError) {
      // The FirestorePermissionError is thrown globally by the useDoc hook,
      // so we just need a local UI state.
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
                      <p className="text-muted-foreground">No tienes permisos para ver esta carpeta.</p>
                       <Button onClick={() => router.back()} className="mt-4">Volver</Button>
                  </CardContent>
              </Card>
          </div>
      );
  }

  if (!folder) {
      // This will be caught by the notFound() in the effect, but as a fallback:
      return null;
  }

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
