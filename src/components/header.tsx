"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Book,
  LogOut,
  User,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { signOut } from "firebase/auth";
import React, { Suspense } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth, useUser } from "@/firebase";
import SearchInputHandler from "./search-input-handler";

const ThemeToggle = () => {
    const { setTheme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                    Claro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Oscuro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                    Sistema
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

const Header = () => {
  const router = useRouter();
  const auth = useAuth();
  const { user, userData, isUserLoading } = useUser();

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get('search') as string;
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleSignOut = () => {
    if(!auth) return;
    signOut(auth).then(() => {
        router.push('/login');
    });
  };

  const UserMenu = () => {
    if (isUserLoading) {
        return (
             <Button variant="ghost" className="relative h-9 w-9 rounded-full" disabled>
                <Avatar className="h-9 w-9">
                    <AvatarFallback>?</AvatarFallback>
                </Avatar>
            </Button>
        )
    }

    if (!user) {
      return (
          <Button asChild variant="outline">
              <Link href="/login">Iniciar Sesión</Link>
          </Button>
      );
    }
    
    return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={userData?.avatarUrl || user.photoURL || undefined} alt={userData?.name || user.displayName || ""} />
                <AvatarFallback>
                  {userData?.name?.charAt(0) || user.displayName?.charAt(0) || user.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {userData?.name || user.displayName || 'Usuario'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link href="/profile">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
    )
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Book className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline-block">CMI Tahuantinsuyo Bajo</span>
        </Link>
      </div>

      <div className="flex w-full flex-1 items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form onSubmit={handleSearch} className="ml-auto flex-1 sm:flex-initial">
          <Suspense fallback={<div>Loading search...</div>}>
            <SearchInputHandler />
          </Suspense>
        </form>
        
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
};

export default Header;
