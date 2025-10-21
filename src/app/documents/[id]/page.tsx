import Image from 'next/image';
import { notFound } from 'next/navigation';
import { mockDocuments } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, Eye } from 'lucide-react';
import Link from 'next/link';

export default function DocumentPage({ params }: { params: { id: string } }) {
  const document = mockDocuments.find((doc) => doc.id === params.id);

  if (!document) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-5xl">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card className="overflow-hidden sticky top-24">
            <div className="relative aspect-[2/3] w-full">
              <Image
                src={document.thumbnailUrl}
                alt={`Cover of ${document.title}`}
                fill
                className="object-cover"
                data-ai-hint="book cover"
              />
            </div>
          </Card>
        </div>

        <div className="md:col-span-2">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">{document.title}</h1>
          <p className="text-xl text-muted-foreground mb-4">{document.author}</p>
          <div className="flex items-center gap-4 mb-6">
            <Badge variant="default">{document.category}</Badge>
            <span className="text-sm text-muted-foreground">Año: {document.year}</span>
          </div>

          <p className="text-base leading-relaxed mb-8">{document.description}</p>

          <div className="flex flex-wrap gap-2 mb-8">
            {document.tags.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Información del Documento</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="font-medium">Materia</p>
                        <p className="text-muted-foreground">{document.subject}</p>
                    </div>
                    <div>
                        <p className="font-medium">Versión</p>
                        <p className="text-muted-foreground">{document.version}</p>
                    </div>
                    <div>
                        <p className="font-medium">Última Actualización</p>
                        <p className="text-muted-foreground">{new Date(document.lastUpdated).toLocaleDateString()}</p>
                    </div>
                </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="flex-1">
              <Eye className="mr-2" /> Ver PDF Embebido
            </Button>
            <Button size="lg" variant="secondary" className="flex-1" asChild>
              <Link href={document.fileUrl} download>
                <Download className="mr-2" /> Descargar Archivo
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
