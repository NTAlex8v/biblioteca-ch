
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { initializeFirebase } from '@/firebase'; // Use client-side initialization
import type { Document as DocumentType, Category, Tag } from '@/lib/types';
import DocumentDetailClient from './client-page';

async function getDocumentData(id: string) {
  const { firestore } = initializeFirebase();
  if (!firestore) return null;

  const docRef = doc(firestore, 'documents', id);
  const categoriesCollection = collection(firestore, 'categories');
  const tagsCollection = collection(firestore, 'tags');

  try {
    const [docSnap, categoriesSnap, tagsSnap] = await Promise.all([
      getDoc(docRef),
      getDocs(categoriesCollection),
      getDocs(tagsCollection),
    ]);

    if (!docSnap.exists()) {
      return null;
    }

    const document = { id: docSnap.id, ...docSnap.data() } as DocumentType;

    const categoryMap = new Map(categoriesSnap.docs.map(doc => [doc.id, doc.data().name]));
    const categoryName = categoryMap.get(document.categoryId) || 'Sin categoría';

    const allTags = tagsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tag[];
    const documentTags = document.tagIds ? allTags.filter(tag => document.tagIds.includes(tag.id)) : [];

    return { document, categoryName, documentTags };

  } catch (error) {
    console.error("Error fetching document data:", error);
    return null;
  }
}

export default async function DocumentPage({ params }: { params: { id: string } }) {
  const data = await getDocumentData(params.id);

  if (!data) {
    notFound();
  }

  return <DocumentDetailClient {...data} />;
}
