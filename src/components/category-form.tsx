
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, setDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import type { Category } from "@/lib/types";
import { Loader2 } from "lucide-react";

const categorySchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
});

interface CategoryFormProps {
  category?: Category;
}

export default function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: category || {
      name: "",
      description: "",
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = (values: z.infer<typeof categorySchema>) => {
    if (!firestore) return;
    
    if (category) {
      // Update existing category
      const docRef = doc(firestore, "categories", category.id);
      setDocumentNonBlocking(docRef, values);
      toast({
        title: "Categoría Actualizada",
        description: "La categoría ha sido actualizada exitosamente.",
      });
      router.push("/admin/categories");
    } else {
      // Create new category
      const collectionRef = collection(firestore, "categories");
      addDocumentNonBlocking(collectionRef, values);
      toast({
        title: "Categoría Creada",
        description: "La nueva categoría ha sido añadida.",
      });
      router.push("/admin/categories");
    }
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
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre de la categoría" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Una breve descripción de la categoría..." {...field} />
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
                {category ? "Guardar Cambios" : "Crear Categoría"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
