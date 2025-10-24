
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Eye } from 'lucide-react';
import Link from 'next/link';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server-initialization';
import type { Document, Category, Tag } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// Initialize firebase admin on server
const { firestore } = initializeFirebase();

async function getDocumentData(id: string): Promise<{ document: Document; categoryName: string; documentTags: Tag[] } | null> {
    const docRef = doc(firestore, 'documents', id);
    const categoriesCollection = collection(firestore, 'categories');
    const tagsCollection = collection(firestore, 'tags');

    const [docSnap, categoriesSnap, tagsSnap] = await Promise.all([
        getDoc(docRef),
        getDocs(categoriesCollection),
        getDocs(tagsCollection),
    ]);

    if (!docSnap.exists()) {
        return null;
    }

    const document = { id: docSnap.id, ...docSnap.data() } as Document;

    const categoryMap = new Map(categoriesSnap.docs.map(doc => [doc.id, doc.data().name]));
    const categoryName = categoryMap.get(document.categoryId) || 'Sin categoría';
    
    const allTags = tagsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tag[];
    const documentTags = document.tagIds ? allTags.filter(tag => document.tagIds.includes(tag.id)) : [];

    return { document, categoryName, documentTags };
}

export default async function DocumentPage({ params }: { params: { id: string } }) {
  
  const data = await getDocumentData(params.id);

  if (!data) {
    notFound();
  }

  const { document, categoryName, documentTags } = data;

  // Find a placeholder image. Fallback to a default one.
  const randomImage = PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)];
  const thumbnailUrl = document?.thumbnailUrl || randomImage.imageUrl;

  return (
    <>
      <div className="container mx-auto max-w-5xl">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card className="overflow-hidden sticky top-24">
              <div className="relative aspect-[2/3] w-full">
                <Image
                  src={thumbnailUrl}
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
              <Badge variant="default">{categoryName}</Badge>
              <span className="text-sm text-muted-foreground">Año: {document.year}</span>
            </div>

            <p className="text-base leading-relaxed mb-8">{document.description}</p>

            <div className="flex flex-wrap gap-2 mb-8">
              {documentTags.map((tag) => (
                <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
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
                          <p className="text-muted-foreground">{document.subject || 'N/A'}</p>
                      </div>
                      <div>
                          <p className="font-medium">Versión</p>
                          <p className="text-muted-foreground">{document.version || '1.0'}</p>
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
    </>
  );
}
