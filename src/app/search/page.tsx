
'use client';

import { useSearchParams } from 'next/navigation';
import { useActionState, Suspense } from 'react';
import { useFormStatus } from 'react-dom';
import { intelligentSearch, IntelligentSearchOutput, IntelligentSearchInput } from '@/ai/flows/enhance-search-with-ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search, Sparkles, Wand2, FileText, Folder, Shapes } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
      Mejorar Búsqueda
    </Button>
  );
}

async function formAction(prevState: any, formData: FormData): Promise<IntelligentSearchOutput | { error: string }> {
    const query = formData.get('query') as string;
    
    if (!query) {
        return { results: [] };
    }

    try {
        const response = await intelligentSearch({ query });
        return response;
    } catch (e: any) {
        console.error("AI Search Error:", e);
        return { error: e.message || "Ocurrió un error al contactar al servicio de IA." };
    }
}

function SearchResults({ state }: { state: IntelligentSearchOutput | { error: string } | null }) {
    if (!state) return null;

    if ('error' in state) {
        return (
             <Card className="border-destructive bg-destructive/10">
                <CardHeader>
                    <CardTitle className="text-destructive">Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{state.error}</p>
                </CardContent>
            </Card>
        )
    }

    if (!state.results || state.results.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>No se encontraron resultados</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">La IA no encontró documentos, carpetas o categorías que coincidan con tu búsqueda. Intenta con otros términos.</p>
                </CardContent>
            </Card>
        )
    }

    const resultTypeConfig = {
        document: { icon: FileText, path: '/documents/', label: 'Documento' },
        folder: { icon: Folder, path: '/folders/', label: 'Carpeta' },
        category: { icon: Shapes, path: '/category/', label: 'Categoría' },
    };

    return (
        <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="text-primary" />
                Resultados de la Búsqueda
              </CardTitle>
              <CardDescription>Resultados encontrados por la IA en la base de datos.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    {state.results.map((item, index) => {
                        const config = resultTypeConfig[item.type];
                        const Icon = config.icon;
                        const href = `${config.path}${item.id}`;
                        const title = item.type === 'document' ? (item as any).title : (item as any).name;

                        return (
                            <Link href={href} key={`${item.id}-${index}`} className="block p-4 rounded-lg border hover:bg-accent transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Icon className="h-5 w-5 text-muted-foreground" />
                                        <span className="font-medium">{title}</span>
                                    </div>
                                    <Badge variant="outline">{config.label}</Badge>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

function SearchPageComponent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [state, action] = useActionState(formAction, null);
  
  return (
    <>
      <Card className="mb-8">
        <CardContent className="p-6">
          <form action={action} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="query" className="text-base font-medium">Término de Búsqueda</Label>
              <Input
                id="query"
                name="query"
                placeholder="Ej: 'impacto del zika en salud pública'"
                defaultValue={initialQuery}
                required
                className="text-base"
              />
            </div>
            <div className='flex justify-end'>
                <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>

      <SearchResults state={state} />
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="container mx-auto max-w-4xl">
      <div className="text-center mb-8">
        <Wand2 className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-3xl font-bold tracking-tight">Búsqueda Mejorada con IA</h1>
        <p className="text-muted-foreground mt-2">
          Utiliza la inteligencia artificial para obtener resultados más precisos y descubrir material relevante.
        </p>
      </div>
      <Suspense fallback={<Card className="mb-8 p-6"><div className="h-24 animate-pulse rounded-md bg-muted"></div></Card>}>
        <SearchPageComponent />
      </Suspense>
    </div>
  );
}
