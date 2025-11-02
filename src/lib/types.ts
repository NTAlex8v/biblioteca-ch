import type { LucideIcon } from "lucide-react";

export type Document = {
    id: string;
    title: string;
    author: string;
    year: number;
    description: string;
    fileUrl: string;
    categoryId: string;
    folderId?: string | null;
    tagIds?: string[];
    lastUpdated: string;
    versionHistory?: string[];
    thumbnailUrl?: string;
    subject?: string;
    version?: string;
    tags?: string[];
    createdBy: string;
};

export type Category = {
    id: string;
    name: string;
    description:string;
    icon?: LucideIcon;
};

export type Folder = {
    id: string;
    name: string;
    categoryId: string;
    parentFolderId: string | null;
    createdBy: string;
};

export type Tag = {
    id: string;
    name: string;
};

export type User = {
    id: string;
    email: string;
    role: 'Admin' | 'Editor' | 'User';
    avatarUrl?: string; 
    lastActivity?: string;
    createdAt?: string; 
    name?: string;
};

export type AuditLog = {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    action: 'create' | 'update' | 'delete' | 'role_change';
    entityType: 'Document' | 'Category' | 'Folder' | 'User' | 'Tag';
    entityId: string;
    entityName: string;
    details: string;
};
