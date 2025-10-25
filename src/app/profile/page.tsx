"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, useAuth } from "@/firebase";
import { doc } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import type { User as AppUser } from "@/lib/types";
import React from "react";
import { updateProfile } from "firebase/auth";
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

const profileSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío."),
  email: z.string().email(),
  avatarUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
});

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [newAvatarUrl, setNewAvatarUrl] = React.useState('');
  const [isAvatarSubmitting, setIsAvatarSubmitting] = React.useState(false);


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
        avatarUrl: userData?.avatarUrl || '',
    },
    defaultValues: {
      name: "",
      email: "",
      avatarUrl: "",
    },
  });

  const { handleSubmit, control, formState: { isSubmitting } } = form;

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    if (!userDocRef) return;
    
    const dataToUpdate = { name: values.name };

    updateDocumentNonBlocking(userDocRef, dataToUpdate);
    if(auth?.currentUser && values.name) {
      updateProfile(auth.currentUser, { displayName: values.name });
    }

    toast({
        title: "Perfil Actualizado",
        description: "Tu información ha sido guardada.",
    });
  };

  const handleAvatarChange = async () => {
    if (!user || !userDocRef || !newAvatarUrl) return;
    setIsAvatarSubmitting(true);

    try {
        // Update auth profile
        if (auth?.currentUser) {
            await updateProfile(auth.currentUser, { photoURL: newAvatarUrl });
        }
        // Update firestore document
        updateDocumentNonBlocking(userDocRef, { avatarUrl: newAvatarUrl });
        
        toast({
            title: "Foto de perfil actualizada",
            description: "Tu nueva foto de perfil ha sido guardada."
        });
        
    } catch (error) {
        console.error("Error updating avatar:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo actualizar la foto de perfil."
        });
    } finally {
        setIsAvatarSubmitting(false);
    }
  };

  if (isUserLoading || isUserDataLoading) {
    return <div className="container mx-auto max-w-2xl"><p>Cargando perfil...</p></div>;
  }

  if (!user || !userData) {
    return <div className="container mx-auto max-w-2xl"><p>No se encontró el usuario.</p></div>;
  }

  const effectiveAvatarUrl = user.photoURL || userData.avatarUrl;


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
                      <AvatarImage src={effectiveAvatarUrl} alt={userData.name} />
                      <AvatarFallback>{userData.name?.charAt(0) || userData.email?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="outline" type="button">Cambiar Foto</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Cambiar foto de perfil</AlertDialogTitle>
                              <AlertDialogDescription>
                                  Pega la URL de una imagen para usarla como tu nueva foto de perfil.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="grid gap-3">
                              <Label htmlFor="avatar-url">URL de la imagen</Label>
                              <Input 
                                  id="avatar-url" 
                                  type="url" 
                                  placeholder="https://ejemplo.com/imagen.jpg" 
                                  value={newAvatarUrl}
                                  onChange={(e) => setNewAvatarUrl(e.target.value)}
                              />
                          </div>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={handleAvatarChange} disabled={!newAvatarUrl || isAvatarSubmitting}>
                                {isAvatarSubmitting ? "Guardando..." : "Guardar Foto"}
                              </AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
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
