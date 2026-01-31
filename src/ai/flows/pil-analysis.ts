'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PilAnalysisInputSchema = z.object({
  topic: z.string().describe('The main topic or issue for the Public Interest Litigation.'),
  description: z.string().optional().describe('Detailed facts and context about the issue.'),
  reliefSought: z.string().optional().describe('What specific outcome or relief is being sought from the court.'),
  affectedPopulation: z.string().optional().describe('Description of the group or population affected by this issue.'),
  courtLevel: z.string().optional().describe('The court level (e.g., Supreme Court, High Court).'),
  petitionerType: z.string().optional().describe('Type of petitioner (e.g., Individual, NGO).'),
  language: z.string().describe('The language for the response.'),
});

export type PilAnalysisInput = z.infer<typeof PilAnalysisInputSchema>;

const PilAnalysisOutputSchema = z.object({
  analysis: z.string().describe("A detailed analysis of the PIL's viability and public interest nature."),
  acceptanceRate: z.number().min(0).max(1).describe("Estimated probability of acceptance by the court (0.0 to 1.0)."),
  improvementTips: z.array(z.string()).describe("Specific, actionable tips to improve the chances of the PIL being admitted."),
  requiredDocuments: z.array(z.string()).describe("List of documents or evidence typically required for this type of PIL."),
  recommendedLawyerSpecializations: z.array(z.string()).describe("Types of lawyers (e.g., Environmental, Constitutional) best suited for this case."),
  relevantPrecedents: z.array(z.string()).describe("Names or citations of relevant past PIL cases."),
  disclaimer: z.string().describe("Legal disclaimer."),
});

export type PilAnalysisOutput = z.infer<typeof PilAnalysisOutputSchema>;

export async function analyzePil(input: PilAnalysisInput): Promise<PilAnalysisOutput> {
  return pilAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'pilAnalysisPrompt',
  input: {schema: PilAnalysisInputSchema},
  output: {schema: PilAnalysisOutputSchema},
  prompt: `You are an expert legal consultant specializing in Public Interest Litigations (PIL) in India.
  Analyze the following PIL proposal:
  Topic: {{topic}}
  {{#if description}}Details: {{description}}{{/if}}
  {{#if reliefSought}}Relief Sought: {{reliefSought}}{{/if}}
  {{#if affectedPopulation}}Affected Population: {{affectedPopulation}}{{/if}}
  {{#if courtLevel}}Target Court: {{courtLevel}}{{/if}}
  {{#if petitionerType}}Petitioner Type: {{petitionerType}}{{/if}}

  Provide the response in {{language}}.

  1. Analyze the viability of this PIL. Is it a genuine public interest issue? Does the petitioner have locus standi?
  2. Estimate the acceptance rate (0.0 to 1.0) based on current judicial trends for similar issues.
  3. Provide actionable tips to improve the acceptance rate (e.g., gathering specific evidence, exhausting other remedies first).
  4. List required documents.
  5. Recommend lawyer specializations that would be best for this specific topic.
  6. Cite relevant precedents if possible.
  7. Include a standard disclaimer that this is AI-generated information and not legal advice.
  `,
});

const pilAnalysisFlow = ai.defineFlow(
  {
    name: 'pilAnalysisFlow',
    inputSchema: PilAnalysisInputSchema,
    outputSchema: PilAnalysisOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate PIL analysis.');
    }
    
    // Localized disclaimer fallback to ensure safety
    const disclaimerText: Record<string, string> = {
        English: "This analysis is AI-generated for informational purposes only. PIL acceptance depends on many factors. Consult a qualified lawyer.",
        Hindi: "यह विश्लेषण केवल सूचनात्मक उद्देश्यों के लिए एआई-जनित है। पीआईएल की स्वीकृति कई कारकों पर निर्भर करती है। एक योग्य वकील से परामर्श करें।",
        Marathi: "हे विश्लेषण केवळ माहितीच्या उद्देशाने AI-व्युत्पन्न आहे. जनहित याचिका स्वीकारणे अनेक घटकांवर अवलंबून असते. पात्र वकीलाचा सल्ला घ्या.",
    };
    const lang = input.language as keyof typeof disclaimerText;
    output.disclaimer = disclaimerText[lang] || disclaimerText['English'];

    return output;
  }
);