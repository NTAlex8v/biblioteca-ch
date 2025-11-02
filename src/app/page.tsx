"use client";

import * as React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DocumentCard from "@/components/document-card";
import type { Document, Category } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [yearFilter, setYearFilter] = React.useState("all");

  const documentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'documents');
  }, [firestore]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);

  const { data: documentsData, isLoading: isLoadingDocuments } = useCollection<Document>(documentsQuery);
  const { data: categoriesData } = useCollection<Category>(categoriesQuery);

  const filteredDocuments = React.useMemo(() => {
    if (!documentsData) return [];

    let filtered = documentsData;

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(lowercasedTerm) ||
        doc.author.toLowerCase().includes(lowercasedTerm) ||
        doc.description.toLowerCase().includes(lowercasedTerm)
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(doc => doc.categoryId === categoryFilter);
    }
    
    if (yearFilter !== "all") {
      filtered = filtered.filter(doc => doc.year === parseInt(yearFilter));
    }

    return filtered;
  }, [documentsData, searchTerm, categoryFilter, yearFilter]);

  const uniqueYears = React.useMemo(() => {
    if (!documentsData) return [];
    return [...new Set(documentsData.map(doc => doc.year))].sort((a, b) => b - a);
  }, [documentsData]);

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Biblioteca de Recursos</h1>
        <p className="text-muted-foreground">Explora, busca y descarga material académico.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <Input 
            placeholder="Buscar por título, autor o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Categorías</SelectItem>
              {categoriesData?.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Años</SelectItem>
              {uniqueYears.map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoadingDocuments ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
             <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-56 w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredDocuments.map(doc => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">No se encontraron documentos</h2>
          <p className="text-muted-foreground mt-2">Intenta ajustar tus filtros o términos de búsqueda.</p>
        </div>
      )}
    </div>
  );
}
