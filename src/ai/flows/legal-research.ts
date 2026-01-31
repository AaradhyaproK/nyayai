'use server';

/**
 * @fileOverview Finds relevant legal precedents for a given case description.
 *
 * - findPrecedents - A function that finds legal precedents.
 * - FindPrecedentsInput - The input type for the findPrecedents function.
 * - FindPrecedentsOutput - The return type for the findPrecedents function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FindPrecedentsInputSchema = z.object({
  caseDescription: z
    .string()
    .describe('A description of the case to find precedents for.'),
});
export type FindPrecedentsInput = z.infer<
  typeof FindPrecedentsInputSchema
>;

const PrecedentSchema = z.object({
    caseName: z.string().describe("The name of the precedent case."),
    summary: z.string().describe("A brief summary of the case and its relevance."),
    citation: z.string().describe("The legal citation for the case."),
});

const FindPrecedentsOutputSchema = z.object({
  precedents: z.array(PrecedentSchema).describe('A list of relevant legal precedents.'),
  analysis: z.string().describe("A brief analysis of how the precedents apply to the user's case."),
});
export type FindPrecedentsOutput = z.infer<
  typeof FindPrecedentsOutputSchema
>;

export async function findPrecedents(
  input: FindPrecedentsInput
): Promise<FindPrecedentsOutput> {
  return findPrecedentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findPrecedentsPrompt',
  input: {schema: FindPrecedentsInputSchema},
  output: {schema: FindPrecedentsOutputSchema},
  prompt: `You are an expert legal research assistant. Your task is to find relevant legal precedents based on a given case description.
  For each precedent, provide the case name, a summary of its relevance, and the citation. Also provide a brief analysis of how these precedents might apply to the described case.

  Case Description: {{{caseDescription}}}
  `,
});

const findPrecedentsFlow = ai.defineFlow(
  {
    name: 'findPrecedentsFlow',
    inputSchema: FindPrecedentsInputSchema,
    outputSchema: FindPrecedentsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
