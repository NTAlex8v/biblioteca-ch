
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
  Shapes,
  Users,
  FileText,
  LayoutDashboard,
  FolderKanban,
} from "lucide-react";
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import type { Category, User as AppUser } from "@/lib/types";

const SideNav = () => {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  
  const firestore = useFirestore();
  const { user } = useUser();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc<AppUser>(userDocRef);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);

  const { data: categories, isLoading } = useCollection<Category>(categoriesQuery);

  const isAdminOrEditor = userData?.role === 'Admin' || userData?.role === 'Editor';

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
                <SidebarGroupLabel>Biblioteca</SidebarGroupLabel>
                 <SidebarMenuItem>
                    <Link href="/my-documents">
                      <SidebarMenuButton isActive={pathname.startsWith("/my-documents")} tooltip="Mis Documentos">
                        <FolderKanban />
                        <span>Mis Documentos</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
              </SidebarGroup>

              {isAdminOrEditor && (
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
                  {userData?.role === 'Admin' && (
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
              </SidebarGroup>
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
