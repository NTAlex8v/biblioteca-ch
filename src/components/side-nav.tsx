
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
  Book,
  Home,
  Shapes,
  Users,
  LayoutDashboard,
  FolderKanban,
  History,
  FileText,
} from "lucide-react";
import { useCollection, useFirestore, useUserClaims, useMemoFirebase, useUser } from "@/firebase";
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

  const isUserLoggedIn = !!user;

  return (
    <Sidebar collapsible="offcanvas" variant="sidebar">
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
          <Book className="h-7 w-7 text-primary" />
          <span className="text-lg font-semibold">
            <span>CMI Tahuantinsuyo Bajo</span>
          </span>
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
          <SidebarMenuItem>
              <Link href="/documentation">
                <SidebarMenuButton isActive={isActive("/documentation")} tooltip="Documentación">
                  <FileText />
                  <span>Documentación</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

          {isUserLoggedIn && (
            <>
              <SidebarGroup>
                <SidebarGroupLabel>Biblioteca</SidebarGroupLabel>
                 <SidebarMenuItem>
                    <Link href="/my-documents">
                      <SidebarMenuButton isActive={pathname.startsWith("/my-documents")} tooltip="Mis Documentos">
                        <FolderKanban />
                        <span>Mis Documentos</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Link href="/history">
                      <SidebarMenuButton isActive={pathname.startsWith("/history")} tooltip="Mi Historial">
                        <History />
                        <span>Mi Historial</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
              </SidebarGroup>
            </>
          )}

          {(claims?.role === 'Admin' || claims?.role === 'Editor') && (
            <SidebarGroup>
              <SidebarGroupLabel>Administración</SidebarGroupLabel>
              <SidebarMenuItem>
                <Link href="/admin">
                  <SidebarMenuButton isActive={isActive("/admin")} tooltip="Panel">
                    <LayoutDashboard />
                    <span>Panel</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <Link href="/admin/categories">
                  <SidebarMenuButton isActive={pathname.startsWith("/admin/categories")} tooltip="Categorías">
                    <Shapes />
                    <span>Categorías</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              {claims?.role === 'Admin' && (
                <SidebarMenuItem>
                  <Link href="/admin/users">
                    <SidebarMenuButton isActive={pathname.startsWith("/admin/users")} tooltip="Usuarios">
                      <Users />
                      <span>Usuarios</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )}
            </SidebarGroup>
          )}

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
            {categories?.length === 0 && !isLoading && (
                 <p className="px-2 text-xs text-muted-foreground">No hay categorías.</p>
            )}
          </SidebarGroup>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="text-xs text-muted-foreground p-2 text-center group-data-[collapsible=icon]:hidden">
            © 2024 CMI Tahuantinsuyo Bajo
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default SideNav;
