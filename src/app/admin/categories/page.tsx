"use client";

import React from 'react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking, addDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Category, AuditLog } from '@/lib/types';
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

function CategoryActions({ category }: { category: Category }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const logAction = (action: 'create' | 'update' | 'delete', entityId: string, entityName: string, details: string) => {
    if (!firestore || !user) return;
    const log: Omit<AuditLog, 'id'> = {
        timestamp: new Date().toISOString(),
        userId: user.uid,
        userName: user.displayName || user.email || "Sistema",
        action: action,
        entityType: 'Category',
        entityId,
        entityName,
        details,
    };
    addDocumentNonBlocking(collection(firestore, 'auditLogs'), log);
  };

  const handleDelete = () => {
    if (!firestore) return;
    const docRef = doc(firestore, 'categories', category.id);
    deleteDocumentNonBlocking(docRef);
    logAction('delete', category.id, category.name, `Se eliminó la categoría '${category.name}'.`);
    toast({
      variant: "destructive",
      title: 'Categoría eliminada',
      description: 'La categoría ha sido eliminada permanentemente.',
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
            <Link href={`/admin/categories/edit/${category.id}`}>
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
                Esta acción no se puede deshacer. Esto eliminará permanentemente la categoría de la base de datos.
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

export default function CategoriesAdminPage() {
  const firestore = useFirestore();
  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'categories') : null, [firestore]);
  
  const { data: categories, isLoading: isLoadingCats } = useCollection<Category>(categoriesQuery);

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Categorías</h1>
          <p className="text-muted-foreground">Añade, edita o elimina categorías de documentos.</p>
        </div>
        <Button asChild>
          <Link href="/admin/categories/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Categoría
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Categorías del Sistema</CardTitle>
          <CardDescription>
            {isLoadingCats ? 'Cargando categorías...' : `Hay un total de ${categories?.length || 0} categorías.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingCats ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={3} className="h-16"><div className="w-full h-8 animate-pulse rounded-md bg-muted"></div></TableCell>
                  </TableRow>
                ))
              ) : categories && categories.length > 0 ? (
                categories.map(cat => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell>{cat.description}</TableCell>
                    <TableCell className="text-right">
                      <CategoryActions category={cat} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No se encontraron categorías.
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
