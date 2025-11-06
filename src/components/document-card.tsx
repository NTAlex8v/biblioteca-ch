import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Document, Tag, AuditLog } from '@/lib/types';
import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
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

interface DocumentCardProps {
  document: Document;
}

const DocumentCard = ({ document }: DocumentCardProps) => {
  const firestore = useFirestore();
  const { user, userData } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const isOwner = user && document.createdBy === user.uid;
  const canManage = isOwner || userData?.role === 'Admin' || userData?.role === 'Editor';

  const tagsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'tags');
  }, [firestore]);

  const { data: allTags } = useCollection<Tag>(tagsQuery);

  const documentTags = useMemo(() => {
    if (!document?.tagIds || !allTags) return [];
    return allTags.filter(tag => document.tagIds?.includes(tag.id));
  }, [document, allTags]);

  const thumbnailUrl = document.thumbnailUrl;

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
    router.push(`/my-documents/edit/${document.id}`);
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

  return (
    <Link href={`/documents/${document.id}`} className="block h-full group">
        <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:border-primary">
            {thumbnailUrl && (
                <CardHeader className="p-0 relative">
                    {canManage && (
                        <div className="absolute top-2 right-2 z-10" onClick={handleActionClick}>
                            <AlertDialog>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="secondary" size="icon" className="h-8 w-8">
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
                    <div className="relative aspect-[3/4] w-full">
                    <Image
                      src={thumbnailUrl}
                      alt={`Cover of ${document.title}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint="book cover"
                    />
                  </div>
                </CardHeader>
            )}
            <CardContent className="p-4 flex-grow">
              <CardTitle className="text-base font-semibold leading-tight mb-1 line-clamp-2">
                {document.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground line-clamp-1">{document.author}</p>
            </CardContent>
            <CardFooter className="p-4 pt-0">
               <div className="flex flex-wrap gap-1">
                {documentTags.slice(0, 2).map(tag => (
                  <Badge key={tag.id} variant="secondary" className="text-xs">{tag.name}</Badge>
                ))}
              </div>
            </CardFooter>
          </Card>
    </Link>
  );
};

export default DocumentCard;
