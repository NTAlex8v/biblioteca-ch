import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Mock user data - in a real app, this would come from an auth context
const loggedInUser = {
  name: "Ana García",
  email: "admin@cayetano.edu",
  avatar: "https://i.pravatar.cc/150?u=admin@cayetano.edu",
  role: "Admin",
};

export default function ProfilePage() {
  return (
    <div className="container mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">Consulta y actualiza tu información personal.</p>
      </div>

      <form className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>Estos datos se mostrarán en tu perfil.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={loggedInUser.avatar} alt={loggedInUser.name} />
                    <AvatarFallback>{loggedInUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <Button variant="outline">Cambiar Foto</Button>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input id="name" type="text" defaultValue={loggedInUser.name} />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" type="email" defaultValue={loggedInUser.email} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cambiar Contraseña</CardTitle>
            <CardDescription>Deja los campos en blanco si no deseas cambiarla.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="current-password">Contraseña Actual</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="new-password">Nueva Contraseña</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
              <Input id="confirm-password" type="password" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
            <Button type="submit">Guardar Cambios</Button>
        </div>
      </form>
    </div>
  );
}
