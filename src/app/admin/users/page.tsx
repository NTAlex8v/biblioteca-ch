
"use client";

import React, { useEffect, useState } from 'react';
import type { User as AppUser } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth, useUserClaims } from '@/firebase';

export default function UsersAdminPage() {
  const { claims, isLoadingClaims } = useUserClaims();
  const isAdmin = claims?.role === 'Admin';
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState<Error | null>(null);


  useEffect(() => {
    // We will not fetch users for now to prevent permission errors.
    // This will be replaced by a secure API call in the future.
    setIsLoadingUsers(false);
  }, []);
  

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
            {isLoading ? 'Cargando...' : `Funcionalidad de gestión de usuarios pendiente de implementación.`}
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
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    La carga de usuarios se implementará a través de un backend seguro.
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
