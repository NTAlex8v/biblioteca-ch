
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { MoreHorizontal } from "lucide-react";
import type { User } from "@/lib/types";

interface AdminUsersPageProps {
  user: User; // El usuario admin/editor logueado
}

export default function AdminUsersPage({ user }: AdminUsersPageProps) {
  const firestore = useFirestore();
  
  const usersQuery = useMemoFirebase(() => {
    // Consulta segura: solo se crea si el usuario que ha iniciado sesión es Admin.
    if (!firestore || user.role !== 'Admin') {
      return null;
    }
    return collection(firestore, 'users');
  }, [firestore, user]);

  const { data: users, isLoading } = useCollection<User>(usersQuery);

  // Si el usuario logueado no es un admin, muestra un mensaje en lugar de una tabla vacía.
  // Esta comprobación es ahora principalmente ilustrativa, ya que el layout maneja la denegación estricta.
  if (user.role !== 'Admin') {
    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
            <p className="text-muted-foreground mt-4">Solo los administradores pueden ver esta sección.</p>
        </div>
    );
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Cargando usuarios...</TableCell>
                </TableRow>
              ) : (
                users?.map((user) => (
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
