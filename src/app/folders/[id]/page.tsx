
import { doc, getDoc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { initializeFirebase } from '@/firebase/server-initialization';
import type { Folder } from '@/lib/types';
import FolderClientPage from './client-page';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const { firestore } = initializeFirebase();

async function getFolder(id: string): Promise<Folder | null> {
    if (!firestore) return null;
    const docRef = doc(firestore, 'folders', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }

    return { id: docSnap.id, ...docSnap.data() } as Folder;
}

function FolderPageSkeleton() {
    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Skeleton className="h-9 w-64 mb-2" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-36" />
                    <Skeleton className="h-10 w-40" />
                </div>
            </div>
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
            </div>
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
            </div>
        </div>
    );
}

export default async function FolderPage({ params }: { params: { id: string } }) {
    if (!params.id) {
        return <FolderPageSkeleton />;
    }

    const folder = await getFolder(params.id);

    if (!folder) {
        notFound();
    }
    
    return (
       <Suspense fallback={<FolderPageSkeleton />}>
            <FolderClientPage folder={folder} />
       </Suspense>
    );
}
