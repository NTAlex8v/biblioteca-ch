
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { initializeFirebase } from '@/firebase'; // Use client-side initialization
import CategoryForm from "@/components/category-form";
import type { Category } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Initialize firebase on the client
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


export default async function EditCategoryPage({ params }: { params: { id: string } }) {
    
    const category = await getCategory(params.id);

    if (!category) {
        notFound();
    }

    return (
        <div className="container mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Editar Categoría</h1>
                <p className="text-muted-foreground">Actualiza la información de la categoría.</p>
            </div>
            <CategoryForm category={category} />
        </div>
    );
}
