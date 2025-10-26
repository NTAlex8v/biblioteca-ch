
'use client';

import Link from "next/link";
import { Book } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, UserCredential } from "firebase/auth";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";


const loginSchema = z.object({
  email: z.string().email({ message: "Por favor, ingresa un correo válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <title>Google</title>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.36 1.95-4.25 1.95-5.12 0-9.25-4.13-9.25-9.25s4.13-9.25 9.25-9.25c2.66 0 4.61.98 6.08 2.33l-2.73 2.73c-.75-.74-1.76-1.25-2.95-1.25-3.27 0-6.03 2.73-6.03 6.03s2.76 6.03 6.03 6.03c3.42 0 5.62-2.36 5.86-5.03H12.48z" />
    </svg>
);


export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // A simplified success handler that ONLY handles UI feedback and redirection.
  // NO DATABASE WRITES ON LOGIN.
  const handleSignInSuccess = (userCred: UserCredential) => {
    toast({
        title: "Inicio de sesión exitoso",
        description: "¡Bienvenido de vuelta!",
    });
    router.push('/');
  };

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    if (!auth) return;
    setIsSubmitting(true);
    signInWithEmailAndPassword(auth, values.email, values.password)
        .then(handleSignInSuccess)
        .catch(error => {
            console.error("Login Error:", error);
            toast({
                variant: "destructive",
                title: "Error de inicio de sesión",
                description: "Las credenciales son incorrectas o el usuario no existe.",
            });
        })
        .finally(() => setIsSubmitting(false));
  };
  
  const handleGoogleSignIn = () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    setIsSubmitting(true);
    
    signInWithPopup(auth, provider)
      .then(handleSignInSuccess) 
      .catch((error) => {
        let description = "No se pudo iniciar sesión con Google.";
        if (error.code === 'auth/popup-closed-by-user') {
            description = "La ventana de inicio de sesión fue cerrada. Inténtalo de nuevo.";
        } else if (error.code === 'auth/cancelled-popup-request') {
            description = "Se canceló la solicitud de inicio de sesión. Por favor, no tengas dos ventanas de inicio de sesión abiertas.";
        }
        console.error("Google Sign-In Error:", error);
        toast({
          variant: "destructive",
          title: "Error con Google",
          description: description,
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
             <Link href="/" className="flex items-center gap-2 font-semibold">
                <Book className="h-8 w-8 text-primary" />
             </Link>
          </div>
          <CardTitle className="text-2xl">Bienvenido de vuelta</CardTitle>
          <CardDescription>
            Ingresa tu correo para acceder a la biblioteca.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
               <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input placeholder="m@ejemplo.com" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                     <div className="flex items-center">
                       <FormLabel>Contraseña</FormLabel>
                       <Link
                         href="#"
                         className="ml-auto inline-block text-sm underline"
                       >
                         ¿Olvidaste tu contraseña?
                       </Link>
                     </div>
                    <FormControl>
                      <Input type="password" {...field} disabled={isSubmitting}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Iniciando...' : 'Iniciar Sesión'}
              </Button>
              <Button variant="outline" className="w-full" type="button" onClick={handleGoogleSignIn} disabled={isSubmitting}>
                <GoogleIcon className="mr-2 h-4 w-4" />
                Iniciar Sesión con Google
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            ¿No tienes una cuenta?{" "}
            <Link href="/signup" className="underline">
              Regístrate
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
