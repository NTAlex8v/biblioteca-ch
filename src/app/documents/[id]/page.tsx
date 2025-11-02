import { notFound } from 'next/navigation';
import DocumentDetailClient from './client-page';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function DocumentPageSkeleton() {
    return (
        <div className="container mx-auto max-w-5xl">
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                </div>
                <div className="md:col-span-2 space-y-4">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-24 w-full" />
                    <div className="flex gap-4">
                        <Skeleton className="h-12 flex-1" />
                        <Skeleton className="h-12 flex-1" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default async function DocumentPage({ params }: { params: { id: string } }) {
  
  if (!params.id) {
    notFound();
  }

  return (
    <Suspense fallback={<DocumentPageSkeleton />}>
      <DocumentDetailClient documentId={params.id} />
    </Suspense>
  );
}
