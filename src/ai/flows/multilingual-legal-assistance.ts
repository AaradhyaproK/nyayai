'use server';
/**
 * @fileOverview A multilingual legal assistance chatbot flow.
 *
 * - multilingualLegalAssistance - A function that handles the multilingual legal assistance process.
 * - MultilingualLegalAssistanceInput - The input type for the multilingualLegalAssistance function.
 * - MultilingualLegalAssistanceOutput - The return type for the multilingualLegalAssistance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MultilingualLegalAssistanceInputSchema = z.object({
  query: z.string().describe('The user query for legal assistance.'),
  language: z.string().describe('The preferred language for the response.'),
  voice: z.boolean().optional().describe('Whether the response should be in voice format.'),
});
export type MultilingualLegalAssistanceInput = z.infer<typeof MultilingualLegalAssistanceInputSchema>;

const MultilingualLegalAssistanceOutputSchema = z.object({
  response: z.string().describe('The legal assistance response in the specified language.'),
  audio: z.string().optional().describe('The audio data of the response in WAV format, if voice is enabled.'),
});
export type MultilingualLegalAssistanceOutput = z.infer<typeof MultilingualLegalAssistanceOutputSchema>;

import wav from 'wav';

async function toWav(
    pcmData: Buffer,
    channels = 1,
    rate = 24000,
    sampleWidth = 2
): Promise<string> {
    return new Promise((resolve, reject) => {
        const writer = new wav.Writer({
            channels,
            sampleRate: rate,
            bitDepth: sampleWidth * 8,
        });

        let bufs = [] as any[];
        writer.on('error', reject);
        writer.on('data', function (d) {
            bufs.push(d);
        });
        writer.on('end', function () {
            resolve(Buffer.concat(bufs).toString('base64'));
        });

        writer.write(pcmData);
        writer.end();
    });
}

export async function multilingualLegalAssistance(input: MultilingualLegalAssistanceInput): Promise<MultilingualLegalAssistanceOutput> {
  return multilingualLegalAssistanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'multilingualLegalAssistancePrompt',
  input: {schema: MultilingualLegalAssistanceInputSchema},
  output: {schema: MultilingualLegalAssistanceOutputSchema},
  prompt: `You are a multilingual legal assistant chatbot. A user will ask a question in any language, and you will provide helpful legal information in the language they requested.

  User Query: {{{query}}}
  Preferred Language: {{{language}}}

  Respond in a concise and informative manner.  If the user asks for something that is not related to law or the justice system respond with 'I cannot help you with that.'`,
});

const multilingualLegalAssistanceFlow = ai.defineFlow(
  {
    name: 'multilingualLegalAssistanceFlow',
    inputSchema: MultilingualLegalAssistanceInputSchema,
    outputSchema: MultilingualLegalAssistanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);

    if (input.voice) {
      const ttsResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash-preview-tts',
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' },
            },
          },
        },
        prompt: output?.response ?? ''
      });

      if (!ttsResponse.media) {
        throw new Error('no media returned');
      }
      const audioBuffer = Buffer.from(
          ttsResponse.media.url.substring(ttsResponse.media.url.indexOf(',') + 1),
          'base64'
      );

      const audio = 'data:audio/wav;base64,' + (await toWav(audioBuffer));

      return {
        response: output?.response ?? '',
        audio: audio,
      };
    }

    return {
      response: output?.response ?? '',
    };
  }
);

