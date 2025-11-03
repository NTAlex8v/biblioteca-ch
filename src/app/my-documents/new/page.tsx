"use client";

import DocumentForm from "@/components/document-form";
import SimpleDocumentForm from "@/components/simple-document-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function NewDocumentPage() {

    return (
        <div className="container mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Añadir Nuevo Documento</h1>
                <p className="text-muted-foreground">Elige un formato para añadir tu recurso a la biblioteca.</p>
            </div>
            
            <Tabs defaultValue="simple" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                    <TabsTrigger value="simple">Formato Simple</TabsTrigger>
                    <TabsTrigger value="completo">Formato Completo</TabsTrigger>
                </TabsList>
                <TabsContent value="simple">
                   <SimpleDocumentForm />
                </TabsContent>
                <TabsContent value="completo">
                    <DocumentForm />
                </TabsContent>
            </Tabs>
        </div>
    );
}
