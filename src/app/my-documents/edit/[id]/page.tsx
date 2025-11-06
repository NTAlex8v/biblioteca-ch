import { notFound } from 'next/navigation';
import EditDocumentClientPage from './client-page';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function EditDocumentPageSkeleton() {
    return (
        <div className="container mx-auto">
            <div className="mb-8">
                <Skeleton className="h-9 w-1/2 mb-2" />
                <Skeleton className="h-6 w-3/4" />
            </div>
            <Skeleton className="h-[500px] w-full" />
        </div>
    );
}

export default function EditDocumentPage({ params }: { params: { id: string } }) {
    if (!params.id) {
        notFound();
    }
    
    return (
       <Suspense fallback={<EditDocumentPageSkeleton />}>
            <EditDocumentClientPage documentId={params.id} />
       </Suspense>
    );
}
