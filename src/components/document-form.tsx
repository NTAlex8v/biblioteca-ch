
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, setDocumentNonBlocking, addDocumentNonBlocking, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import type { Document as DocumentType, Category, AuditLog } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { uploadFile } from "@/firebase/storage";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const documentSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres."),
  author: z.string().min(3, "El autor debe tener al menos 3 caracteres."),
  year: z.coerce.number().min(1900, "El año debe ser válido.").max(new Date().getFullYear() + 1, "El año no puede ser en el futuro."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  fileUrl: z.string().url("Debe proporcionar una URL o subir un archivo válido.").min(1, "Debe proporcionar una URL o subir un archivo."),
  categoryId: z.string({ required_error: "Debes seleccionar una categoría." }).min(1, "Debes seleccionar una categoría."),
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

  const [uploadType, setUploadType] = useState<'url' | 'pdf'>(document?.fileUrl?.startsWith('http') ? 'url' : 'pdf');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const categoryIdFromParams = searchParams.get('categoryId');
  const folderIdFromParams = searchParams.get('folderId');

  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'categories') : null, [firestore]);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery);

  const form = useForm<z.infer<typeof documentSchema>>({
    resolver: zodResolver(documentSchema),
    defaultValues: document 
      ? { ...document, year: document.year || new Date().getFullYear() } 
      : {
        title: "",
        author: "",
        year: new Date().getFullYear(),
        description: "",
        fileUrl: "",
        categoryId: categoryIdFromParams || "",
        thumbnailUrl: "",
        subject: "",
        version: "1.0",
      },
  });

  const { formState: { isSubmitting }, reset, setValue, trigger } = form;

  useEffect(() => {
    if (document) {
      reset({
        ...document,
        categoryId: document.categoryId || categoryIdFromParams || "",
      });
      if (document.fileUrl) {
        setUploadType(document.fileUrl.startsWith('http') ? 'url' : 'pdf');
      }
    } else {
        reset({
            title: "",
            author: "",
            year: new Date().getFullYear(),
            description: "",
            fileUrl: "",
            categoryId: categoryIdFromParams || "",
            thumbnailUrl: "",
            subject: "",
            version: "1.0",
        });
    }
  }, [document, categoryIdFromParams, reset]);

  const logAction = (action: 'create' | 'update', entityId: string, entityName: string, details: string) => {
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

  const handleRedirect = (docData: any) => {
      const targetFolderId = folderIdFromParams || docData.folderId;
      const targetCategoryId = docData.categoryId;
      if (targetFolderId) {
        router.push(`/folders/${targetFolderId}`);
      } else if (targetCategoryId) {
        router.push(`/category/${targetCategoryId}`);
      } else {
        router.push('/my-documents');
      }
      router.refresh();
  }

  const onSubmit = async (values: z.infer<typeof documentSchema>) => {
    if (!firestore || !user) {
        toast({ variant: "destructive", title: "Error de autenticación", description: "Debes iniciar sesión." });
        return;
    }

    let finalFileUrl = values.fileUrl;

    if (uploadType === 'pdf' && fileToUpload) {
        try {
            setUploadProgress(0);
            finalFileUrl = await uploadFile(fileToUpload, setUploadProgress, user.uid);
            setValue('fileUrl', finalFileUrl);
            setUploadProgress(null);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error al subir archivo", description: error.message });
            setUploadProgress(null);
            return;
        }
    }
    
    const isValid = await trigger('fileUrl');
    if (!isValid) return;

    const dataToSave = {
        ...values,
        fileUrl: finalFileUrl,
        folderId: folderIdFromParams || document?.folderId || null,
        lastUpdated: new Date().toISOString(),
        createdBy: document?.createdBy || user.uid,
    };

    if (document) {
      const docRef = doc(firestore, "documents", document.id);
      await setDocumentNonBlocking(docRef, dataToSave);
      logAction('update', document.id, values.title, `Se actualizó el documento '${values.title}'.`);
      toast({ title: "Documento Actualizado", description: "El documento ha sido actualizado exitosamente." });
    } else {
      const collectionRef = collection(firestore, "documents");
      const newDocRef = await addDocumentNonBlocking(collectionRef, dataToSave);
      if(newDocRef) {
          logAction('create', newDocRef.id, values.title, `Se creó el nuevo documento '${values.title}'.`);
      }
      toast({ title: "Documento Creado", description: "El nuevo documento ha sido añadido a la biblioteca." });
    }

    handleRedirect(dataToSave);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      setFileToUpload(file);
      if (file) {
          setValue('fileUrl', `https://placeholder.com/${file.name}`, { shouldValidate: true });
      } else {
          setValue('fileUrl', '', { shouldValidate: true });
      }
  };
  
  const handleUploadTypeChange = (type: 'url' | 'pdf') => {
    setUploadType(type);
    setValue('fileUrl', '');
    setFileToUpload(null);
    trigger('fileUrl');
  };


  const isFormDisabled = isSubmitting || uploadProgress !== null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
              <CardTitle>Formulario Completo</CardTitle>
              <CardDescription>Rellena todos los detalles para catalogar el documento de forma precisa.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Título del documento" {...field} disabled={isFormDisabled} value={field.value || ''} />
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
                    <Input placeholder="Autor del documento" {...field} disabled={isFormDisabled} value={field.value || ''} />
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
                    <Input type="number" placeholder="2024" {...field} disabled={isFormDisabled} value={field.value || ''} />
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
                    <Textarea placeholder="Una breve descripción del contenido del documento..." {...field} disabled={isFormDisabled} value={field.value || ''} />
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
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingCategories || !!document || !!categoryIdFromParams || isFormDisabled}>
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
                    <Input placeholder="Ej: Fisiología" {...field} disabled={isFormDisabled} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="md:col-span-2">
                <div className="flex border-b mb-4">
                    <button type="button" onClick={() => handleUploadTypeChange('url')} className={cn("px-4 py-2 text-sm font-medium", uploadType === 'url' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground')}>Usar URL</button>
                    <button type="button" onClick={() => handleUploadTypeChange('pdf')} className={cn("px-4 py-2 text-sm font-medium", uploadType === 'pdf' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground')}>Subir Archivo PDF</button>
                </div>

                <div className={cn(uploadType === 'url' ? 'block' : 'hidden')}>
                    <FormField control={form.control} name="fileUrl" render={({ field }) => (
                        <FormItem>
                        <FormLabel>URL del Archivo (PDF)</FormLabel>
                        <FormControl>
                            <Input placeholder="https://ejemplo.com/archivo.pdf" {...field} disabled={isFormDisabled || uploadType !== 'url'} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <div className={cn(uploadType === 'pdf' ? 'block' : 'hidden')}>
                    <FormField control={form.control} name="fileUrl" render={() => (
                        <FormItem>
                        <FormLabel>Archivo PDF</FormLabel>
                        <FormControl>
                            <Input type="file" accept=".pdf" onChange={handleFileChange} disabled={isFormDisabled || uploadType !== 'pdf'} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                </div>

                {uploadProgress !== null && (
                    <div className="mt-4">
                        <Progress value={uploadProgress} className="w-full" />
                        <p className="text-sm text-muted-foreground mt-2">Subiendo archivo... {Math.round(uploadProgress)}%</p>
                    </div>
                )}
            </div>
            
            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de la Portada (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://ejemplo.com/portada.jpg" {...field} disabled={isFormDisabled} value={field.value || ''} />
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
                    <Input placeholder="1.0" {...field} disabled={isFormDisabled} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => router.back()} disabled={isFormDisabled}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isFormDisabled}>
                {isFormDisabled ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
