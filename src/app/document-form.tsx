"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, setDocumentNonBlocking, addDocumentNonBlocking, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import type { Document as DocumentType, Category, Tag } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

const documentSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres."),
  author: z.string().min(3, "El autor debe tener al menos 3 caracteres."),
  year: z.coerce.number().min(1900, "El año debe ser válido.").max(new Date().getFullYear(), "El año no puede ser en el futuro."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  fileUrl: z.string().url("Debe ser una URL válida."),
  categoryId: z.string({ required_error: "Debes seleccionar una categoría." }),
  thumbnailUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
  subject: z.string().optional(),
  version: z.string().optional(),
});

interface DocumentFormProps {
  document?: DocumentType;
}

function DocumentFormComponent({ document }: DocumentFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const categoryIdFromParams = searchParams.get('categoryId');
  const folderIdFromParams = searchParams.get('folderId');

  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'categories') : null, [firestore]);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery);

  const form = useForm<z.infer<typeof documentSchema>>({
    resolver: zodResolver(documentSchema),
    defaultValues: document ? {
        ...document,
        year: document.year || new Date().getFullYear(),
    } : {
      title: "",
      author: "",
      year: new Date().getFullYear(),
      description: "",
      fileUrl: "",
      categoryId: categoryIdFromParams || undefined,
      thumbnailUrl: "",
      subject: "",
      version: "1.0",
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = (values: z.infer<typeof documentSchema>) => {
    if (!firestore || !user) return;
    
    const data: Omit<DocumentType, 'id'> = {
        ...values,
        folderId: folderIdFromParams || null,
        lastUpdated: new Date().toISOString(),
        createdBy: document?.createdBy || user.uid,
    };

    if (document) {
      // Update existing document
      const docRef = doc(firestore, "documents", document.id);
      setDocumentNonBlocking(docRef, data);
      toast({
        title: "Documento Actualizado",
        description: "El documento ha sido actualizado exitosamente.",
      });
       if (folderIdFromParams) {
        router.push(`/folders/${folderIdFromParams}`);
      } else if (data.categoryId) {
        router.push(`/category/${data.categoryId}`);
      } else {
        router.push('/my-documents');
      }
    } else {
      // Create new document
      const collectionRef = collection(firestore, "documents");
      addDocumentNonBlocking(collectionRef, data);
      toast({
        title: "Documento Creado",
        description: "El nuevo documento ha sido añadido a la biblioteca.",
      });
       if (folderIdFromParams) {
        router.push(`/folders/${folderIdFromParams}`);
      } else if (categoryIdFromParams) {
        router.push(`/category/${categoryIdFromParams}`);
      } else {
        router.push('/my-documents');
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Título del documento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Autor</FormLabel>
                  <FormControl>
                    <Input placeholder="Autor del documento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Año de Publicación</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Una breve descripción del contenido del documento..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingCategories || !!categoryIdFromParams}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Materia</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Fisiología" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="fileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL del Archivo (PDF)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://ejemplo.com/archivo.pdf" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de la Portada (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://ejemplo.com/portada.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Versión</FormLabel>
                  <FormControl>
                    <Input placeholder="1.0" {...field} />
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
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {document ? "Guardar Cambios" : "Crear Documento"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

export default function DocumentForm({ document }: DocumentFormProps) {
    return (
        <Suspense fallback={<div>Cargando formulario...</div>}>
            <DocumentFormComponent document={document} />
        </Suspense>
    );
}

    
