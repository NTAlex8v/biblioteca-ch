
"use client";

import React, { useState } from 'react';
import { useFirestore, updateDocumentNonBlocking, addDocumentNonBlocking, useUser as useAppUser, useUserClaims, useAuth, errorEmitter, FirestorePermissionError } from '@/firebase';
import type { User, AuditLog } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, AlertTriangle, Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { doc, collection, query, where, getDocs } from 'firebase/firestore';
import { Input } from '@/components/ui/input';

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

  const [searchedUser, setSearchedUser] = useState<User | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const isAdmin = claims?.role === 'Admin';

  const handleSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!firestore || !isAdmin || !searchEmail) return;

      setIsLoading(true);
      setSearchError(null);
      setSearchedUser(null);

      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where("email", "==", searchEmail.trim()));
      
      getDocs(q).then((querySnapshot) => {
          if (querySnapshot.empty) {
              setSearchError("No se encontró ningún usuario con ese correo electrónico.");
          } else {
              const userData = querySnapshot.docs[0].data() as User;
              const userId = querySnapshot.docs[0].id;
              setSearchedUser({ ...userData, id: userId });
          }
      }).catch((serverError) => {
          setSearchError("Ocurrió un error al buscar el usuario. Revisa los permisos de Firestore.");
          const permissionError = new FirestorePermissionError({
              path: 'users',
              operation: 'list', // A query is a 'list' operation
          });
          errorEmitter.emit('permission-error', permissionError);
      }).finally(() => {
          setIsLoading(false);
      });
  };

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

    if (searchedUser && searchedUser.id === userId) {
        setSearchedUser({ ...searchedUser, role: newRole });
    }
    
    logAction('role_change', userId, userName, `Rol de ${userName} cambiado a ${newRole}.`);
    toast({
      title: 'Rol actualizado',
      description: `El rol de ${userName} ha sido cambiado a ${newRole}.`,
    });
  };

  if (isLoadingClaims) {
    return (
        <div className="container mx-auto flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-4">Verificando permisos...</p>
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
                      <p className="text-muted-foreground">Esta sección es exclusiva para administradores.</p>
                  </CardContent>
              </Card>
          </div>
      );
  }

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">Busca un usuario por su correo electrónico para administrar su rol.</p>
      </div>

      <Card className="mb-8">
          <CardHeader>
              <CardTitle>Buscar Usuario</CardTitle>
          </CardHeader>
          <CardContent>
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                  <Input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      className="flex-grow"
                  />
                  <Button type="submit" disabled={isLoading || !searchEmail}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                      Buscar
                  </Button>
              </form>
          </CardContent>
      </Card>

      {searchedUser && (
        <Card>
          <CardHeader>
              <CardTitle>Resultado de la Búsqueda</CardTitle>
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
                      <TableRow key={searchedUser.id}>
                          <TableCell>
                              <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                      <AvatarImage src={searchedUser.avatarUrl} alt={searchedUser.name}/>
                                      <AvatarFallback>{searchedUser.name?.charAt(0) || searchedUser.email?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{searchedUser.name || 'Sin nombre'}</span>
                              </div>
                          </TableCell>
                          <TableCell>{searchedUser.email}</TableCell>
                          <TableCell>
                              <Badge variant={roleColors[searchedUser.role] || 'secondary'}>{searchedUser.role}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <UserActions user={searchedUser} onRoleChange={handleRoleChange} />
                          </TableCell>
                      </TableRow>
                  </TableBody>
                </Table>
          </CardContent>
        </Card>
      )}

      {searchError && !searchedUser && (
          <Card className="border-destructive">
              <CardHeader>
                  <CardTitle className="text-destructive">Error de Búsqueda</CardTitle>
              </CardHeader>
              <CardContent>
                  <p>{searchError}</p>
              </CardContent>
          </Card>
      )}
    </div>
  );
}
