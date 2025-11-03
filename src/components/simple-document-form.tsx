"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, addDocumentNonBlocking, useMemoFirebase, useUser, useCollection } from "@/firebase";
import { collection } from "firebase/firestore";
import type { AuditLog, Category } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { Suspense, useState } from "react";
import { uploadFile } from "@/firebase/storage";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const simpleDocumentSchema = z.object({
  title: z.string().optional(),
  fileUrl: z.string().url("Debe proporcionar una URL o subir un archivo."),
  categoryId: z.string({ required_error: "Debes seleccionar una categoría." }).min(1, "Debes seleccionar una categoría."),
});

function SimpleDocumentFormComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const [uploadType, setUploadType] = useState<'url' | 'pdf'>('pdf');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  const categoryIdFromParams = searchParams.get('categoryId');
  const folderIdFromParams = searchParams.get('folderId');

  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'categories') : null, [firestore]);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery);

  const form = useForm<z.infer<typeof simpleDocumentSchema>>({
    resolver: zodResolver(simpleDocumentSchema),
    defaultValues: {
      title: "",
      fileUrl: "",
      categoryId: categoryIdFromParams || "",
    },
  });

  const { formState: { isSubmitting }, setValue, trigger } = form;

  const logAction = (action: 'create', entityId: string, entityName: string, details: string) => {
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
      const targetCategoryId = categoryIdFromParams || docData.categoryId;
      if (targetFolderId) {
        router.push(`/folders/${targetFolderId}`);
      } else if (targetCategoryId) {
        router.push(`/category/${targetCategoryId}`);
      } else {
        router.push('/my-documents');
      }
      router.refresh();
  }

  const onSubmit = async (values: z.infer<typeof simpleDocumentSchema>) => {
    if (!firestore || !user) {
        toast({ variant: "destructive", title: "Error de autenticación", description: "Debes iniciar sesión." });
        return;
    }

    let finalFileUrl = values.fileUrl;
    let finalTitle = values.title;

    if (uploadType === 'pdf' && fileToUpload) {
        if (!finalTitle) {
            finalTitle = fileToUpload.name.replace(/\.[^/.]+$/, ""); // Remove file extension
        }
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
    } else if (!finalTitle) {
        finalTitle = "Documento sin título";
    }
    
    const isValid = await trigger('fileUrl');
    if (!isValid) return;

    const dataToSave = {
        title: finalTitle,
        author: user.displayName || "Desconocido",
        year: new Date().getFullYear(),
        description: "Documento subido a través del formato simple.",
        fileUrl: finalFileUrl,
        categoryId: values.categoryId,
        folderId: folderIdFromParams || null,
        lastUpdated: new Date().toISOString(),
        createdBy: user.uid,
        thumbnailUrl: "",
        subject: "",
        version: "1.0",
    };

    const collectionRef = collection(firestore, "documents");
    const newDocRef = await addDocumentNonBlocking(collectionRef, dataToSave);
    if(newDocRef) {
        logAction('create', newDocRef.id, dataToSave.title, `Se creó el nuevo documento '${dataToSave.title}'.`);
    }
    toast({ title: "Documento Creado", description: "El nuevo documento ha sido añadido a la biblioteca." });

    handleRedirect(dataToSave);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      setFileToUpload(file);
      if (file) {
          setValue('fileUrl', `http://fakepath.com/${file.name}`); // Dummy value for validation
      } else {
          setValue('fileUrl', '');
      }
  };

  const isFormDisabled = isSubmitting || uploadProgress !== null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="max-w-2xl mx-auto">
           <CardHeader>
              <CardTitle>Formulario Simple</CardTitle>
              <CardDescription>Sube un documento rápidamente. El título es opcional.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Si lo dejas en blanco, se usará el nombre del archivo" {...field} disabled={isFormDisabled} />
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
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingCategories || !!categoryIdFromParams || isFormDisabled}>
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

            <div>
                <div className="flex border-b mb-4">
                    <button type="button" onClick={() => setUploadType('pdf')} className={cn("px-4 py-2 text-sm font-medium", uploadType === 'pdf' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground')}>Subir Archivo PDF</button>
                    <button type="button" onClick={() => setUploadType('url')} className={cn("px-4 py-2 text-sm font-medium", uploadType === 'url' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground')}>Usar URL</button>
                </div>

                <div className={cn(uploadType === 'pdf' ? 'block' : 'hidden')}>
                     <FormField control={form.control} name="fileUrl" render={() => (
                        <FormItem>
                        <FormLabel>Archivo PDF</FormLabel>
                        <FormControl>
                            <Input type="file" accept=".pdf" onChange={handleFileChange} disabled={isFormDisabled} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                </div>
                 <div className={cn(uploadType === 'url' ? 'block' : 'hidden')}>
                    <FormField control={form.control} name="fileUrl" render={({ field }) => (
                        <FormItem>
                        <FormLabel>URL del Archivo (PDF)</FormLabel>
                        <FormControl>
                            <Input placeholder="https://ejemplo.com/archivo.pdf" {...field} disabled={isFormDisabled} value={field.value || ''} />
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
            
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => router.back()} disabled={isFormDisabled}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isFormDisabled}>
                {isFormDisabled ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Crear Documento
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

export default function SimpleDocumentForm() {
    return (
        <Suspense fallback={<div>Cargando formulario...</div>}>
            <SimpleDocumentFormComponent />
        </Suspense>
    );
}
