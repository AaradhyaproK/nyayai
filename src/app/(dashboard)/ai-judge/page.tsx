'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CircleDashed, Gavel, AlertTriangle, Users, CheckCircle, Star, MapPin, ListChecks, ShieldAlert, TrendingUp, FileText, Mic, MicOff } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { analyzeCase, CaseAnalysisOutput } from '@/ai/flows/case-analysis';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase/provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useLanguage } from '@/hooks/use-language';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';


const formSchema = z.object({
  caseDetails: z.string().min(50, { message: 'Case details must be at least 50 characters.' }),
  legalPrecedents: z.string().optional(),
});

interface Lawyer {
  id: string;
  displayName: string;
  specialization: string;
  experience: number;
  rating: number;
  ratingCount?: number;
  imageId: string;
  role: string;
  location: string;
  email?: string;
  contactNumber?: string;
}

interface UserProfile {
  location?: string;
}

export default function CaseAnalysisPage() {
  const [result, setResult] = useState<CaseAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStartingCase, setIsStartingCase] = useState<string | null>(null);
  const [listeningField, setListeningField] = useState<'caseDetails' | 'legalPrecedents' | null>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { data: userProfile } = useDoc<UserProfile>(user ? `users/${user.uid}` : '');
  const { t } = useLanguage();
  const currentLanguage = t('languageName');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
      }
    }
  }, []);

  const toggleListening = (fieldName: 'caseDetails' | 'legalPrecedents') => {
    if (!recognitionRef.current) {
      toast({ variant: "destructive", title: "Not Supported", description: "Speech recognition is not supported in this browser." });
      return;
    }

    if (listeningField === fieldName) {
      recognitionRef.current.stop();
      setListeningField(null);
    } else {
      if (listeningField) {
        recognitionRef.current.stop();
      }
      
      const langMap: Record<string, string> = { 'English': 'en-US', 'Hindi': 'hi-IN', 'Marathi': 'mr-IN' };
      recognitionRef.current.lang = langMap[currentLanguage] || 'en-US';
      
      recognitionRef.current.onstart = () => setListeningField(fieldName);
      recognitionRef.current.onend = () => setListeningField(null);
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
            const currentVal = form.getValues(fieldName) || '';
            const prefix = currentVal && !/\s$/.test(currentVal) ? ' ' : '';
            form.setValue(fieldName, currentVal + prefix + finalTranscript, { shouldDirty: true, shouldValidate: true });
        }
      };
      recognitionRef.current.start();
    }
  };

  const { data: allUsers, loading: lawyersLoading } = useCollection<Lawyer>('users');
  const lawyers = useMemo(() => allUsers.filter(u => u.role === 'lawyer'), [allUsers]);

  const recommendedLawyers = useMemo(() => {
    if (!lawyers.length || !userProfile?.location) {
        return lawyers;
    }
    const sortedLawyers = [...lawyers].sort((a, b) => {
        if (a.location === userProfile.location && b.location !== userProfile.location) {
            return -1;
        }
        if (a.location !== userProfile.location && b.location === userProfile.location) {
            return 1;
        }
        return b.rating - a.rating;
    });
    return sortedLawyers;
  }, [lawyers, userProfile]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caseDetails: '',
      legalPrecedents: '',
    },
  });

  const { getValues } = form;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const fullCaseDetails = values.legalPrecedents
        ? `${values.caseDetails}\n\nSupporting Documents/Precedents:\n${values.legalPrecedents}`
        : values.caseDetails;

      const outcome = await analyzeCase({
        caseDetails: fullCaseDetails,
        language: currentLanguage,
      });
      setResult(outcome);
    } catch (error) {
      console.error('Error analyzing case:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to analyze the case. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleStartCase = async (lawyer: Lawyer) => {
    if (!firestore || !user) return;
    setIsStartingCase(lawyer.id);
    try {
        const caseData = {
            userId: user.uid,
            lawyerId: lawyer.id,
            userDisplayName: user.displayName,
            lawyerDisplayName: lawyer.displayName,
            description: getValues("caseDetails"),
            status: 'pending',
            createdAt: serverTimestamp(),
            analysisReport: result ? JSON.stringify(result) : null,
        };
        const docRef = await addDoc(collection(firestore, 'cases'), caseData);
        toast({
            title: "Case Started!",
            description: `You have successfully started a case with ${lawyer.displayName}.`,
        });
        router.push(`/my-cases/${docRef.id}`);
    } catch (error) {
        console.error("Error starting case: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not start a case. Please try again.",
        });
    } finally {
        setIsStartingCase(null);
    }
  }

  const mostLikelyOutcome = result?.potentialOutcomes?.[0];
  const probabilityData = mostLikelyOutcome
    ? [{ name: 'Favorable', value: mostLikelyOutcome.probability }, { name: 'Unfavorable', value: 1 - mostLikelyOutcome.probability }]
    : [];

  const COLORS = ['hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <div className="space-y-8">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">{t('aiJudge.title')}</CardTitle>
          <CardDescription>{t('aiJudge.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="caseDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('aiJudge.caseDetailsLabel')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          placeholder={t('aiJudge.caseDetailsPlaceholder')}
                          className="min-h-[150px] pr-12"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn("absolute top-2 right-2 h-8 w-8", listeningField === 'caseDetails' && "text-red-500 animate-pulse")}
                          onClick={() => toggleListening('caseDetails')}
                          title="Speak to type"
                        >
                          {listeningField === 'caseDetails' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="legalPrecedents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('aiJudge.precedentsLabel')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          placeholder={t('aiJudge.precedentsPlaceholder')}
                          className="min-h-[100px] pr-12"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn("absolute top-2 right-2 h-8 w-8", listeningField === 'legalPrecedents' && "text-red-500 animate-pulse")}
                          onClick={() => toggleListening('legalPrecedents')}
                          title="Speak to type"
                        >
                          {listeningField === 'legalPrecedents' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading && <CircleDashed className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? t('aiJudge.loading') : t('aiJudge.submitButton')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {isLoading && (
        <Card className="shadow-sm animate-fade-in">
             <CardHeader>
                <div className="flex items-center gap-3">
                    <Gavel className="w-6 h-6 text-primary" />
                    <CardTitle className="font-headline">{t('aiJudge.loading')}</CardTitle>
                </div>
             </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                <Skeleton className="h-4 bg-muted rounded w-full animate-pulse" />
                <div className="h-32 bg-muted rounded animate-pulse mt-6"></div>
                <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
            </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-8 animate-fade-in">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">{t('aiJudge.resultsTitle')}</CardTitle>
                </CardHeader>
            </Card>

            <Card className="shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-primary" />
                        <CardTitle className="font-headline">{t('aiJudge.caseSummary')}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{result.caseSummary}</p>
                </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-6 h-6 text-green-500" />
                            <CardTitle className="font-headline">{t('aiJudge.strengths')}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {result.strengths.map((item, i) => <li key={i} className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" /> <span className="text-muted-foreground">{item}</span></li>)}
                        </ul>
                    </CardContent>
                </Card>
                 <Card className="shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <ShieldAlert className="w-6 h-6 text-yellow-500" />
                            <CardTitle className="font-headline">{t('aiJudge.weaknesses')}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {result.weaknesses.map((item, i) => <li key={i} className="flex items-start gap-3"><AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" /> <span className="text-muted-foreground">{item}</span></li>)}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                <div className="flex items-center gap-3">
                    <ListChecks className="w-6 h-6 text-primary" />
                    <CardTitle className="font-headline">{t('aiJudge.roadmap')}</CardTitle>
                </div>
                </CardHeader>
                <CardContent>
                    <ol className="space-y-3 list-decimal list-inside">
                        {result.recommendedNextSteps.map((item, i) => <li key={i} className="text-muted-foreground">{item}</li>)}
                    </ol>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {mostLikelyOutcome && (
                    <Card className="shadow-sm">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Gavel className="w-6 h-6 text-primary" />
                                <CardTitle className="font-headline">{t('aiJudge.potentialOutcome')}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            <div className="md:col-span-1 h-32 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={probabilityData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} fill="#8884d8" paddingAngle={5} dataKey="value">
                                    {probabilityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                    </Pie>
                                </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-2xl font-bold font-headline text-primary">
                                    {(mostLikelyOutcome.probability * 100).toFixed(0)}%
                                </span>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm text-muted-foreground">{mostLikelyOutcome.outcome}</p>
                            </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
                 <Card className="shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <FileText className="w-6 h-6 text-primary" />
                            <CardTitle className="font-headline">{t('aiJudge.similarCases')}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {result.similarCasePrecedents.map((precedent, index) => (
                            <AccordionItem value={`item-${index}`} key={index}>
                                <AccordionTrigger className="font-semibold text-sm">{precedent.caseName}</AccordionTrigger>
                                <AccordionContent className="space-y-2">
                                <p className="text-sm text-muted-foreground">{precedent.summary}</p>
                                <p className="text-xs font-mono bg-muted p-2 rounded-md">{precedent.citation}</p>
                                </AccordionContent>
                            </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            </div>

            <Alert variant="default" className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <AlertTitle className="font-headline text-yellow-700">{t('aiJudge.disclaimerTitle')}</AlertTitle>
                <AlertDescription className="text-yellow-600">
                    {result.disclaimer}
                </AlertDescription>
            </Alert>
            
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Users className="w-6 h-6 text-primary" />
                        <CardTitle className="font-headline">{t('aiJudge.recommendedLawyers')}</CardTitle>
                    </div>
                    <CardDescription>{t('aiJudge.recommendedLawyersDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    {lawyersLoading && [...Array(2)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
                    {recommendedLawyers.map(lawyer => {
                        const isStartingThisCase = isStartingCase === lawyer.id;

                        return (
                            <Card key={lawyer.id} className="shadow-sm p-4">
                                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                    <div className="flex-1 space-y-1">
                                        <p className="font-headline text-lg">{lawyer.displayName}</p>
                                        <p className="text-sm text-muted-foreground">{lawyer.specialization}</p>
                                        {lawyer.email && <p className="text-sm text-muted-foreground">{lawyer.email}</p>}
                                        {lawyer.contactNumber && <p className="text-sm text-muted-foreground">{lawyer.contactNumber}</p>}
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span>{lawyer.experience} yrs</span>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-400" /> 
                                                {lawyer.ratingCount ? Number(lawyer.rating).toFixed(1) : 'New'}
                                            </div>
                                            {lawyer.location && (
                                              <div className="flex items-center gap-1">
                                                  <MapPin className="w-3 h-3" /> {lawyer.location}
                                                  {lawyer.location === userProfile?.location && <span className="text-primary font-semibold">(Your District)</span>}
                                              </div>
                                            )}
                                        </div>
                                    </div>
                                    <Button size="sm" className="w-full sm:w-auto" onClick={() => handleStartCase(lawyer)} disabled={!!isStartingCase}>
                                        {isStartingThisCase ? <CircleDashed className="animate-spin" /> : 'Start Case'}
                                    </Button>
                                </div>
                            </Card>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
