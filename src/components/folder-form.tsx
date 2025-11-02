"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, addDocumentNonBlocking, useUser } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Folder, AuditLog } from "@/lib/types";
import { Loader2 } from "lucide-react";

const folderSchema = z.object({
  name: z.string().min(3, "El nombre de la carpeta debe tener al menos 3 caracteres."),
});

export default function FolderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const categoryId = searchParams.get('categoryId');
  const parentFolderId = searchParams.get('parentFolderId');

  const form = useForm<z.infer<typeof folderSchema>>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: "",
    },
  });

  const { formState: { isSubmitting } } = form;

  const logAction = (action: 'create' | 'update' | 'delete', entityId: string, entityName: string, details: string) => {
    if (!firestore || !user) return;
    const log: Omit<AuditLog, 'id'> = {
        timestamp: new Date().toISOString(),
        userId: user.uid,
        userName: user.displayName || user.email || "Sistema",
        action: action,
        entityType: 'Folder',
        entityId,
        entityName,
        details,
    };
    addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'auditLogs'), log);
  };

  const onSubmit = async (values: z.infer<typeof folderSchema>) => {
    if (!firestore || !user || !categoryId) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo crear la carpeta. Falta información esencial.",
        });
        return;
    }
    
    const folderData: Omit<Folder, 'id'> = {
        name: values.name,
        categoryId: categoryId,
        parentFolderId: parentFolderId || null,
        createdBy: user.uid,
    };

    const collectionRef = collection(firestore, "folders");
    const newDocRef = await addDocumentNonBlocking(collectionRef, folderData);
    if(newDocRef) {
        logAction('create', newDocRef.id, values.name, `Se creó la nueva carpeta '${values.name}'.`);
    }
    toast({
      title: "Carpeta Creada",
      description: "La nueva carpeta ha sido añadida.",
    });

    if (parentFolderId) {
        router.push(`/folders/${parentFolderId}`);
    } else {
        router.push(`/category/${categoryId}`);
    }
    router.refresh();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="grid grid-cols-1 gap-6 pt-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Carpeta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Apuntes de Clase" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => router.back()} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !categoryId}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Crear Carpeta
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
