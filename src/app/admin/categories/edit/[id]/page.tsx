import { notFound } from 'next/navigation';
import EditCategoryClientPage from './client-page';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function EditCategorySkeleton() {
    return (
        <div className="container mx-auto">
             <div className="mb-8">
                <Skeleton className="h-9 w-1/2 mb-2" />
                <Skeleton className="h-6 w-3/4" />
            </div>
            <Skeleton className="h-[250px] w-full" />
        </div>
    );
}

export default function EditCategoryPage({ params }: { params: { id: string } }) {
    if (!params.id) {
        notFound();
    }
    
    return (
        <Suspense fallback={<EditCategorySkeleton />}>
            <EditCategoryClientPage categoryId={params.id} />
        </Suspense>
    );
}
