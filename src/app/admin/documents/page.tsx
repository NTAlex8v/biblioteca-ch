
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Document, Category } from "@/lib/types";

interface AdminDocumentsPageProps {
  documents?: Document[];
  categories?: Category[];
}

export default function AdminDocumentsPage({ documents, categories }: AdminDocumentsPageProps) {
  const isLoading = documents === undefined || categories === undefined;

  const getCategoryName = (categoryId: string) => {
    if (!categories) return '...';
    return categories.find(c => c.id === categoryId)?.name || 'Sin categoría';
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Documentos</h1>
            <p className="text-muted-foreground">Edita y administra el material de la biblioteca.</p>
        </div>
        <Button asChild>
          <Link href="/admin/upload">
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Documento
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead className="hidden md:table-cell">Autor</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="hidden sm:table-cell">Año</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Cargando...</TableCell>
                </TableRow>
              ) : (
                documents?.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell className="hidden md:table-cell">{doc.author}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryName(doc.categoryId)}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{doc.year}</TableCell>
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
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
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
