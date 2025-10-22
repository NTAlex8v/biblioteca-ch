
"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import type { User as AppUser, Document, Category, Tag } from "@/lib/types";
import { doc, collection } from "firebase/firestore";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc<AppUser>(userDocRef);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !userData || userData.role !== 'Admin') return null;
    return collection(firestore, 'users');
  }, [firestore, userData]);

  const documentsQuery = useMemoFirebase(() => {
    if (!firestore || !userData || (userData.role !== 'Admin' && userData.role !== 'Editor')) return null;
    return collection(firestore, 'documents');
  }, [firestore, userData]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore || !userData || (userData.role !== 'Admin' && userData.role !== 'Editor')) return null;
    return collection(firestore, 'categories');
  }, [firestore, userData]);
  
  const { data: users, isLoading: isLoadingUsers } = useCollection<AppUser>(usersQuery);
  const { data: documents, isLoading: isLoadingDocuments } = useCollection<Document>(documentsQuery);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery);

  const isLoading = isUserLoading || isUserDataLoading || isLoadingUsers || isLoadingDocuments || isLoadingCategories;
  
  if (isLoading) {
    return (
        <div className="flex h-[80vh] items-center justify-center">
            <p>Cargando...</p>
        </div>
    );
  }

  if (!user || (userData?.role !== 'Admin' && userData?.role !== 'Editor')) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Acceso Denegado</h1>
          <p className="text-muted-foreground">
            No tienes permiso para ver esta página.
          </p>
        </div>
      </div>
    );
  }

  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { users, documents, categories } as any);
    }
    return child;
  });

  return <>{childrenWithProps}</>;
}
