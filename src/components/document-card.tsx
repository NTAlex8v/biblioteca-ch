import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Document, Tag } from '@/lib/types';
import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser, deleteDocumentNonBlocking, FirestorePermissionError, errorEmitter } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
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
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const isOwner = user && document.createdBy === user.uid;

  const tagsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'tags');
  }, [firestore]);

  const { data: allTags } = useCollection<Tag>(tagsQuery);

  const documentTags = useMemo(() => {
    if (!document?.tagIds || !allTags) return [];
    return allTags.filter(tag => document.tagIds?.includes(tag.id));
  }, [document, allTags]);

  const randomImage = PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)];
  const thumbnailUrl = document.thumbnailUrl || randomImage.imageUrl;

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/my-documents/edit/${document.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!firestore) return;
    const docRef = doc(firestore, 'documents', document.id);
    deleteDoc(docRef)
      .then(() => {
        toast({
          variant: "destructive",
          title: 'Documento eliminado',
          description: 'El documento ha sido eliminado permanentemente.',
        });
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary group">
        <CardHeader className="p-0 relative">
            <Link href={`/documents/${document.id}`} className="absolute inset-0 z-0" />
            {isOwner && (
                <div className="absolute top-2 right-2 z-10">
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
            <div className="relative aspect-[2/3] w-full">
            <Image
              src={thumbnailUrl}
              alt={`Cover of ${document.title}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint="book cover"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow relative">
          <Link href={`/documents/${document.id}`} className="absolute inset-0 z-0" />
          <CardTitle className="text-base font-semibold leading-tight mb-1 line-clamp-2">
            {document.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground line-clamp-1">{document.author}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0 relative">
           <Link href={`/documents/${document.id}`} className="absolute inset-0 z-0" />
           <div className="flex flex-wrap gap-1">
            {documentTags.slice(0, 2).map(tag => (
              <Badge key={tag.id} variant="secondary" className="text-xs">{tag.name}</Badge>
            ))}
          </div>
        </CardFooter>
      </Card>
  );
};

export default DocumentCard;
