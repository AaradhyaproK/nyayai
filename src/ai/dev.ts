'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/document-summarization.ts';
import '@/ai/flows/multilingual-legal-assistance.ts';
import '@/ai/flows/legal-research.ts';
import '@/ai/flows/bail-predictor.ts';
import '@/ai/flows/case-analysis.ts';
