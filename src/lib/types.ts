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
};

export type Category = {
    id: string;
    name: string;
    description: string;
    parentCategoryId?: string;
    icon: LucideIcon;
};

export type Tag = {
    id: string;
    name: string;
};

export type User = {
    id: string;
    email: string;
    role: 'Admin' | 'Editor' | 'User';
    avatarUrl?: string; // Made optional
    lastActivity?: string; // Made optional
    createdAt?: string; // Made optional
    name?: string; // Made optional
};
