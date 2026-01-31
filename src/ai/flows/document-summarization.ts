'use server';

/**
 * @fileOverview Summarizes legal documents to provide a concise overview.
 *
 * - summarizeDocument - A function that summarizes a given legal document.
 * - DocumentSummarizationInput - The input type for the summarizeDocument function.
 * - DocumentSummarizationOutput - The return type for the summarizeDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DocumentSummarizationInputSchema = z.object({
  documentContent: z
    .string()
    .describe('The content of the legal document to be summarized.'),
  documentType: z.string().describe('The type of the legal document.'),
});
export type DocumentSummarizationInput = z.infer<
  typeof DocumentSummarizationInputSchema
>;

const DocumentSummarizationOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the legal document.'),
  relevantLegalPrinciples: z
    .string()
    .describe(
      'Relevant legal principles that are present within the legal document.'
    ),
});
export type DocumentSummarizationOutput = z.infer<
  typeof DocumentSummarizationOutputSchema
>;

export async function summarizeDocument(
  input: DocumentSummarizationInput
): Promise<DocumentSummarizationOutput> {
  return summarizeDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'documentSummarizationPrompt',
  input: {schema: DocumentSummarizationInputSchema},
  output: {schema: DocumentSummarizationOutputSchema},
  prompt: `You are an expert legal professional. Your task is to provide a concise summary and identify relevant legal principles from a given legal document.

  Document Type: {{{documentType}}}
  Document Content: {{{documentContent}}}

  Summary:
  Relevant Legal Principles:
  `,
});

const summarizeDocumentFlow = ai.defineFlow(
  {
    name: 'summarizeDocumentFlow',
    inputSchema: DocumentSummarizationInputSchema,
    outputSchema: DocumentSummarizationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
