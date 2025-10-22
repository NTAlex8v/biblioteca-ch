import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Document, Tag } from '@/lib/types';
import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface DocumentCardProps {
  document: Document;
}

const DocumentCard = ({ document }: DocumentCardProps) => {
  const firestore = useFirestore();

  const tagsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'tags');
  }, [firestore]);

  const { data: allTags } = useCollection<Tag>(tagsQuery);

  const documentTags = useMemo(() => {
    if (!document?.tagIds || !allTags) return [];
    return allTags.filter(tag => document.tagIds?.includes(tag.id));
  }, [document, allTags]);

  const randomImage = PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)];
  const thumbnailUrl = document.thumbnailUrl || randomImage.imageUrl;


  return (
    <Link href={`/documents/${document.id}`} className="group">
      <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary">
        <CardHeader className="p-0">
          <div className="relative aspect-[2/3] w-full">
            <Image
              src={thumbnailUrl}
              alt={`Cover of ${document.title}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint="book cover"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-base font-semibold leading-tight mb-1 line-clamp-2">
            {document.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground line-clamp-1">{document.author}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
           <div className="flex flex-wrap gap-1">
            {documentTags.slice(0, 2).map(tag => (
              <Badge key={tag.id} variant="secondary" className="text-xs">{tag.name}</Badge>
            ))}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default DocumentCard;
