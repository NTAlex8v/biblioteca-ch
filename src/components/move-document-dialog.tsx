'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, useUser } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Document as DocumentType, Category, Folder, AuditLog } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MoveDocumentDialogProps {
  document: DocumentType;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function MoveDocumentDialog({ document, isOpen, onOpenChange }: MoveDocumentDialogProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [targetCategoryId, setTargetCategoryId] = useState<string>(document.categoryId);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(document.folderId || 'root');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all categories
  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'categories') : null, [firestore]);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery);

  // Fetch folders for the selected category
  const foldersQuery = useMemoFirebase(() => {
    if (!firestore || !targetCategoryId) return null;
    return query(collection(firestore, 'folders'), where('categoryId', '==', targetCategoryId));
  }, [firestore, targetCategoryId]);
  const { data: folders, isLoading: isLoadingFolders } = useCollection<Folder>(foldersQuery);
  
  // Reset folder selection when category changes
  useEffect(() => {
    setTargetFolderId('root');
  }, [targetCategoryId]);

  const logAction = (action: 'update', entityId: string, entityName: string, details: string) => {
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

  const handleMove = async () => {
    if (!firestore) return;
    setIsSubmitting(true);

    const docRef = doc(firestore, 'documents', document.id);
    const newLocation = {
      categoryId: targetCategoryId,
      folderId: targetFolderId === 'root' ? null : targetFolderId,
      lastUpdated: new Date().toISOString(),
    };

    try {
      await updateDocumentNonBlocking(docRef, newLocation);
      const categoryName = categories?.find(c => c.id === targetCategoryId)?.name || '';
      const folderName = folders?.find(f => f.id === targetFolderId)?.name || 'la raíz de la categoría';
      
      logAction('update', document.id, document.title, `Documento movido a: ${categoryName} / ${folderName}`);

      toast({
        title: 'Documento Movido',
        description: `El documento "${document.title}" se ha movido correctamente.`,
      });
      onOpenChange(false);
      router.refresh(); 
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al mover',
        description: 'No se pudo mover el documento.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isLoading = isLoadingCategories || isLoadingFolders;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mover Documento</DialogTitle>
          <DialogDescription>
            Selecciona la nueva ubicación para el documento "{document.title}".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="category-select">Categoría de Destino</Label>
            <Select
              value={targetCategoryId}
              onValueChange={setTargetCategoryId}
              disabled={isLoadingCategories}
            >
              <SelectTrigger id="category-select">
                <SelectValue placeholder="Selecciona una categoría..." />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="folder-select">Carpeta de Destino</Label>
            <Select
              value={targetFolderId || 'root'}
              onValueChange={setTargetFolderId}
              disabled={isLoadingFolders || !targetCategoryId}
            >
              <SelectTrigger id="folder-select">
                <SelectValue placeholder="Selecciona una carpeta..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Raíz de la categoría (sin carpeta)</SelectItem>
                {folders?.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleMove} disabled={isSubmitting || isLoading}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mover Documento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
