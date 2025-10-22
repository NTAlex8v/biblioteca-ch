
"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import type { User as AppUser, Document, Category } from "@/lib/types";
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

  // IMPORTANT: Queries are now conditional on userData and role.
  // They will be null if the user is not an admin/editor, preventing the hooks from running.
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !userData || userData.role !== 'Admin') {
      return null;
    }
    return collection(firestore, 'users');
  }, [firestore, userData]);

  const documentsQuery = useMemoFirebase(() => {
    if (!firestore || !userData || (userData.role !== 'Admin' && userData.role !== 'Editor')) {
      return null;
    }
    return collection(firestore, 'documents');
  }, [firestore, userData]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore || !userData || (userData.role !== 'Admin' && userData.role !== 'Editor')) {
      return null;
    }
    return collection(firestore, 'categories');
  }, [firestore, userData]);
  
  const { data: users, isLoading: isLoadingUsers } = useCollection<AppUser>(usersQuery);
  const { data: documents, isLoading: isLoadingDocuments } = useCollection<Document>(documentsQuery);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery);

  const isLoading = isUserLoading || isUserDataLoading || isLoadingUsers || isLoadingDocuments || isLoadingCategories;
  
  // Primary loading state until user role is determined
  if (isUserLoading || isUserDataLoading) {
    return (
        <div className="flex h-[80vh] items-center justify-center">
            <p>Cargando...</p>
        </div>
    );
  }

  // Strict access control. If not an Admin or Editor, deny access and DO NOT render children.
  if (!user || !userData || (userData.role !== 'Admin' && userData.role !== 'Editor')) {
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

  // If authorized, clone the child element and pass the fetched data as props.
  // This ensures the child page has the data it needs without fetching it again.
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // Pass only the necessary data to each child.
      // This prevents, for example, an Editor from getting a list of users.
      const props: any = {
        documents,
        categories,
      };
      if (userData.role === 'Admin') {
        props.users = users;
      }
      return React.cloneElement(child, props);
    }
    return child;
  });

  // Render children only after all checks have passed
  return <>{childrenWithProps}</>;
}
