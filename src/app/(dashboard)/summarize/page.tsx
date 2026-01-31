'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { BookText, CircleDashed, Scale, Calendar, Users, Sword, HelpCircle, UploadCloud, FileText, CheckCircle2 } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from '@/hooks/use-language';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

// ==============================================================================
// 1. INTELLIGENT LEGAL ENGINE (Ported from Python)
// ==============================================================================

// Helper for sentence splitting (Approximating Spacy's doc.sents)
function splitSentences(text: string): string[] {
    return text.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g)?.map(s => s.trim()) || [];
}

class RealWorldLegalExtractor {
    extractHeaderInfo(text: string) {
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        const meta = {
            court: "Unknown Court",
            petitioner: "Unknown",
            respondent: "Unknown",
            date: "Unknown",
            caseId: "Unknown"
        };

        // A. Extract Court (Look in first 20 lines)
        const headerText = lines.slice(0, 20).join('\n');
        const courtMatch = headerText.match(/(IN THE SUPREME COURT|IN THE HIGH COURT|DISTRICT COURT|BEFORE THE).{0,50}/i);
        if (courtMatch) {
            meta.court = courtMatch[0].replace(/[\r\n]+/g, ' ').trim();
        }

        // B. Extract Parties (The 'VERSUS' Strategy)
        let vsIndex = -1;
        for (let i = 0; i < Math.min(lines.length, 50); i++) {
            if (/^\s*(VERSUS|Vs\.?|V\/s|V\.|AGAINST)\s*$/i.test(lines[i]) || /\b(VERSUS|Vs\.?|V\/s|V\.|AGAINST)\b/i.test(lines[i])) {
                vsIndex = i;
                break;
            }
        }

        if (vsIndex !== -1) {
            // Petitioner is usually 1-2 non-empty lines ABOVE 'Versus'
            for (let i = vsIndex - 1; i >= 0; i--) {
                const line = lines[i].trim();
                // Skip lines that are just dots or symbols
                if (/^[\.\-_]+$/.test(line)) continue;

                if (line.length > 2 && !/^(BETWEEN|AND|IN THE|CIVIL (APPEAL|WRIT|REVISION|SUIT)|CRIMINAL (APPEAL|WRIT|REVISION)|SLP|NO\.|CASE NO)/i.test(line)) {
                    let cleaned = line;
                    // Remove suffix label (e.g. "Name ... Petitioner")
                    cleaned = cleaned.replace(/(\.\.\.|…)?\s*(Appellants?|Petitioners?|Plaintiff|Complainant|Applicant)\s*$/i, "");
                    // Remove prefix label (e.g. "Petitioner: Name")
                    cleaned = cleaned.replace(/^\s*(The\s+)?(Appellants?|Petitioners?|Plaintiff|Complainant|Applicant)\s*[:\-]?\s*/i, "");
                    
                    cleaned = cleaned.replace(/[\.\-_]+$/, "").trim();
                    if (cleaned.length > 2) {
                        meta.petitioner = cleaned;
                        break;
                    }
                }
            }
            // Respondent is usually 1-2 non-empty lines BELOW 'Versus'
            for (let i = vsIndex + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                // Skip lines that are just dots or symbols
                if (/^[\.\-_]+$/.test(line)) continue;

                if (line.length > 2 && !/^(AND|THROUGH|CORAM|BEFORE)/i.test(line)) {
                    let cleaned = line;
                    // Remove suffix label
                    cleaned = cleaned.replace(/(\.\.\.|…)?\s*(Respondents?|Defendants?|State|Opposite Party)\s*$/i, "");
                    // Remove prefix label
                    cleaned = cleaned.replace(/^\s*(The\s+)?(Respondents?|Defendants?|State|Opposite Party)\s*[:\-]?\s*/i, "");

                    cleaned = cleaned.replace(/[\.\-_]+$/, "").trim();
                    if (cleaned.length > 2) {
                        meta.respondent = cleaned;
                        break;
                    }
                }
            }
        }

        // C. Extract Date
        const dateMatch = text.match(/(?:Date of Judgment|Dated|Date|Decided on)\s*[:\-]?\s*(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s*,?\s*\d{4}|\d{1,2}[./-]\d{1,2}[./-]\d{4})/i);
        if (dateMatch) {
            meta.date = dateMatch[1];
        } else {
            // Fallback Date Regex
            const genericDate = text.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{4})\b/);
            if (genericDate) meta.date = genericDate[1];
        }

        // D. Extract Case ID
        const caseMatch = headerText.match(/(Criminal Appeal|Civil Appeal|SLP|FIR|Writ Petition|Case)\s*(No\.|Number)?\s*[\w\d\s/]+/i);
        if (caseMatch) {
            meta.caseId = caseMatch[0].trim();
        }

        return meta;
    }

    extractCleanLaws(text: string) {
        // Regex captures: Section Number + Act Name
        const pattern = /(?:Section|Sec\.|u\/s)\s*(\d+[A-Z]*)\s*(?:of\s+the\s+)?([A-Z][a-zA-Z\.\s\(\)]+)/gi;
        const matches = Array.from(text.matchAll(pattern));
        
        const laws = new Set<string>();
        const actMap: Record<string, string> = {
            "Indian Penal Code": "IPC",
            "Code of Criminal Procedure": "CrPC",
            "Indian Evidence Act": "Evidence Act",
            "Constitution of India": "Constitution"
        };

        for (const match of matches) {
            let act = match[2].trim();
            const sec = match[1];

            // Remove trailing dots or punctuation from Act name
            act = act.replace(/[\.\s]+$/, "");

            // Normalize Act Name
            for (const [fullName, shortName] of Object.entries(actMap)) {
                if (act.toLowerCase().includes(fullName.toLowerCase())) {
                    act = shortName;
                    break;
                }
            }

            // Filter garbage
            if (act.length > 3 && act.length < 40 && (act.includes("Act") || ["IPC", "CrPC", "Constitution"].includes(act))) {
                laws.add(`${act} Sec ${sec}`);
            }
        }
        return Array.from(laws).sort();
    }

    intelligentStructure(text: string) {
        const structure: { facts: string[], issues: string[], arguments: string[] } = {
            facts: [],
            issues: [],
            arguments: []
        };

        // Pre-processing: Split by logical segments (numbered lists)
        const segments = text.replace(/(\n\d+\.\s)/g, '__SPLIT__$1').split('__SPLIT__');
        
        const allSentences: string[] = [];
        segments.forEach(seg => {
            allSentences.push(...splitSentences(seg));
        });

        for (const sent of allSentences) {
            const lower = sent.toLowerCase();
            
            // 1. ISSUE DETECTION
            if (sent.includes("?") || ["whether", "question of law", "issue for consideration"].some(x => lower.includes(x))) {
                if (sent.length > 20) {
                    const cleanSent = sent.replace(/^\d+\.\s*/, ""); // Remove number bullets
                    structure.issues.push(cleanSent);
                }
            }
            // 2. ARGUMENT DETECTION
            else if (["argued", "submitted", "contended", "learned counsel", "vehemently"].some(x => lower.includes(x))) {
                structure.arguments.push(sent);
            }
            // 3. FACT DETECTION
            else if (structure.facts.length < 8) {
                if (["filed", "incident", "occurred", "registered", "stated", "alleged"].some(x => lower.includes(x))) {
                    structure.facts.push(sent);
                }
            }
        }
        return structure;
    }

    process(text: string) {
        const meta = this.extractHeaderInfo(text);
        const laws = this.extractCleanLaws(text);
        const struct = this.intelligentStructure(text);
        return { meta, laws, struct };
    }
}

const engine = new RealWorldLegalExtractor();

// ==============================================================================
// 2. REACT COMPONENT
// ==============================================================================

const formSchema = z.object({
  documentContent: z
    .string()
    .min(50, { message: 'Document content must be at least 50 characters.' }),
});

type AnalysisResult = ReturnType<typeof engine.process>;

export default function DocumentSummarizationPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentContent: '',
    },
  });

  const { setValue } = form;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a PDF file.',
      });
      return;
    }

    setFileName(file.name);
    setIsParsing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const typedArray = new Uint8Array(arrayBuffer);
      const pdf = await pdfjs.getDocument({ 
        data: typedArray,
        cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
        cMapPacked: true,
      }).promise;
      
      const pageTexts = await Promise.all(
        Array.from({ length: pdf.numPages }, (_, i) => i + 1).map(async (pageNumber) => {
          const page = await pdf.getPage(pageNumber);
          const textContent = await page.getTextContent();
          return textContent.items.map((item: any) => item.str).join('\n');
        })
      );
      
      const fullText = pageTexts.join('\n\n');
      setValue('documentContent', fullText, { shouldValidate: true });
      toast({
        title: "PDF Processed",
        description: "The document content has been extracted from the PDF.",
      });
    } catch (error) {
      console.error('Error parsing PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Error Parsing PDF',
        description: 'Could not read the content of the PDF file. Please try again or paste the content manually.',
      });
    } finally {
      setIsParsing(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      // Simulate a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      const analysis = engine.process(values.documentContent);
      setResult(analysis);
    } catch (error) {
      console.error('Error analyzing document:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to analyze the document. Please try again.",
      })
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-0 pb-12 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4 pt-4">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary">
          {t('summarize.title')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('summarize.subtitle')}
        </p>
      </div>

      {/* Input Card */}
      <Card className="shadow-lg border-muted/40 overflow-hidden">
        <div className="bg-muted/30 p-6 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookText className="w-5 h-5 text-primary" />
                {t('summarize.uploadTitle')}
            </h2>
        </div>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormItem>
                    <FormLabel className="text-base font-medium">{t('summarize.uploadLabel')}</FormLabel>
                    <div className="mt-2">
                        <label
                            htmlFor="file-upload"
                            className="flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 px-6 py-10 hover:bg-muted/50 transition-colors cursor-pointer relative bg-background group"
                        >
                            <div className="text-center space-y-2">
                                <div className="mx-auto h-12 w-12 text-gray-400 group-hover:text-primary transition-colors">
                                    {isParsing ? <CircleDashed className="h-12 w-12 animate-spin" /> : <UploadCloud className="h-12 w-12" />}
                                </div>
                                <div className="flex text-sm leading-6 text-gray-600 dark:text-gray-400 justify-center">
                                    <span className="font-semibold text-primary hover:text-primary/80">
                                        {fileName ? 'Change file' : 'Upload a file'}
                                    </span>
                                    <span className="pl-1">or drag and drop</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">PDF up to 10MB</p>
                                {fileName && (
                                    <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium mt-2 bg-green-50 dark:bg-green-900/20 py-1 px-3 rounded-full">
                                        <CheckCircle2 className="w-4 h-4" />
                                        {fileName}
                                    </div>
                                )}
                            </div>
                            <Input 
                                id="file-upload"
                                type="file" 
                                accept="application/pdf" 
                                onChange={handleFileChange}
                                disabled={isParsing || isLoading}
                                className="sr-only" 
                            />
                        </label>
                    </div>
                    <FormMessage />
                  </FormItem>

                  <FormField
                    control={form.control}
                    name="documentContent"
                    render={({ field }) => (
                      <FormItem className="flex flex-col h-full">
                        <FormLabel className="text-base font-medium">{t('summarize.orPaste')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('summarize.placeholder')}
                            className="flex-1 min-h-[200px] font-mono text-xs resize-none mt-2 bg-background"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
              
              <Button type="submit" size="lg" disabled={isLoading || isParsing} className="w-full text-lg font-semibold h-12 shadow-md transition-all hover:scale-[1.01]">
                {(isLoading || isParsing) && <CircleDashed className="mr-2 h-5 w-5 animate-spin" />}
                {isLoading ? t('summarize.analyzing') : t('summarize.analyzeBtn')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Results Section */}
      {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-center pb-4">
                <div className="h-1 w-24 bg-primary/20 rounded-full"></div>
            </div>

            {/* Case Header Card */}
            <Card className="overflow-hidden border-t-4 border-t-primary shadow-xl">
                <div className="bg-primary/5 p-6 text-center border-b">
                    <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">{result.meta.court}</h2>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-muted-foreground">
                        <span className="bg-background px-3 py-1 rounded-full border shadow-sm">{result.meta.caseId}</span>
                        <span className="hidden md:inline text-primary/30">•</span>
                        <span className="flex items-center gap-1 bg-background px-3 py-1 rounded-full border shadow-sm"><Calendar className="w-4 h-4"/> {result.meta.date}</span>
                    </div>
                </div>
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex-1 text-center w-full">
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Petitioner</div>
                            <div className="font-serif text-xl md:text-2xl font-semibold text-slate-800 dark:text-slate-100 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border-l-4 border-blue-500 shadow-sm">
                                {result.meta.petitioner}
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center shrink-0">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-black text-muted-foreground text-xs shadow-inner">VS</div>
                        </div>
                        <div className="flex-1 text-center w-full">
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Respondent</div>
                            <div className="font-serif text-xl md:text-2xl font-semibold text-slate-800 dark:text-slate-100 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border-l-4 border-red-500 shadow-sm">
                                {result.meta.respondent}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Applicable Laws - Left Column */}
                <Card className="md:col-span-1 shadow-md h-full">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Scale className="w-5 h-5 text-primary" />
                            Applicable Laws
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap gap-2">
                            {result.laws.length > 0 ? (
                                result.laws.map((law, i) => (
                                    <span key={i} className="inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
                                        {law}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-muted-foreground italic">No specific sections detected.</span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Facts - Right Column (Span 2) */}
                <Card className="md:col-span-2 shadow-md h-full">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BookText className="w-5 h-5 text-green-600" />
                            Brief Facts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ul className="space-y-3">
                            {result.struct.facts.length > 0 ? (
                                result.struct.facts.map((fact, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                                        <span>{fact}</span>
                                    </li>
                                ))
                            ) : (
                                <li className="text-sm text-muted-foreground italic">Insufficient data to extract facts.</li>
                            )}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Issues & Arguments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-md border-t-4 border-t-purple-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 text-purple-700 dark:text-purple-400">
                            <HelpCircle className="w-5 h-5" />
                            Legal Issues
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <ul className="space-y-3">
                            {result.struct.issues.length > 0 ? (
                                result.struct.issues.map((issue, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-muted-foreground bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg">
                                        <span className="font-bold text-purple-500">?</span>
                                        <span>{issue}</span>
                                    </li>
                                ))
                            ) : (
                                <li className="text-sm text-muted-foreground italic">No explicit issues found.</li>
                            )}
                        </ul>
                    </CardContent>
                </Card>

                <Card className="shadow-md border-t-4 border-t-orange-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 text-orange-700 dark:text-orange-400">
                            <Users className="w-4 h-4" /> Key Arguments
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <ul className="space-y-3">
                             {result.struct.arguments.length > 0 ? (
                                result.struct.arguments.slice(0, 5).map((arg, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                                        <Sword className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                                        <span>{arg}</span>
                                    </li>
                                ))
                            ) : (
                                <li className="text-sm text-muted-foreground italic">No explicit arguments found.</li>
                            )}
                        </ul>
                    </CardContent>
                </Card>
            </div>
          </div>
      )}
    </div>
  );
}
