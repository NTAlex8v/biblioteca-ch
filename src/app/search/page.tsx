"use client";

import { useSearchParams } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { enhanceSearchWithAI, EnhanceSearchWithAIOutput } from '@/ai/flows/enhance-search-with-ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search, Sparkles, Wand2 } from 'lucide-react';
import React from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
      Mejorar Búsqueda
    </Button>
  );
}

function fileToDataUri(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function formAction(prevState: any, formData: FormData): Promise<EnhanceSearchWithAIOutput | { error: string }> {
    const query = formData.get('query') as string;
    const pdfFile = formData.get('pdf') as File | null;
    let pdfDataUri: string | undefined = undefined;

    if (pdfFile && pdfFile.size > 0) {
        if (pdfFile.type !== 'application/pdf') {
            return { error: 'Por favor, sube un archivo PDF válido.' };
        }
        try {
            pdfDataUri = await fileToDataUri(pdfFile);
        } catch (e) {
            return { error: 'Error al procesar el archivo PDF.' };
        }
    }
    
    // In a real app, these would be dynamically fetched
    const userAccessPatterns = "User frequently accesses material on 'fisiopatología' and 'epidemiología'.";
    const overallTrends = "Increased interest in 'salud pública' and 'virología' over the last 3 months.";

    try {
        return await enhanceSearchWithAI({ query, pdfDataUri, userAccessPatterns, overallTrends });
    } catch (e: any) {
        return { error: e.message || "Ocurrió un error al contactar al servicio de IA." };
    }
}


export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [state, action] = useFormState(formAction, null);
  
  const results = state && 'enhancedResults' in state ? state : null;
  const error = state && 'error' in state ? state.error : null;

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="text-center mb-8">
        <Wand2 className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-3xl font-bold tracking-tight">Búsqueda Mejorada con IA</h1>
        <p className="text-muted-foreground mt-2">
          Utiliza la inteligencia artificial para obtener resultados más precisos y descubrir material relevante.
        </p>
      </div>

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
            <div className="grid gap-2">
              <Label htmlFor="pdf">
                Analizar un PDF (Opcional)
                <span className="text-sm text-muted-foreground ml-2">Busca dentro del contenido de un documento.</span>
              </Label>
              <Input id="pdf" name="pdf" type="file" accept="application/pdf" />
            </div>
            <div className='flex justify-end'>
                <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {results && (
        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="text-accent" />
                Resultados Mejorados
              </CardTitle>
              <CardDescription>Resultados optimizados basados en tu consulta y el contexto.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
                <p>{results.enhancedResults}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="text-accent" />
                Material Recomendado
              </CardTitle>
              <CardDescription>Sugerencias basadas en tu búsqueda y tendencias actuales.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
                 <p>{results.recommendations}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
