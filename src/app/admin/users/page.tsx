"use client";

import React, { useState } from 'react';
import type { User as AppUser } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth, useUserClaims, useUser, useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { collection, doc } from 'firebase/firestore';

const roleColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Admin: 'destructive',
  Editor: 'default',
  User: 'secondary',
};

function UserActions({ user: targetUser, onRoleChange }: { user: AppUser; onRoleChange: (uid: string, newRole: string) => void; }) {
    const { user: currentUser } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRoleChange = async (newRole: 'Admin' | 'Editor' | 'User') => {
        if (!firestore || isSubmitting || currentUser?.uid === targetUser.id) return;

        setIsSubmitting(true);
        try {
            const userDocRef = doc(firestore, 'users', targetUser.id);
            // We only need to update the role in Firestore. The custom claim will be updated on next login.
            await setDocumentNonBlocking(userDocRef, { role: newRole }, { merge: true });

            onRoleChange(targetUser.id, newRole);
            toast({
                title: "Rol Actualizado",
                description: `El rol de ${targetUser.name || targetUser.email} ha sido cambiado a ${newRole}.`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error al cambiar rol",
                description: error.message || 'No se pudo completar la acción.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isCurrentUser = currentUser?.uid === targetUser.id;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" disabled={isSubmitting || isCurrentUser}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Cambiar Rol</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => handleRoleChange('Admin')}>Admin</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange('Editor')}>Editor</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange('User')}>User</DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function UsersAdminPage() {
  const { claims, isLoadingClaims } = useUserClaims();
  const firestore = useFirestore();
  const isAdmin = claims?.role === 'Admin';
  
  const usersQuery = useMemoFirebase(() => {
    // Only create the query if the user is an admin and firestore is available
    if (isAdmin && firestore) {
      return collection(firestore, 'users');
    }
    return null; // Return null if not admin or firestore is not ready
  }, [isAdmin, firestore]);

  const { data: usersData, isLoading: isLoadingUsers, error } = useCollection<AppUser>(usersQuery);
  const [users, setUsers] = useState<AppUser[]>([]);

  React.useEffect(() => {
    if (usersData) {
        setUsers(usersData);
    }
  }, [usersData]);


  const handleRoleChange = (uid: string, newRole: string) => {
    setUsers(currentUsers => 
        currentUsers.map(u => u.id === uid ? { ...u, role: newRole as AppUser['role'] } : u)
    );
  };

  if (isLoadingClaims) {
     return <div className="container mx-auto flex justify-center items-center h-full"><p>Verificando permisos...</p></div>;
  }
  
  if (!isAdmin) {
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
                      <p className="text-muted-foreground">No tienes los permisos necesarios para ver esta sección.</p>
                  </CardContent>
              </Card>
          </div>
      );
  }

  const isLoading = isLoadingUsers || isLoadingClaims;

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
            {isLoading ? 'Cargando usuarios...' : `Hay un total de ${users.length} usuarios en el sistema.`}
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
                    Error al cargar usuarios: {error.message}
                  </TableCell>
                </TableRow>
              ) : users.length > 0 ? (
                users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatarUrl} alt={user.name} />
                          <AvatarFallback>{user.name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{user.name || 'Sin Nombre'}</div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                        <Badge variant={roleColors[user.role] || 'outline'}>{user.role}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <UserActions user={user} onRoleChange={handleRoleChange} />
                    </TableCell>
                  </TableRow>
                ))
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
