import type { LucideIcon } from "lucide-react";

export type Document = {
  id: string;
  title: string;
  author: string;
  year: number;
  category: string;
  subject: string;
  description: string;
  tags: string[];
  thumbnailUrl: string;
  fileUrl: string;
  lastUpdated: string;
  version: number;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'User';
  avatarUrl: string;
  lastActivity: string;
  createdAt: string;
};

export type Category = {
  id: string;
  name: string;
  icon: LucideIcon;
};
