"use client";

import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const SearchInputHandler = () => {
  const searchParams = useSearchParams();

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        name="search"
        placeholder="Búsqueda avanzada con IA..."
        defaultValue={searchParams.get('q') || ''}
        className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
      />
    </div>
  );
};

export default SearchInputHandler;
