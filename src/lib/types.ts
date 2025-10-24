import type { LucideIcon } from "lucide-react";

export type Document = {
    id: string;
    title: string;
    author: string;
    year: number;
    description: string;
    fileUrl: string;
    categoryId: string;
    tagIds?: string[];
    lastUpdated: string; // Should be a date-time string
    versionHistory?: string[];
    thumbnailUrl?: string; // Added for card display
    subject?: string; // Added for document info
    version?: string; // Added for document info
    tags?: string[]; // To hold tag names for display
    createdBy?: string; // ID of the user who created the document
};

export type Category = {
    id: string;
    name: string;
    description:string;
    parentCategoryId?: string;
    icon?: LucideIcon; // Icon is optional now
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