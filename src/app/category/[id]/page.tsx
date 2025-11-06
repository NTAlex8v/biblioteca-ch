import { notFound } from 'next/navigation';
import CategoryClientPage from './client-page';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function CategoryPageSkeleton() {
    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-6 w-96" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-36" />
                    <Skeleton className="h-10 w-40" />
                </div>
            </div>
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
            </div>
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
            </div>
        </div>
    );
}

export default function CategoryPage({ params }: { params: { id: string } }) {
    if (!params.id) {
        notFound();
    }
    
    return (
       <Suspense fallback={<CategoryPageSkeleton />}>
            <CategoryClientPage categoryId={params.id} />
       </Suspense>
    );
}
