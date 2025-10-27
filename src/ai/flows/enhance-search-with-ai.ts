'use server';

/**
 * @fileOverview Enhances search functionality by using AI tools to query the Firestore database for relevant documents, folders, and categories.
 *
 * - intelligentSearch - A function that orchestrates the search process using AI tools.
 * - IntelligentSearchInput - The input type for the intelligentSearch function.
 * - IntelligentSearchOutput - The return type for the intelligentSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { initializeFirebase } from '@/firebase/server-initialization';
import { collection, getDocs, query, where, or_ } from 'firebase/firestore';
import type { Document as DocumentType, Category, Folder } from '@/lib/types';


// Define input and output schemas
const IntelligentSearchInputSchema = z.object({
  query: z.string().describe('The user\'s search query.'),
});
export type IntelligentSearchInput = z.infer<typeof IntelligentSearchInputSchema>;

const DocumentResultSchema = z.object({
    id: z.string(),
    title: z.string(),
    type: z.literal('document'),
});

const FolderResultSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.literal('folder'),
});

const CategoryResultSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.literal('category'),
});

const IntelligentSearchOutputSchema = z.object({
  results: z.array(z.union([DocumentResultSchema, FolderResultSchema, CategoryResultSchema])).describe("A list of documents, folders, and categories that match the user's query."),
});
export type IntelligentSearchOutput = z.infer<typeof IntelligentSearchOutputSchema>;


// Firestore search functions
const searchDocuments = async (searchQuery: string): Promise<DocumentType[]> => {
    const { firestore } = initializeFirebase();
    const q = query(
        collection(firestore, 'documents'),
        or_(
            where('title', '>=', searchQuery), where('title', '<=', searchQuery + '\uf8ff'),
            where('description', '>=', searchQuery), where('description', '<=', searchQuery + '\uf8ff'),
            where('author', '>=', searchQuery), where('author', '<=', searchQuery + '\uf8ff')
        )
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentType));
};

const searchFolders = async (searchQuery: string): Promise<Folder[]> => {
    const { firestore } = initializeFirebase();
    const q = query(
        collection(firestore, 'folders'),
        where('name', '>=', searchQuery),
        where('name', '<=', searchQuery + '\uf8ff')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Folder));
};

const searchCategories = async (searchQuery: string): Promise<Category[]> => {
    const { firestore } = initializeFirebase();
    const q = query(
        collection(firestore, 'categories'),
        where('name', '>=', searchQuery),
        where('name', '<=', searchQuery + '\uf8ff')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
};


// Define AI tools
const findDocumentsTool = ai.defineTool(
  {
    name: 'findDocuments',
    description: 'Find documents based on a search query.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.array(DocumentResultSchema),
  },
  async (input) => {
    console.log(`[AI] Searching documents with query: "${input.query}"`);
    const documents = await searchDocuments(input.query);
    return documents.map(doc => ({ id: doc.id, title: doc.title, type: 'document' }));
  }
);

const findFoldersTool = ai.defineTool(
  {
    name: 'findFolders',
    description: 'Find folders based on a search query.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.array(FolderResultSchema),
  },
  async (input) => {
    console.log(`[AI] Searching folders with query: "${input.query}"`);
    const folders = await searchFolders(input.query);
    return folders.map(folder => ({ id: folder.id, name: folder.name, type: 'folder' }));
  }
);

const findCategoriesTool = ai.defineTool(
  {
    name: 'findCategories',
    description: 'Find categories based on a search query.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.array(CategoryResultSchema),
  },
  async (input) => {
    console.log(`[AI] Searching categories with query: "${input.query}"`);
    const categories = await searchCategories(input.query);
    return categories.map(cat => ({ id: cat.id, name: cat.name, type: 'category' }));
  }
);


// Define the main flow
const intelligentSearchFlow = ai.defineFlow(
  {
    name: 'intelligentSearchFlow',
    inputSchema: IntelligentSearchInputSchema,
    outputSchema: IntelligentSearchOutputSchema,
    system: `You are an intelligent search assistant for a virtual library.
    Your task is to use the provided tools to find relevant documents, folders, and categories based on the user's query.
    Return a unified list of all the results you find across the different tools.
    Prioritize calling the tools to get real data. Do not make up results.
    If the user's query is vague, try to infer their intent and use the tools with a more specific query. For example, if they ask for "medicina", search for documents, folders, and categories related to "medicina".`,
  },
  async (input) => {
    const llmResponse = await ai.generate({
        prompt: input.query,
        tools: [findDocumentsTool, findFoldersTool, findCategoriesTool],
        toolChoice: 'auto'
    });

    const toolOutputs = llmResponse.toolRequests().map(request => request.output());
    
    // Flatten the results from all tool calls into a single array
    const allResults = (await Promise.all(toolOutputs)).flat();
    
    return { results: allResults };
  }
);

// Exported function to be called from the frontend
export async function intelligentSearch(input: IntelligentSearchInput): Promise<IntelligentSearchOutput> {
  return intelligentSearchFlow(input);
}
