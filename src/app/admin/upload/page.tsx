import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { mockCategories } from "@/lib/data";

export default function UploadPage() {
  return (
    <div className="container mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Subir Nuevo Material</h1>
        <p className="text-muted-foreground">Completa los metadatos y sube el archivo del documento.</p>
      </div>
      
      <form className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Carga de Archivo</CardTitle>
            <CardDescription>Sube un PDF o impórtalo desde una carpeta de Google Drive.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="pdf-file">Subir PDF</Label>
              <Input id="pdf-file" type="file" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gdrive-link">Link de Google Drive</Label>
              <Input id="gdrive-link" placeholder="https://drive.google.com/..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadatos del Documento</CardTitle>
            <CardDescription>Esta información es crucial para la búsqueda y organización.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="title">Título</Label>
              <Input id="title" type="text" placeholder="Principios de Anatomía..." />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="author">Autor(es)</Label>
              <Input id="author" type="text" placeholder="Gerard J. Tortora" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="grid gap-3">
                    <Label htmlFor="year">Año de Publicación</Label>
                    <Input id="year" type="number" placeholder="2021" />
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="category">Categoría</Label>
                    <Select>
                        <SelectTrigger id="category">
                        <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                        {mockCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="subject">Materia</Label>
              <Input id="subject" type="text" placeholder="Anatomía, Fisiología" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" placeholder="Una breve descripción del contenido del documento." />
            </div>
             <div className="grid gap-3">
              <Label htmlFor="tags">Etiquetas (separadas por comas)</Label>
              <Input id="tags" type="text" placeholder="anatomía, fisiología, cuerpo humano" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
            <Button variant="outline">Cancelar</Button>
            <Button type="submit">Guardar Documento</Button>
        </div>
      </form>
    </div>
  );
}
