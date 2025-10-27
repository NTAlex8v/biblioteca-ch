
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FileText, Download, File, FileType } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DocumentationPage() {
  const { toast } = useToast();

  const handleExport = (format: 'pdf' | 'word') => {
    // Placeholder function for export
    toast({
      title: 'Función en desarrollo',
      description: `La exportación a ${format.toUpperCase()} aún no está implementada.`,
    });
  };

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <FileText className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documentación del Sistema</h1>
            <p className="text-muted-foreground">
              Guía completa sobre el funcionamiento y las características de la biblioteca virtual.
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleExport('pdf')}>
              <File className="mr-2 h-4 w-4" />
              Exportar a PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('word')}>
              <FileType className="mr-2 h-4 w-4" />
              Exportar a Word
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contenido de la Documentación</CardTitle>
          <CardDescription>
            Haz clic en cada sección para expandir y ver los detalles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Visión General del Sistema</AccordionTrigger>
              <AccordionContent>
                El sistema de biblioteca virtual CMI Tahuantinsuyo Bajo es una plataforma diseñada para centralizar, organizar y facilitar el acceso a documentos y recursos académicos. Permite a los usuarios buscar, visualizar y gestionar material de estudio de manera eficiente, con una estructura basada en categorías y carpetas anidables.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Roles de Usuario</AccordionTrigger>
              <AccordionContent>
                El sistema cuenta con tres roles de usuario definidos para gestionar el acceso y los permisos:
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>
                    <strong>Admin:</strong> Tiene control total sobre el sistema. Puede gestionar usuarios, categorías, carpetas y todos los documentos. Es el único rol que puede cambiar los roles de otros usuarios.
                  </li>
                  <li>
                    <strong>Editor:</strong> Puede gestionar categorías y todos los documentos del sistema, pero no puede administrar usuarios.
                  </li>
                  <li>
                    <strong>User:</strong> Es el rol estándar. Puede ver todos los recursos públicos, subir sus propios documentos, crear carpetas y gestionar únicamente el contenido que ha creado.
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Funcionalidades Principales</AccordionTrigger>
              <AccordionContent>
                <Accordion type="multiple" className="w-full">
                    <AccordionItem value="sub-item-1">
                        <AccordionTrigger className="text-sm">Gestión de Documentos</AccordionTrigger>
                        <AccordionContent className="pl-4">
                            Los usuarios pueden subir nuevos documentos especificando título, autor, año, descripción, categoría y un enlace al archivo PDF. También pueden editar la información de sus documentos o eliminarlos. Los Admins y Editores pueden gestionar todos los documentos.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="sub-item-2">
                        <AccordionTrigger className="text-sm">Organización por Categorías y Carpetas</AccordionTrigger>
                        <AccordionContent className="pl-4">
                           La estructura principal se basa en <strong>Categorías</strong>, que son gestionadas por Admins/Editores. Dentro de cada categoría, cualquier usuario autenticado puede crear <strong>Carpetas</strong>. Estas carpetas pueden anidarse para crear una jerarquía organizativa flexible y profunda.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="sub-item-3">
                        <AccordionTrigger className="text-sm">Búsqueda y Filtrado</AccordionTrigger>
                        <AccordionContent className="pl-4">
                            La página principal ofrece una barra de búsqueda para encontrar documentos por título, autor o descripción. Adicionalmente, se puede filtrar por categoría y año de publicación para refinar los resultados.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="sub-item-4">
                        <AccordionTrigger className="text-sm">Búsqueda Mejorada con IA</AccordionTrigger>
                        <AccordionContent className="pl-4">
                            La sección de "Búsqueda Mejorada con IA" permite realizar consultas complejas. El sistema utiliza un modelo de lenguaje para analizar la consulta y, basándose en patrones de acceso y tendencias, ofrece resultados mejorados y recomendaciones de material relevante.
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="sub-item-5">
                        <AccordionTrigger className="text-sm">Visualizador de PDF</AccordionTrigger>
                        <AccordionContent className="pl-4">
                            En la página de detalle de cada documento, existe la opción de "Ver PDF Embebido", que abre el archivo directamente en la página utilizando un visor seguro, sin necesidad de descargarlo.
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="sub-item-6">
                        <AccordionTrigger className="text-sm">Historial de Actividad</AccordionTrigger>
                        <AccordionContent className="pl-4">
                            Cada usuario tiene una sección "Mi Historial" donde puede ver un registro de todas las acciones que ha realizado en el sistema, como crear, actualizar o eliminar contenido.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
