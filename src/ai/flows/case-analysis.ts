'use server';

/**
 * @fileOverview Provides a detailed, multilingual analysis of a legal case.
 *
 * - analyzeCase - A function that handles the case analysis.
 * - CaseAnalysisInput - The input type for the analyzeCase function.
 * - CaseAnalysisOutput - The return type for the analyzeCase function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CaseAnalysisInputSchema = z.object({
  caseDetails: z.string().describe('The full details of the legal case provided by the user.'),
  language: z.string().describe('The language for the analysis and response (e.g., "English", "Hindi").'),
});
export type CaseAnalysisInput = z.infer<typeof CaseAnalysisInputSchema>;

const PotentialOutcomeSchema = z.object({
    outcome: z.string().describe("A potential outcome of the case."),
    probability: z.number().min(0).max(1).describe("The estimated probability of this outcome, from 0 to 1."),
});

const SimilarCaseSchema = z.object({
    caseName: z.string().describe("The name of the similar precedent case."),
    summary: z.string().describe("A brief summary of the case and its relevance."),
    citation: z.string().describe("The legal citation for the case."),
    relevantLinks: z.array(z.string()).optional().describe("List of URLs to the full judgment, case report, or relevant legal articles (e.g. indiankanoon.org)."),
});

const CaseAnalysisOutputSchema = z.object({
  caseSummary: z.string().describe("A brief summary of the key facts and legal issues of the case."),
  strengths: z.array(z.string()).describe("A list of the main strengths of the user's case."),
  weaknesses: z.array(z.string()).describe("A list of the main weaknesses or risks in the user's case."),
  recommendedNextSteps: z.array(z.string()).describe("A roadmap of recommended next steps for the user to take."),
  potentialOutcomes: z.array(PotentialOutcomeSchema).describe("A list of potential outcomes with their probabilities."),
  similarCasePrecedents: z.array(SimilarCaseSchema).describe("A list of similar legal cases or precedents that might be relevant."),
  disclaimer: z.string().describe("A standard disclaimer that this is not legal advice."),
});
export type CaseAnalysisOutput = z.infer<typeof CaseAnalysisOutputSchema>;

export async function analyzeCase(input: CaseAnalysisInput): Promise<CaseAnalysisOutput> {
  return caseAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'caseAnalysisPrompt',
  input: {schema: CaseAnalysisInputSchema},
  output: {schema: CaseAnalysisOutputSchema},
  prompt: `You are an expert legal analyst AI. Your task is to provide a detailed, structured analysis of a legal case in the user's specified language.

  Analyze the following case details:
  {{{caseDetails}}}

  Provide your entire response in {{language}}.

  Your analysis must include:
  1.  A concise summary of the case.
  2.  The key strengths of the case.
  3.  The key weaknesses and risks.
  4.  A roadmap of recommended next steps for the user.
  5.  At least two potential outcomes with estimated probabilities. Sort them from most to least likely.
  6.  A list of 2-3 potentially relevant (but not necessarily binding) similar cases or legal precedents for informational purposes. Include valid URLs to these cases (e.g., on Indian Kanoon) or relevant articles if available.
  7.  A standard disclaimer that this is not legal advice and a professional lawyer should be consulted.

  Structure your output exactly according to the provided JSON schema.
  `,
});

const caseAnalysisFlow = ai.defineFlow(
  {
    name: 'caseAnalysisFlow',
    inputSchema: CaseAnalysisInputSchema,
    outputSchema: CaseAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to get a valid analysis from the AI model.');
    }
    // Ensure the disclaimer is consistent, regardless of what the model generates for it.
    const disclaimerText: Record<string, string> = {
        English: "This analysis is AI-generated, for informational purposes only, and does not constitute legal advice. You should consult with a qualified lawyer for professional advice on your specific situation.",
        Hindi: "यह विश्लेषण एआई-जनरेटेड है, केवल सूचनात्मक उद्देश्यों के लिए है, और कानूनी सलाह का गठन नहीं करता है। आपको अपनी विशिष्ट स्थिति पर पेशेवर सलाह के लिए एक योग्य वकील से परामर्श करना चाहिए।",
        Marathi: "हे विश्लेषण AI-व्युत्पन्न आहे, केवळ माहितीच्या उद्देशाने आहे आणि कायदेशीर सल्ला देत नाही. आपण आपल्या विशिष्ट परिस्थितीवर व्यावसायिक सल्ल्यासाठी पात्र वकीलाचा सल्ला घ्यावा.",
    };
    const lang = input.language as keyof typeof disclaimerText;
    output.disclaimer = disclaimerText[lang] || disclaimerText['English'];

    // Sort outcomes by probability, descending
    output.potentialOutcomes.sort((a, b) => b.probability - a.probability);

    return output;
  }
);
