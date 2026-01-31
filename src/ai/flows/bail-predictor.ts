'use server';

/**
 * @fileOverview Predicts the likelihood of bail being granted based on case details.
 *
 * - predictBailOutcome - Predicts bail outcome based on case details.
 * - BailPredictorInput - The input type for the predictBailOutcome function.
 * - BailPredictorOutput - The return type for the predictBailOutcome function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BailPredictorInputSchema = z.object({
  caseDetails: z.string().describe('Detailed information about the case, including the nature of the alleged crime, the defendant\'s history, and community ties.'),
});
export type BailPredictorInput = z.infer<typeof BailPredictorInputSchema>;

const BailPredictorOutputSchema = z.object({
  prediction: z.string().describe('The predicted outcome (e.g., "Bail Likely", "Bail Unlikely").'),
  probability: z.number().describe('The probability of bail being granted (0 to 1).'),
  reasoning: z.string().describe('The reasoning behind the prediction, citing key factors.'),
  disclaimer: z.string().describe('Disclaimer: For informational purposes only.'),
});
export type BailPredictorOutput = z.infer<typeof BailPredictorOutputSchema>;

export async function predictBailOutcome(input: BailPredictorInput): Promise<BailPredictorOutput> {
  return bailPredictorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'bailPredictorPrompt',
  input: {schema: BailPredictorInputSchema},
  output: {schema: BailPredictorOutputSchema},
  prompt: `You are an AI legal analyst specializing in bail predictions.

  Based on the provided case details, predict whether bail is likely to be granted. Provide a probability and a brief reasoning for your prediction.

  Case Details: {{{caseDetails}}}

  Consider factors like the severity of the offense, the defendant's criminal record, flight risk, and ties to the community.
  Always include the disclaimer that the results are for informational purposes only.`,
});

const bailPredictorFlow = ai.defineFlow(
  {
    name: 'bailPredictorFlow',
    inputSchema: BailPredictorInputSchema,
    outputSchema: BailPredictorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      ...output,
      disclaimer: 'This is a predictive analysis and not legal advice. Actual outcomes may vary.',
    } as BailPredictorOutput;
  }
);
