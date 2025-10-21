"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  BookCopy,
  Home,
  ShieldCheck,
  Upload,
  Users,
  FileText,
} from "lucide-react";
import { mockCategories } from "@/lib/data";

const SideNav = () => {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  
  // In a real app, this would come from an auth context
  const userRole = 'Admin'; 

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
          <BookCopy className="h-7 w-7 text-primary" />
          <span className="text-lg font-semibold">Cayetano Hub</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/" legacyBehavior passHref>
              <SidebarMenuButton isActive={isActive("/")} tooltip="Inicio">
                <Home />
                <span>Inicio</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarGroup>
            <SidebarGroupLabel>Categorías</SidebarGroupLabel>
            {mockCategories.map((category) => (
              <SidebarMenuItem key={category.id}>
                <Link href={`/category/${category.id}`} legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={isActive(`/category/${category.id}`)}
                    tooltip={category.name}
                  >
                    <category.icon />
                    <span>{category.name}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarGroup>
          
          {userRole === 'Admin' && (
            <SidebarGroup>
                <SidebarGroupLabel>Administración</SidebarGroupLabel>
                <SidebarMenuItem>
                    <Link href="/admin" legacyBehavior passHref>
                        <SidebarMenuButton isActive={pathname.startsWith("/admin")} tooltip="Panel de Admin">
                            <ShieldCheck />
                            <span>Admin</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/admin/documents" legacyBehavior passHref>
                        <SidebarMenuButton isActive={isActive("/admin/documents")} tooltip="Documentos">
                            <FileText />
                            <span>Documentos</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/admin/users" legacyBehavior passHref>
                        <SidebarMenuButton isActive={isActive("/admin/users")} tooltip="Usuarios">
                            <Users />
                            <span>Usuarios</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <Link href="/admin/upload" legacyBehavior passHref>
                        <SidebarMenuButton isActive={isActive("/admin/upload")} tooltip="Subir Material">
                            <Upload />
                            <span>Subir Material</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </SidebarGroup>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="text-xs text-muted-foreground p-2 text-center group-data-[collapsible=icon]:hidden">
            © 2024 Cayetano Library Hub
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default SideNav;
