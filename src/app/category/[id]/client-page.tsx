'use client';

import React from 'react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc, FirestorePermissionError, errorEmitter } from '@/firebase';
import { collection, query, where, doc, deleteDoc, getDocs } from 'firebase/firestore';
import type { Document as DocumentType, Category, Folder, User as AppUser } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder as FolderIcon, PlusCircle, MoreHorizontal, Trash2 } from 'lucide-react';
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

interface CategoryClientPageProps {
  category: Category;
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
    const { toast } = useToast();
    const firestore = useFirestore();

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

export default function CategoryClientPage({ category }: CategoryClientPageProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const handleActionClick = () => {
    toast({
        variant: "destructive",
        title: "Acción requerida",
        description: "Debes iniciar sesión para realizar esta acción.",
    });
    router.push('/login');
  };

  const foldersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'folders'), where('categoryId', '==', category.id), where('parentFolderId', '==', null));
  }, [firestore, category.id]);

  const documentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'documents'), where('categoryId', '==', category.id));
  }, [firestore, category.id]);

  const { data: folders, isLoading: isLoadingFolders } = useCollection<Folder>(foldersQuery);
  const { data: allDocuments, isLoading: isLoadingDocuments } = useCollection<DocumentType>(documentsQuery);

  const rootDocuments = React.useMemo(() => {
    if (!allDocuments) return [];
    return allDocuments.filter(doc => !doc.folderId);
  }, [allDocuments]);


  const isLoading = isLoadingFolders || isLoadingDocuments;

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight mt-4">{category.name}</h1>
            <p className="text-muted-foreground">{category.description}</p>
        </div>
        <div className="flex gap-2">
            {user ? (
                <>
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
                        <FolderCard key={folder.id} folder={folder} />
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
       ) : rootDocuments && rootDocuments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {rootDocuments.map(doc => (
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
