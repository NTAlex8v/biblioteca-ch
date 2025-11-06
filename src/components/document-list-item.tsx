"use client";

import Link from 'next/link';
import { FileText, MoreHorizontal, Edit, Trash2, Calendar, User, ArrowRightLeft } from 'lucide-react';
import type { Document, AuditLog } from '@/lib/types';
import { useUser, useFirestore, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { doc, collection } from 'firebase/firestore';
import { useState } from 'react';
import MoveDocumentDialog from './move-document-dialog';


interface DocumentListItemProps {
  document: Document;
}

const DocumentListItem = ({ document }: DocumentListItemProps) => {
  const firestore = useFirestore();
  const { user, userData } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

  const isOwner = user && document.createdBy === user.uid;
  const canManage = isOwner || userData?.role === 'Admin' || userData?.role === 'Editor';
  
  const logAction = (action: 'create' | 'update' | 'delete', entityId: string, entityName: string, details: string) => {
    if (!firestore || !user) return;
    const log: Omit<AuditLog, 'id'> = {
        timestamp: new Date().toISOString(),
        userId: user.uid,
        userName: user.displayName || user.email || "Sistema",
        action: action,
        entityType: 'Document',
        entityId,
        entityName,
        details,
    };
    addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'auditLogs'), log);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleEdit = (e: React.MouseEvent) => {
    handleActionClick(e);
    window.location.href = `/my-documents/edit/${document.id}`;
  };

  const handleDelete = (e: React.MouseEvent) => {
    handleActionClick(e);
    if (!firestore) return;
    const docRef = doc(firestore, 'documents', document.id);
    deleteDocumentNonBlocking(docRef);
    logAction('delete', document.id, document.title, `Se eliminó el documento '${document.title}'.`);
    toast({
      variant: "destructive",
      title: 'Documento eliminado',
      description: 'El documento ha sido eliminado permanentemente.',
    });
  };

  const handleMove = (e: React.MouseEvent) => {
    handleActionClick(e);
    setIsMoveDialogOpen(true);
  };
  
  const formattedDate = document.lastUpdated ? format(new Date(document.lastUpdated), "d MMM yyyy", { locale: es }) : '';

  return (
    <>
      <div className="relative">
        <Link href={`/documents/${document.id}`} className="block p-4 rounded-lg border bg-card text-card-foreground transition-colors hover:bg-muted/50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <FileText className="h-6 w-6 flex-shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" title={document.title}>{document.title}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                  <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3" />
                      <span>{document.author}</span>
                  </div>
                   {formattedDate && (
                      <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          <span>{formattedDate}</span>
                      </div>
                  )}
                </div>
              </div>
            </div>
            {canManage && (
              <div className="flex-shrink-0" onClick={handleActionClick}>
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleMove}>
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        Mover
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el documento.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </Link>
      </div>
       {isMoveDialogOpen && (
          <MoveDocumentDialog 
            document={document} 
            isOpen={isMoveDialogOpen} 
            onOpenChange={setIsMoveDialogOpen} 
          />
        )}
    </>
  );
};

export default DocumentListItem;
