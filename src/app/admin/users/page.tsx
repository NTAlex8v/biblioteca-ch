
"use client";

import React from 'react';
import { useFirestore, updateDocumentNonBlocking, addDocumentNonBlocking, useUser as useAppUser, useUserClaims, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { User, AuditLog } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const roleColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Admin: 'destructive',
  Editor: 'default',
  User: 'secondary',
};

function UserActions({ user, onRoleChange }: { user: User; onRoleChange: (userId: string, newRole: 'Admin' | 'Editor' | 'User', userName: string) => void }) {
  
  const handleRoleChange = (newRole: 'Admin' | 'Editor' | 'User') => {
    const userName = user.name || user.email;
    onRoleChange(user.id, newRole, userName);
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
        <DropdownMenuLabel>Cambiar Rol</DropdownMenuLabel>
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
  const { user: currentUser } = useAppUser();
  const { toast } = useToast();

  const isAdmin = claims?.role === 'Admin';
  
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collection(firestore, 'users');
  }, [firestore, isAdmin]);

  const { data: users, isLoading: isLoadingUsers, error: usersError } = useCollection<User>(usersQuery);

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

  const handleRoleChange = (userId: string, newRole: 'Admin' | 'Editor' | 'User', userName: string) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userRef, { role: newRole });

    logAction('role_change', userId, userName, `Rol de ${userName} cambiado a ${newRole}.`);
    toast({
      title: 'Rol actualizado',
      description: `El rol de ${userName} ha sido cambiado a ${newRole}. Los cambios pueden tardar en reflejarse.`,
    });
  };

  if (isLoadingClaims) {
    return (
        <div className="container mx-auto flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-4">Cargando y verificando permisos...</p>
        </div>
    );
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
        <p className="text-muted-foreground">Administra los roles de los usuarios en el sistema.</p>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Usuarios Registrados</CardTitle>
             <CardDescription>
                {isLoadingUsers ? 'Cargando usuarios...' : `Mostrando ${users?.length || 0} usuarios.`}
            </CardDescription>
        </CardHeader>
        <CardContent>
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingUsers ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={4} className="h-16">
                            <div className="w-full h-8 animate-pulse rounded-md bg-muted"></div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : users && users.length > 0 ? (
                    users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={user.avatarUrl} alt={user.name}/>
                                    <AvatarFallback>{user.name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{user.name || 'Sin nombre'}</span>
                            </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                            <Badge variant={roleColors[user.role] || 'secondary'}>{user.role}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <UserActions user={user} onRoleChange={handleRoleChange} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : usersError ? (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                             <div className="text-destructive">
                                <p className="font-bold">Error de Permisos de Firestore</p>
                                <p className="text-sm">Tus reglas de seguridad actuales no permiten listar todos los usuarios. Para gestionar roles, por favor, hazlo directamente desde la consola de Firebase.</p>
                            </div>
                        </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            No se encontraron usuarios.
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
