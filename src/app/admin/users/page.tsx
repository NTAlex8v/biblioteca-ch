"use client";

import React, { useState } from 'react';
import { useFirestore, updateDocumentNonBlocking, addDocumentNonBlocking, useUser as useAppUser, useUserClaims } from '@/firebase';
import { collection, doc, query, where, getDocs, limit } from 'firebase/firestore';
import type { User, AuditLog } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, AlertTriangle, Search, User as UserIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

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

  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>('Busca un usuario por su correo electrónico para gestionar su rol.');

  const isAdmin = claims?.role === 'Admin';
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !searchEmail) return;

    setIsLoadingSearch(true);
    setFoundUser(null);
    setSearchMessage(null);

    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('email', '==', searchEmail), limit(1));

    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setFoundUser(null);
        setSearchMessage('No se encontró ningún usuario con ese correo electrónico.');
      } else {
        const userDoc = querySnapshot.docs[0];
        setFoundUser({ id: userDoc.id, ...userDoc.data() } as User);
      }
    } catch (e) {
      console.error("Error searching user:", e);
      setSearchMessage('Ocurrió un error al buscar el usuario.');
    } finally {
      setIsLoadingSearch(false);
    }
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

  const handleRoleChange = (userId: string, newRole: 'Admin' | 'Editor' | 'User') => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userRef, { role: newRole });

    // Optimistically update UI
    if(foundUser && foundUser.id === userId) {
      setFoundUser({ ...foundUser, role: newRole });
    }

    const userName = foundUser?.name || foundUser?.email || userId;
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

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">Administra los roles de los usuarios en el sistema.</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
            <CardTitle>Buscar Usuario</CardTitle>
            <CardDescription>
                Debido a las reglas de seguridad, no es posible listar todos los usuarios. Por favor, busca un usuario por su email.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
                <Input 
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    disabled={isLoadingSearch}
                />
                <Button type="submit" disabled={isLoadingSearch || !searchEmail}>
                    {isLoadingSearch ? <Loader2 className="animate-spin" /> : <Search />}
                    <span className="ml-2 hidden sm:inline">Buscar</span>
                </Button>
            </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Resultados de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
            {isLoadingSearch ? (
                <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : foundUser ? (
                <div className="p-4 border rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={foundUser.avatarUrl} alt={foundUser.name}/>
                          <AvatarFallback>{foundUser.name?.charAt(0) || foundUser.email?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{foundUser.name || 'Sin nombre'}</p>
                            <p className="text-sm text-muted-foreground">{foundUser.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge variant={roleColors[foundUser.role] || 'secondary'}>{foundUser.role}</Badge>
                        <UserActions user={foundUser} onRoleChange={handleRoleChange} />
                    </div>
                </div>
            ) : (
                <div className="text-center p-8">
                    <UserIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">{searchMessage}</p>
                </div>
            )}
        </CardContent>
      </Card>

    </div>
  );
}