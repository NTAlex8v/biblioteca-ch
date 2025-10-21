"use client";

import * as React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockDocuments, mockCategories } from "@/lib/data";
import DocumentCard from "@/components/document-card";
import type { Document } from "@/lib/types";

export default function Home() {
  const [documents, setDocuments] = React.useState<Document[]>(mockDocuments);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [yearFilter, setYearFilter] = React.useState("all");

  React.useEffect(() => {
    let filtered = mockDocuments;

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(doc => doc.category === categoryFilter);
    }
    
    if (yearFilter !== "all") {
      filtered = filtered.filter(doc => doc.year === parseInt(yearFilter));
    }

    setDocuments(filtered);
  }, [searchTerm, categoryFilter, yearFilter]);

  const uniqueYears = [...new Set(mockDocuments.map(doc => doc.year))].sort((a, b) => b - a);

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
              {mockCategories.map(cat => (
                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
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
      
      {documents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {documents.map(doc => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold">No se encontraron documentos</h2>
          <p className="text-muted-foreground mt-2">Intenta ajustar tus filtros o términos de búsqueda.</p>
        </div>
      )}
    </div>
  );
}
