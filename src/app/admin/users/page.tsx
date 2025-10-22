
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { MoreHorizontal } from "lucide-react";
import type { User as AppUser } from "@/lib/types";

// --- Main component to display users ---
export default function AdminUsersPage() {
    const firestore = useFirestore();
    const { user } = useUser();

    // The AdminLayout has already confirmed the user is an Admin.
    // We can safely query the users collection.
    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'users');
    }, [firestore]);

    const { data: userList, isLoading } = useCollection<AppUser>(usersQuery);

    const currentUserDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, "users", user.uid);
    }, [firestore, user]);

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
                            ) : userList && userList.length > 0 ? (
                                userList.map((userItem) => (
                                    <TableRow key={userItem.id}>
                                        <TableCell className="font-medium">{userItem.name || 'N/A'}</TableCell>
                                        <TableCell className="hidden sm:table-cell">{userItem.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={userItem.role === 'Admin' ? 'default' : 'secondary'}>
                                                {userItem.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
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
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">No se encontraron usuarios o acceso denegado.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
