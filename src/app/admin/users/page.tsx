"use client";

import React, { useState } from 'react';
import { useFirestore, updateDocumentNonBlocking, addDocumentNonBlocking, useUser as useAppUser, useUserClaims } from '@/firebase';
import { collection, doc, query, where, getDocs, limit } from 'firebase/firestore';
import type { User, AuditLog } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, AlertTriangle, Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const roleColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Admin: 'destructive',
  Editor: 'default',
  User: 'secondary',
};

const searchSchema = z.object({
  email: z.string().email("Por favor, introduce un correo electrónico válido."),
});


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
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const isAdmin = claims?.role === 'Admin';
  
  const searchForm = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: { email: "" },
  });


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

    // Update local state to reflect role change immediately
    if (searchedUser && searchedUser.id === userId) {
        setSearchedUser({ ...searchedUser, role: newRole });
    }

    logAction('role_change', userId, userName, `Rol de ${userName} cambiado a ${newRole}.`);
    toast({
      title: 'Rol actualizado',
      description: `El rol de ${userName} ha sido cambiado a ${newRole}. Los cambios pueden tardar en reflejarse.`,
    });
  };

  const handleSearch = async (values: z.infer<typeof searchSchema>) => {
    if (!firestore || !isAdmin) return;

    setIsLoadingSearch(true);
    setSearchError(null);
    setSearchedUser(null);
    setHasSearched(true);
    
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('email', '==', values.email), limit(1));

    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            setSearchedUser(null);
        } else {
            const userDoc = querySnapshot.docs[0];
            setSearchedUser({ id: userDoc.id, ...userDoc.data() } as User);
        }
    } catch (serverError: any) {
        setSearchError("Ocurrió un error al buscar el usuario. Verifica los permisos de Firestore.");
        const permissionError = new FirestorePermissionError({
            path: usersRef.path,
            operation: 'list', // A query is a 'list' operation in terms of rules
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsLoadingSearch(false);
    }
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
        <p className="text-muted-foreground">Busca un usuario por su correo electrónico para administrar su rol.</p>
      </div>
      
      <Card className="mb-8">
          <CardHeader>
              <CardTitle>Buscar Usuario</CardTitle>
          </CardHeader>
          <CardContent>
              <Form {...searchForm}>
                  <form onSubmit={searchForm.handleSubmit(handleSearch)} className="flex items-start gap-4">
                      <FormField
                          control={searchForm.control}
                          name="email"
                          render={({ field }) => (
                              <FormItem className="flex-grow">
                                  <FormLabel className="sr-only">Email</FormLabel>
                                  <FormControl>
                                      <Input placeholder="usuario@ejemplo.com" {...field} />
                                  </FormControl>
                              </FormItem>
                          )}
                      />
                      <Button type="submit" disabled={isLoadingSearch}>
                          {isLoadingSearch ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                          Buscar
                      </Button>
                  </form>
              </Form>
          </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Resultados de la Búsqueda</CardTitle>
             <CardDescription>
                {hasSearched ? "Mostrando el resultado de la búsqueda." : "Introduce un correo para buscar un usuario."}
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
                  {isLoadingSearch ? (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                        </TableCell>
                    </TableRow>
                  ) : searchError ? (
                     <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-destructive">
                           {searchError}
                        </TableCell>
                    </TableRow>
                  ) : searchedUser ? (
                    <TableRow>
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
                  ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            {hasSearched ? "No se encontró ningún usuario con ese correo electrónico." : "Realiza una búsqueda para ver los resultados."}
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
    