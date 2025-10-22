'use server';

/**
 * @fileOverview Enhances search functionality with AI by indexing PDF text, performing OCR, improving search results, and recommending materials.
 *
 * - enhanceSearchWithAI - A function that orchestrates the search enhancement process.
 * - EnhanceSearchWithAIInput - The input type for the enhanceSearchWithAI function.
 * - EnhanceSearchWithAIOutput - The return type for the enhanceSearchWithAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceSearchWithAIInputSchema = z.object({
  query: z.string().describe('The search query string.'),
  userAccessPatterns: z
    .string()
    .optional()
    .describe('A summary of the user access patterns.'),
  overallTrends: z.string().optional().describe('A summary of overall trends.'),
});
export type EnhanceSearchWithAIInput = z.infer<typeof EnhanceSearchWithAIInputSchema>;

const EnhanceSearchWithAIOutputSchema = z.object({
  enhancedResults: z.string().describe('The enhanced search results.'),
  recommendations: z.string().describe('Recommended materials based on the query and trends.'),
});
export type EnhanceSearchWithAIOutput = z.infer<typeof EnhanceSearchWithAIOutputSchema>;

export async function enhanceSearchWithAI(input: EnhanceSearchWithAIInput): Promise<EnhanceSearchWithAIOutput> {
  return enhanceSearchWithAIFlow(input);
}

const improveSearchResultsPrompt = ai.definePrompt({
  name: 'improveSearchResultsPrompt',
  input: {schema: EnhanceSearchWithAIInputSchema},
  output: {schema: EnhanceSearchWithAIOutputSchema},
  prompt: `You are an AI assistant designed to improve search results and provide recommendations.

  The user is searching for: {{{query}}}

  User access patterns: {{{userAccessPatterns}}}
  Overall trends: {{{overallTrends}}}

  Based on the query, user access patterns and overall trends, provide enhanced search results and material recommendations.

  Ensure that the output is well-formatted and easy to understand.
  Example:
  Enhanced Results: [List of enhanced search results]
  Recommendations: [List of recommended materials]
  `,
});

const enhanceSearchWithAIFlow = ai.defineFlow(
  {
    name: 'enhanceSearchWithAIFlow',
    inputSchema: EnhanceSearchWithAIInputSchema,
    outputSchema: EnhanceSearchWithAIOutputSchema,
  },
  async input => {
    //Call prompt to improve search results and recommendations
    const {output} = await improveSearchResultsPrompt(input);
    return output!;
  }
);