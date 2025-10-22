
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
  Shapes,
} from "lucide-react";
import { useCollection, useFirestore, useUser, useMemoFirebase, useUserClaims } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Category } from "@/lib/types";

const SideNav = () => {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  
  const firestore = useFirestore();
  const { user } = useUser();
  const { claims } = useUserClaims();

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);

  const { data: categories, isLoading } = useCollection<Category>(categoriesQuery);

  const userRole = claims?.role;

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
            <Link href="/">
              <SidebarMenuButton isActive={isActive("/")} tooltip="Inicio">
                <Home />
                <span>Inicio</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          {user && (
            <>
              <SidebarGroup>
                <SidebarGroupLabel>Categorías</SidebarGroupLabel>
                {isLoading ? (
                  <p className="px-2 text-xs text-muted-foreground">Cargando...</p>
                ) : (
                  categories?.map((category) => (
                    <SidebarMenuItem key={category.id}>
                      <Link href={`/category/${category.id}`}>
                        <SidebarMenuButton
                          isActive={isActive(`/category/${category.id}`)}
                          tooltip={category.name}
                        >
                          <Shapes />
                          <span>{category.name}</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarGroup>
              
              {(userRole === 'Admin' || userRole === 'Editor') && (
                <SidebarGroup>
                    <SidebarGroupLabel>Administración</SidebarGroupLabel>
                    <SidebarMenuItem>
                        <Link href="/admin">
                            <SidebarMenuButton isActive={pathname.startsWith("/admin") && pathname.endsWith('/admin')} tooltip="Panel de Admin">
                                <ShieldCheck />
                                <span>Admin</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Link href="/admin/documents">
                            <SidebarMenuButton isActive={isActive("/admin/documents")} tooltip="Documentos">
                                <FileText />
                                <span>Documentos</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    {userRole === 'Admin' && (
                        <SidebarMenuItem>
                            <Link href="/admin/users">
                                <SidebarMenuButton isActive={isActive("/admin/users")} tooltip="Usuarios">
                                    <Users />
                                    <span>Usuarios</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    )}
                     <SidebarMenuItem>
                        <Link href="/admin/upload">
                            <SidebarMenuButton isActive={isActive("/admin/upload")} tooltip="Subir Material">
                                <Upload />
                                <span>Subir Material</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                </SidebarGroup>
              )}
            </>
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
