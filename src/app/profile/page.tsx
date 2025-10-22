"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import type { User as AppUser } from "@/lib/types";

const profileSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío."),
  email: z.string().email(),
});

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc<AppUser>(userDocRef);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: { // Use values to keep form in sync with firebase data
        name: userData?.name || '',
        email: userData?.email || '',
    },
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const { handleSubmit, control, formState: { isSubmitting } } = form;

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    if (!userDocRef) return;
    
    const dataToUpdate = { name: values.name };

    updateDocumentNonBlocking(userDocRef, dataToUpdate);

    toast({
        title: "Perfil Actualizado",
        description: "Tu información ha sido guardada.",
    });
  };

  if (isUserLoading || isUserDataLoading) {
    return <div className="container mx-auto max-w-2xl"><p>Cargando perfil...</p></div>;
  }

  if (!user || !userData) {
    return <div className="container mx-auto max-w-2xl"><p>No se encontró el usuario.</p></div>;
  }

  return (
    <div className="container mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">Consulta y actualiza tu información personal.</p>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Estos datos se mostrarán en tu perfil.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                      <AvatarImage src={userData.avatarUrl} alt={userData.name} />
                      <AvatarFallback>{userData.name?.charAt(0) || userData.email?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Button variant="outline" type="button" disabled>Cambiar Foto (próximamente)</Button>
              </div>
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl>
                            <Input {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
              />
              <FormField
                control={control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Correo Electrónico</FormLabel>
                        <FormControl>
                            <Input {...field} disabled />
                        </FormControl>
                         <FormMessage />
                    </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>Esta funcionalidad estará disponible próximamente.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="current-password">Contraseña Actual</Label>
                <Input id="current-password" type="password" disabled />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="new-password">Nueva Contraseña</Label>
                <Input id="new-password" type="password" disabled />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
