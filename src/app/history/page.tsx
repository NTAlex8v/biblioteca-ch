"use client";

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { AuditLog } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, FileText, User as UserIcon, Folder, Shapes, Tag as TagIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

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

export default function MyHistoryPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();

  const auditLogQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'users', user.uid, 'auditLogs'),
        orderBy('timestamp', 'desc')
    );
  }, [firestore, user]);
  
  const { data: logs, isLoading: isLoadingLogs } = useCollection<AuditLog>(auditLogQuery);

  if (!user) {
    router.push('/login');
    return (
        <div className="container mx-auto text-center py-16">
            <p className="text-muted-foreground">Debes iniciar sesión para ver tu historial. Redirigiendo...</p>
        </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <History className="h-8 w-8" />
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Mi Historial de Actividad</h1>
            <p className="text-muted-foreground">Tus acciones realizadas en el sistema.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Mis Registros</CardTitle>
          <CardDescription>
            {isLoadingLogs ? 'Cargando tu historial...' : `Has realizado ${logs?.length || 0} acciones registradas.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Entidad</TableHead>
                <TableHead>Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingLogs ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4} className="h-16"><div className="w-full h-8 animate-pulse rounded-md bg-muted"></div></TableCell>
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
                  <TableCell colSpan={4} className="h-24 text-center">
                    No tienes actividad registrada todavía.
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
