'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CircleDashed, ScrollText, FileText, BrainCircuit } from 'lucide-react';

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
import { findPrecedents, FindPrecedentsOutput } from '@/ai/flows/legal-research';
import { useLanguage } from '@/hooks/use-language';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const formSchema = z.object({
  caseDescription: z.string().min(50, { message: 'Case description must be at least 50 characters.' }),
});

export default function LegalResearchPage() {
  const [result, setResult] = useState<FindPrecedentsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caseDescription: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const outcome = await findPrecedents({
        caseDescription: values.caseDescription,
      });
      setResult(outcome);
    } catch (error) {
      console.error('Error finding precedents:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to find precedents. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">{t('legalResearch.title')}</CardTitle>
          <CardDescription>
            {t('legalResearch.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="caseDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('legalResearch.caseDescriptionLabel')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('legalResearch.caseDescriptionPlaceholder')}
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading && <CircleDashed className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? t('legalResearch.loading') : t('legalResearch.submitButton')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {isLoading && (
        <Card className="shadow-sm animate-fade-in">
             <CardHeader>
                <CardTitle className="font-headline">{t('legalResearch.resultsTitle')}</CardTitle>
             </CardHeader>
            <CardContent className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </CardContent>
        </Card>
      )}

      {result && (
        <Card className="shadow-sm animate-fade-in">
            <CardHeader>
                <CardTitle className="font-headline">{t('legalResearch.resultsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <BrainCircuit className="w-6 h-6 text-primary" />
                            <CardTitle className="font-headline text-lg">{t('legalResearch.analysisTitle')}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{result.analysis}</p>
                    </CardContent>
                </Card>
                
                <div>
                  <h3 className="text-lg font-headline flex items-center gap-3 mb-4">
                    <FileText className="w-6 h-6 text-primary" />
                    {t('legalResearch.precedentsTitle')}
                  </h3>
                  <Accordion type="single" collapsible className="w-full">
                    {result.precedents.map((precedent, index) => (
                      <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger className="font-semibold">{precedent.caseName}</AccordionTrigger>
                        <AccordionContent className="space-y-2">
                           <p className="text-sm text-muted-foreground">{precedent.summary}</p>
                           <p className="text-xs font-mono bg-muted p-2 rounded-md">{precedent.citation}</p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>

            </CardContent>
        </Card>
      )}
    </div>
  );
}
