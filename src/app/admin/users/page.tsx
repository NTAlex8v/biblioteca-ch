"use client";

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, useUser as useAppUser, useUserClaims } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { User, AuditLog } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, AlertTriangle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const roleColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Admin: 'destructive',
  Editor: 'default',
  User: 'secondary',
};

function UserActions({ user }: { user: User }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: currentUser } = useAppUser();


  const logAction = (action: 'create' | 'update' | 'delete' | 'role_change', entityId: string, entityName: string, details: string) => {
    if (!firestore || !currentUser) return;
    const log: Omit<AuditLog, 'id'> = {
        timestamp: new Date().toISOString(),
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email || "Sistema",
        action: action,
        entityType: 'User',
        entityId,
        entityName,
        details,
    };
    addDocumentNonBlocking(collection(firestore, 'users', currentUser.uid, 'auditLogs'), log);
  };


  const handleRoleChange = (newRole: 'Admin' | 'Editor' | 'User') => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', user.id);
    updateDocumentNonBlocking(userRef, { role: newRole });
    logAction('role_change', user.id, user.name || user.email, `Rol de ${user.name || user.email} cambiado a ${newRole}.`);
    toast({
      title: 'Rol actualizado',
      description: `El rol de ${user.name || user.email} ha sido cambiado a ${newRole}.`,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleRoleChange('Admin')}>
          Hacer Administrador
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleChange('Editor')}>
          Hacer Editor
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleChange('User')}>
          Hacer Usuario
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function UsersAdminPage() {
  const firestore = useFirestore();
  const { claims, isLoadingClaims } = useUserClaims();

  const isAdmin = claims?.role === 'Admin';
  
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collection(firestore, 'users');
  }, [firestore, isAdmin]);

  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);
  
  if (isLoadingClaims) {
    return <div className="flex justify-center items-center h-full"><p>Cargando y verificando permisos...</p></div>;
  }
  
  if (!isAdmin) {
      return (
          <div className="container mx-auto flex justify-center items-center h-full">
              <Card className="w-full max-w-md">
                  <CardHeader className="text-center">
                      <div className="mx-auto bg-destructive/20 p-3 rounded-full">
                          <AlertTriangle className="h-8 w-8 text-destructive" />
                      </div>
                      <CardTitle className="mt-4">Acceso Restringido</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                      <p className="text-muted-foreground">Esta sección es exclusiva para administradores. No tienes los permisos necesarios para gestionar usuarios.</p>
                  </CardContent>
              </Card>
          </div>
      );
  }

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">Administra los usuarios y sus roles en el sistema.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Registrados</CardTitle>
          <CardDescription>
            La lista de usuarios está desactivada en esta interfaz por razones de seguridad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold text-muted-foreground">Gestión de Usuarios en la Consola de Firebase</h3>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Para ver, editar roles o eliminar usuarios, por favor utiliza la Consola de Firebase. Esta es la forma más segura de gestionar los permisos de tu aplicación.
            </p>
            <Button asChild className="mt-4">
              <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">
                Ir a la Consola de Firebase
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
