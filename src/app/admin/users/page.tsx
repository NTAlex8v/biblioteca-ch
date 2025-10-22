
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { collection, doc, getDocs } from "firebase/firestore";
import { MoreHorizontal } from "lucide-react";
import type { User as AppUser } from "@/lib/types";
import React, { useState, useEffect } from 'react';
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

// --- Child component to fetch and display users ---
function UsersTable() {
    const firestore = useFirestore();
    const [userList, setUserList] = useState<AppUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            if (!firestore) return;
            setIsLoading(true);
            try {
                const usersCollectionRef = collection(firestore, 'users');
                const querySnapshot = await getDocs(usersCollectionRef);
                const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
                setUserList(users);
            } catch (error: any) {
                console.error("Error fetching users:", error);
                
                // Emit a contextual error for permission issues
                if (error.code === 'permission-denied') {
                    const contextualError = new FirestorePermissionError({
                        path: 'users',
                        operation: 'list',
                    });
                    errorEmitter.emit('permission-error', contextualError);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [firestore]);

    if (isLoading) {
        return (
            <TableRow>
                <TableCell colSpan={5} className="text-center">Cargando usuarios...</TableCell>
            </TableRow>
        );
    }

    if (userList.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">No se encontraron usuarios.</TableCell>
            </TableRow>
        )
    }

    return (
        <>
            {userList.map((user) => (
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
    )
}


// --- Main component to check permissions ---
export default function AdminUsersPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const currentUserDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc<AppUser>(currentUserDocRef);
  
  const isLoadingPermissions = isUserLoading || isCurrentUserDataLoading;

  const renderContent = () => {
    if (isLoadingPermissions) {
        return (
            <TableRow>
                <TableCell colSpan={5} className="text-center">Verificando permisos...</TableCell>
            </TableRow>
        );
    }

    if (currentUserData?.role !== 'Admin') {
       return (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground">
              Solo los administradores pueden ver esta sección.
            </TableCell>
          </TableRow>
        );
    }

    // If permissions are verified, render the component that fetches data
    return <UsersTable />;
  };

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
              {renderContent()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
