
"use client";

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { AuditLog } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, FileText, User as UserIcon, Folder, Shapes, Tag as TagIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const entityIcons: { [key: string]: React.ElementType } = {
    Document: FileText,
    User: UserIcon,
    Folder: Folder,
    Category: Shapes,
    Tag: TagIcon,
};

const actionColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  create: 'default',
  update: 'secondary',
  role_change: 'secondary',
  delete: 'destructive',
};

const actionTranslations: { [key: string]: string } = {
    create: 'Creación',
    update: 'Actualización',
    delete: 'Eliminación',
    role_change: 'Cambio de Rol'
};

export default function HistoryAdminPage() {
  const firestore = useFirestore();

  const auditLogQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'auditLogs'),
        orderBy('timestamp', 'desc')
    );
  }, [firestore]);
  
  const { data: logs, isLoading: isLoadingLogs } = useCollection<AuditLog>(auditLogQuery);

  return (
    <div className="container mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <History className="h-8 w-8" />
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Historial de Cambios Global</h1>
            <p className="text-muted-foreground">Toda la actividad registrada en el sistema.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Registros de Auditoría</CardTitle>
          <CardDescription>
            {isLoadingLogs ? 'Cargando historial...' : `Se encontraron ${logs?.length || 0} registros en total.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Entidad</TableHead>
                <TableHead>Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingLogs ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="h-16"><div className="w-full h-8 animate-pulse rounded-md bg-muted"></div></TableCell>
                  </TableRow>
                ))
              ) : logs && logs.length > 0 ? (
                logs.map(log => {
                  const Icon = entityIcons[log.entityType] || FileText;
                  return (
                    <TableRow key={log.id}>
                        <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: es })}
                        </TableCell>
                        <TableCell className="font-medium">{log.userName}</TableCell>
                        <TableCell>
                            <Badge variant={actionColors[log.action] || 'outline'}>{actionTranslations[log.action] || log.action}</Badge>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span>{log.entityName}</span>
                            </div>
                        </TableCell>
                        <TableCell>{log.details}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No se encontraron registros de cambios.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    