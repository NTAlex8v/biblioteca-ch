import { doc, getDoc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { initializeFirebase } from '@/firebase/server-initialization';
import type { Category } from '@/lib/types';
import CategoryClientPage from './client-page';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const { firestore } = initializeFirebase();

async function getCategory(id: string): Promise<Category | null> {
    if (!firestore) return null;
    const docRef = doc(firestore, 'categories', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }

    return { id: docSnap.id, ...docSnap.data() } as Category;
}

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

export default async function CategoryPage({ params }: { params: { id: string } }) {
    if (!params.id) {
        return <CategoryPageSkeleton />;
    }

    const category = await getCategory(params.id);

    if (!category) {
        notFound();
    }
    
    return (
       <Suspense fallback={<CategoryPageSkeleton />}>
            <CategoryClientPage category={category} />
       </Suspense>
    );
}
