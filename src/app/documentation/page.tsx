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
                    <strong>Admin:</strong> Tiene control total sobre el sistema. Puede gestionar usuarios (cambiar roles), categorías, carpetas y todos los documentos. Es el único rol que puede ver y administrar la lista completa de usuarios.
                  </li>
                  <li>
                    <strong>Editor:</strong> Puede gestionar categorías y todos los documentos y carpetas del sistema. Este rol está pensado para supervisores de contenido que no necesitan administrar usuarios.
                  </li>
                  <li>
                    <strong>User:</strong> Es el rol estándar. Puede ver todos los recursos públicos, subir sus propios documentos, crear carpetas y gestionar únicamente el contenido que ha creado (editarlo, moverlo o eliminarlo).
                  </li>
                </ul>
                 <p className="mt-4 text-sm text-muted-foreground">
                  <strong>Nota:</strong> El primer usuario que se registra en el sistema es asignado automáticamente como Administrador.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Funcionalidades Principales</AccordionTrigger>
              <AccordionContent>
                <Accordion type="multiple" className="w-full">
                    <AccordionItem value="sub-item-1">
                        <AccordionTrigger className="text-sm">Gestión de Documentos</AccordionTrigger>
                        <AccordionContent className="pl-4">
                            Los usuarios pueden subir nuevos documentos a través de dos formularios:
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><strong>Formato Simple:</strong> Permite subir un archivo PDF rápidamente, especificando solo la categoría. El sistema asignará el nombre del archivo como título.</li>
                                <li><strong>Formato Completo:</strong> Un formulario detallado para catalogar el documento con título, autor, año, descripción, materia, versión y URL de portada opcional.</li>
                            </ul>
                            Los usuarios pueden editar la información de sus documentos, moverlos entre categorías/carpetas o eliminarlos. Los Admins y Editores pueden gestionar todos los documentos.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="sub-item-2">
                        <AccordionTrigger className="text-sm">Organización por Categorías y Carpetas</AccordionTrigger>
                        <AccordionContent className="pl-4">
                           La estructura principal se basa en <strong>Categorías</strong>, que son los contenedores de nivel superior (ej. "Cardiología", "Pediatría") y son gestionadas exclusivamente por Admins/Editores. Dentro de cada categoría, cualquier usuario autenticado puede crear <strong>Carpetas</strong> para organizar mejor los documentos. Estas carpetas pueden anidarse unas dentro de otras para crear una jerarquía organizativa flexible y profunda.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="sub-item-3">
                        <AccordionTrigger className="text-sm">Búsqueda y Filtrado en la Página Principal</AccordionTrigger>
                        <AccordionContent className="pl-4">
                            La página principal ofrece herramientas para encontrar contenido rápidamente:
                             <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><strong>Barra de Búsqueda:</strong> Permite buscar documentos por texto coincidente en el título, autor o descripción.</li>
                                <li><strong>Filtro de Categoría:</strong> Permite mostrar únicamente los documentos que pertenecen a una categoría específica.</li>
                                <li><strong>Filtro de Año:</strong> Permite filtrar los documentos por su año de publicación.</li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="sub-item-4">
                        <AccordionTrigger className="text-sm">Movimiento de Documentos</AccordionTrigger>
                        <AccordionContent className="pl-4">
                           Los usuarios con permisos de gestión sobre un documento (el creador, un Editor o un Admin) pueden moverlo a una nueva ubicación. La opción "Mover" en el menú de acciones de un documento abrirá un diálogo que permite seleccionar una nueva categoría y, opcionalmente, una carpeta dentro de esa categoría como nuevo destino.
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="sub-item-5">
                        <AccordionTrigger className="text-sm">Visualizador de PDF Embebido</AccordionTrigger>
                        <AccordionContent className="pl-4">
                            En la página de detalle de cada documento, existe la opción de "Ver PDF Embebido", que abre el archivo directamente en la página utilizando un visor seguro proporcionado por Google, sin necesidad de descargar el archivo.
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="sub-item-6">
                        <AccordionTrigger className="text-sm">Historial de Actividad y Perfil</AccordionTrigger>
                        <AccordionContent className="pl-4">
                           <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li><strong>Mi Historial:</strong> Cada usuario tiene una sección donde puede ver un registro cronológico de todas las acciones que ha realizado en el sistema, como crear, actualizar o eliminar contenido.</li>
                                <li><strong>Perfil de Usuario:</strong> Los usuarios pueden actualizar su nombre y foto de perfil. También pueden solicitar un restablecimiento de contraseña desde esta página.</li>
                           </ul>
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
