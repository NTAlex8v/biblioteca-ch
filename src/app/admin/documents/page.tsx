
"use client";

import React from 'react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Document as DocumentType, Category } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

function DocumentActions({ documentId }: { documentId: string }) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleDelete = () => {
    if (!firestore) return;
    const docRef = doc(firestore, 'documents', documentId);
    deleteDocumentNonBlocking(docRef);
    toast({
      variant: "destructive",
      title: 'Documento eliminado',
      description: 'El documento ha sido eliminado permanentemente.',
    });
  };

  return (
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
            <Link href={`/admin/documents/edit/${documentId}`}>
                <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
             <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                </DropdownMenuItem>
            </AlertDialogTrigger>
        </DropdownMenuContent>
        </DropdownMenu>
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
  );
}

export default function DocumentsAdminPage() {
  const firestore = useFirestore();
  const documentsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'documents') : null, [firestore]);
  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'categories') : null, [firestore]);
  
  const { data: documents, isLoading: isLoadingDocs } = useCollection<DocumentType>(documentsQuery);
  const { data: categories, isLoading: isLoadingCats } = useCollection<Category>(categoriesQuery);

  const categoryMap = React.useMemo(() => {
    if (!categories) return new Map();
    return new Map(categories.map(cat => [cat.id, cat.name]));
  }, [categories]);

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Documentos</h1>
          <p className="text-muted-foreground">Añade, edita o elimina documentos de la biblioteca.</p>
        </div>
        <Button asChild>
          <Link href="/admin/documents/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Documento
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Documentos en la Biblioteca</CardTitle>
          <CardDescription>
            {isLoadingDocs ? 'Cargando documentos...' : `Hay un total de ${documents?.length || 0} documentos.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Año</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingDocs ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="h-16"><div className="w-full h-8 animate-pulse rounded-md bg-muted"></div></TableCell>
                  </TableRow>
                ))
              ) : documents && documents.length > 0 ? (
                documents.map(doc => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell>{doc.author}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{categoryMap.get(doc.categoryId) || 'Sin categoría'}</Badge>
                    </TableCell>
                    <TableCell>{doc.year}</TableCell>
                    <TableCell className="text-right">
                      <DocumentActions documentId={doc.id} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No se encontraron documentos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
