"use client";

import React, { useState, useEffect } from 'react';
import { useFirestore, updateDocumentNonBlocking, addDocumentNonBlocking, useUser as useAppUser, useUserClaims } from '@/firebase';
import { collection, doc, query, where, getDocs } from 'firebase/firestore';
import type { User, AuditLog } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const roleColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Admin: 'destructive',
  Editor: 'default',
  User: 'secondary',
};

function UserActions({ user, onRoleChange }: { user: User; onRoleChange: (userId: string, newRole: 'Admin' | 'Editor' | 'User') => void }) {
  
  const handleRoleChange = (newRole: 'Admin' | 'Editor' | 'User') => {
    onRoleChange(user.id, newRole);
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

  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = claims?.role === 'Admin';
  
  useEffect(() => {
    if (!firestore || !isAdmin) {
      setIsLoadingUsers(false);
      return;
    }

    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      setError(null);
      
      const usersCollection = collection(firestore, 'users');
      
      try {
        const querySnapshot = await getDocs(usersCollection).catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: usersCollection.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            // Throw it to be caught by the outer try/catch
            throw permissionError;
        });

        const allUsers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(allUsers);

      } catch (e: any) {
        console.error("Error fetching users:", e);
        // This is a fallback error message for the UI. The actual contextual error has been emitted globally.
        setError("Tus reglas de seguridad actuales no permiten listar todos los usuarios. Para gestionar roles, por favor, hazlo directamente desde la consola de Firebase.");
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [firestore, isAdmin]);

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

  const handleRoleChange = (userId: string, newRole: 'Admin' | 'Editor' | 'User') => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userRef, { role: newRole });

    // Optimistically update UI
    setUsers(currentUsers => 
        currentUsers.map(u => u.id === userId ? { ...u, role: newRole } : u)
    );

    const user = users.find(u => u.id === userId);
    const userName = user?.name || user?.email || userId;
    logAction('role_change', userId, userName, `Rol de ${userName} cambiado a ${newRole}.`);
    toast({
      title: 'Rol actualizado',
      description: `El rol de ${userName} ha sido cambiado a ${newRole}.`,
    });
  };


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

  const renderContent = () => {
    if (isLoadingUsers) {
      return (
        Array.from({ length: 3 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell colSpan={4} className="h-16"><div className="w-full h-8 animate-pulse rounded-md bg-muted"></div></TableCell>
          </TableRow>
        ))
      );
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="h-24 text-center">
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error de Permisos de Firestore</AlertTitle>
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
          </TableCell>
        </TableRow>
      );
    }
    
    if (users.length > 0) {
      return users.map(user => (
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
      ));
    }
    
    return (
      <TableRow>
        <TableCell colSpan={4} className="h-24 text-center">
          No se encontraron usuarios registrados.
        </TableCell>
      </TableRow>
    );
  };


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
              {renderContent()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
