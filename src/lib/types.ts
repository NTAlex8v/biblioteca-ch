import type { LucideIcon } from "lucide-react";

export type Document = {
    id: string;
    title: string;
    author: string;
    year: number;
    description: string;
    fileUrl: string;
    categoryId: string;
    folderId?: string | null; // Can be in a category root or a folder
    tagIds?: string[];
    lastUpdated: string; // Should be a date-time string
    versionHistory?: string[];
    thumbnailUrl?: string; // Added for card display
    subject?: string; // Added for document info
    version?: string; // Added for document info
    tags?: string[]; // To hold tag names for display
    createdBy: string; // ID of the user who created the document
};

export type Category = {
    id: string;
    name: string;
    description:string;
    icon?: LucideIcon; // Icon is optional now
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
    timestamp: string; // ISO date string
    userId: string;
    userName: string; // Name of the user who performed the action
    action: 'create' | 'update' | 'delete' | 'role_change';
    entityType: 'Document' | 'Category' | 'Folder' | 'User' | 'Tag';
    entityId: string;
    entityName: string; // A display name for the entity (e.g., document title, user name)
    details: string;
};
