
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { MoreHorizontal } from "lucide-react";
import type { User as AppUser } from "@/lib/types";

function UsersTable() {
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: users, isLoading: areUsersLoading } = useCollection<AppUser>(usersQuery);

  if (areUsersLoading) {
    return (
      <TableRow>
        <TableCell colSpan={5} className="text-center">Cargando usuarios...</TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {users?.map((user) => (
        <TableRow key={user.id}>
          <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
          <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
          <TableCell>
            <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
              {user.role}
            </Badge>
          </TableCell>
          <TableCell className="hidden md:table-cell">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-haspopup="true" size="icon" variant="ghost">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem>Editar Rol</DropdownMenuItem>
                <DropdownMenuItem>Ver Actividad</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Eliminar Usuario</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function AdminUsersPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const currentUserDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc<AppUser>(currentUserDocRef);
  
  const isAdmin = currentUserData?.role === 'Admin';
  
  if (isUserLoading || isCurrentUserDataLoading) {
      return <div className="container mx-auto"><p>Verificando permisos...</p></div>
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administra los roles y el acceso de los usuarios.</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Correo Electrónico</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="hidden md:table-cell">Registrado</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isAdmin ? (
                 <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">Solo los administradores pueden ver esta sección.</TableCell>
                </TableRow>
              ) : (
                <UsersTable />
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
