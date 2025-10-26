
"use client";

import React, { useEffect, useState } from 'react';
import type { User, AuditLog } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { doc, collection } from 'firebase/firestore';
import { useAuth, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';

const roleColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Admin: 'destructive',
  Editor: 'default',
  User: 'secondary',
};

async function fetchUsersFromApi(idToken: string): Promise<User[]> {
  const res = await fetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
     // Lanzar un error específico para el caso de "Forbidden"
    if (res.status === 403) {
      const err = new Error("Forbidden: User is not an admin.");
      (err as any).isForbidden = true;
      throw err;
    }
    throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  return data.users as User[];
}


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
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      if (!auth.currentUser) {
        setIsLoading(false);
        // Do not set an error here, the UI will just show nothing or a login prompt.
        return;
      }

      setIsLoading(true);
      setError(null);
      setIsForbidden(false);
      
      try {
        // Forzar la actualización del token para obtener los últimos claims simulados
        const idToken = await auth.currentUser.getIdToken(true);
        const fetchedUsers = await fetchUsersFromApi(idToken);
        setUsers(fetchedUsers);
      } catch (err: any) {
        console.error("Failed to fetch users:", err);
        if (err.isForbidden) {
          setIsForbidden(true);
          setError("No tienes permiso para ver esta sección.");
        } else {
          setError(err.message || "Ocurrió un error al cargar los usuarios.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    // Solo se llama si hay un usuario autenticado.
    if(auth.currentUser) {
        loadUsers();
    } else {
        setIsLoading(false);
        setError("Autenticación requerida para ver usuarios.");
    }

  }, [auth, auth.currentUser]);


  const logAction = (action: 'create' | 'update' | 'delete' | 'role_change', entityId: string, entityName: string, details: string) => {
    if (!firestore || !auth.currentUser) return;
    const log: Omit<AuditLog, 'id'> = {
        timestamp: new Date().toISOString(),
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email || "Sistema",
        action: action,
        entityType: 'User',
        entityId,
        entityName,
        details,
    };
    addDocumentNonBlocking(collection(firestore, 'users', auth.currentUser.uid, 'auditLogs'), log);
  };

  const handleRoleChange = async (userId: string, newRole: 'Admin' | 'Editor' | 'User', userName: string) => {
    if (!firestore || !auth.currentUser) return;

    try {
        // For role changes, we need to call our API to let the backend handle it
        // securely. For now, we update firestore directly as we don't have that API yet.
        const userDocRef = doc(firestore, 'users', userId);
        updateDocumentNonBlocking(userDocRef, { role: newRole });

        // Optimistically update the UI
        setUsers(currentUsers =>
            currentUsers.map(u => (u.id === userId ? { ...u, role: newRole } : u))
        );

        logAction('role_change', userId, userName, `Rol de ${userName} cambiado a ${newRole}.`);
        
        toast({
            title: 'Rol actualizado',
            description: `El rol de ${userName} ha sido cambiado a ${newRole}.`,
        });

    } catch (err) {
        console.error("Error changing role:", err);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo actualizar el rol.",
        });
    }
  };
  
  if (isForbidden) {
      return (
          <div className="container mx-auto flex justify-center items-center h-full">
              <Card className="w-full max-w-md">
                  <CardHeader className="text-center">
                      <div className="mx-auto bg-destructive/20 p-3 rounded-full">
                          <AlertTriangle className="h-8 w-8 text-destructive" />
                      </div>
                      <CardTitle className="mt-4">Acceso Denegado</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                      <p className="text-muted-foreground">{error}</p>
                  </CardContent>
              </Card>
          </div>
      );
  }

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">Administra los roles de todos los usuarios del sistema.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos los Usuarios</CardTitle>
          <CardDescription>
            {isLoading ? 'Cargando usuarios...' : `Hay un total de ${users?.length || 0} usuarios.`}
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
              {isLoading ? (
                 Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4} className="h-16"><div className="w-full h-8 animate-pulse rounded-md bg-muted"></div></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-destructive">
                    {error}
                  </TableCell>
                </TableRow>
              ) : users && users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatarUrl} alt={user.name} />
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
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No se encontraron usuarios o no tienes permiso para verlos.
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
