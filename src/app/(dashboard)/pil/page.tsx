'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Megaphone, AlertTriangle, CheckCircle, FileText, Scale, TrendingUp, Briefcase, Info, Users, Gavel } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { analyzePil, PilAnalysisOutput } from '@/ai/flows/pil-analysis';

export default function NewPilPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const currentLanguage = t('languageName');

  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [reliefSought, setReliefSought] = useState('');
  const [affectedPopulation, setAffectedPopulation] = useState('');
  const [courtLevel, setCourtLevel] = useState('');
  const [petitionerType, setPetitionerType] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PilAnalysisOutput | null>(null);

  const handleAnalyze = async () => {
    if (!topic.trim()) {
      toast({ variant: "destructive", title: "Required", description: "Please describe the PIL topic." });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const output = await analyzePil({
        topic,
        description,
        reliefSought,
        affectedPopulation,
        courtLevel: courtLevel || undefined,
        petitionerType: petitionerType || undefined,
        language: currentLanguage,
      });
      setResult(output);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Failed to analyze PIL. Please try again." });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const probabilityData = result
    ? [{ name: 'Acceptance', value: result.acceptanceRate }, { name: 'Rejection', value: 1 - result.acceptanceRate }]
    : [];
  const COLORS = ['#4CAF50', '#ECEFF1']; // Green for acceptance, Gray for rest

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 pb-12">
      <div className="flex flex-col gap-3 text-center py-4">
        <h1 className="text-4xl font-headline font-bold text-primary">{t('pilAnalysis.title')}</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">{t('pilAnalysis.description')}</p>
      </div>

      {/* Input Section - Full Width & Horizontal Layout */}
      <Card className="shadow-lg border-t-4 border-t-primary bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            {t('pilAnalysis.topicLabel')}
          </CardTitle>
          <CardDescription>Provide detailed information to get the most accurate AI prediction.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label className="font-semibold text-base">
                 {t('pilAnalysis.topicLabel')} <span className="text-red-500">*</span>
              </Label>
              <Input 
                placeholder={t('pilAnalysis.topicPlaceholder')} 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="text-base p-4 md:text-lg md:p-6"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label className="font-semibold flex items-center gap-2 text-base">
                <Info className="w-4 h-4 text-primary" /> {t('pilAnalysis.descriptionLabel')}
              </Label>
              <Textarea 
                placeholder={t('pilAnalysis.descriptionPlaceholder')} 
                className="min-h-[120px] text-base p-4 resize-y"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold flex items-center gap-2">
                <Gavel className="w-4 h-4 text-primary" /> {t('pilAnalysis.reliefLabel')}
              </Label>
              <Input 
                placeholder={t('pilAnalysis.reliefPlaceholder')} 
                value={reliefSought}
                onChange={(e) => setReliefSought(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> {t('pilAnalysis.affectedLabel')}
              </Label>
              <Input 
                placeholder={t('pilAnalysis.affectedPlaceholder')} 
                value={affectedPopulation}
                onChange={(e) => setAffectedPopulation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">{t('pilAnalysis.courtLabel')}</Label>
                <Select value={courtLevel} onValueChange={setCourtLevel}>
                    <SelectTrigger><SelectValue placeholder="Select Court" /></SelectTrigger>
                    <SelectContent>
                    <SelectItem value="Supreme Court">Supreme Court</SelectItem>
                    <SelectItem value="High Court">High Court</SelectItem>
                    <SelectItem value="District Court">District Court</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">{t('pilAnalysis.petitionerLabel')}</Label>
                <Select value={petitionerType} onValueChange={setPetitionerType}>
                    <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                    <SelectContent>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="NGO">NGO</SelectItem>
                    <SelectItem value="Group">Group</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button className="w-full md:w-auto md:px-12 py-6 text-lg shadow-lg hover:shadow-xl transition-all" onClick={handleAnalyze} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <TrendingUp className="mr-2 h-5 w-5 animate-spin" />
                  {t('pilAnalysis.analyzing')}
                </>
              ) : (
                <>
                  <Scale className="mr-2 h-5 w-5" />
                  {t('pilAnalysis.analyzeButton')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <div className="space-y-8">
          {isAnalyzing && <Skeleton className="w-full h-96 rounded-xl" />}
          
          {!isAnalyzing && !result && (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/30">
              <Megaphone className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg">Enter details above to generate an AI analysis.</p>
            </div>
          )}

          {result && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Acceptance Rate Chart */}
                  <Card className="lg:col-span-1 border-t-4 border-t-green-500 shadow-md flex flex-col">
                    <CardHeader className="pb-2">
                      <CardTitle className="font-headline flex items-center gap-2 text-lg">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        {t('pilAnalysis.acceptanceRate')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center min-h-[250px] relative">
                        <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={probabilityData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            startAngle={180}
                            endAngle={0}
                            paddingAngle={0}
                            dataKey="value"
                            stroke="none"
                          >
                            {probabilityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute top-2/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                        <span className="text-3xl font-bold font-headline text-primary">
                          {(result.acceptanceRate * 100).toFixed(0)}%
                        </span>
                        <p className="text-xs text-muted-foreground">{t('pilAnalysis.acceptanceRate')}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Analysis Text */}
                  <Card className="lg:col-span-2 shadow-md border-t-4 border-t-blue-500">
                    <CardHeader>
                      <CardTitle className="font-headline flex items-center gap-2">
                        <Scale className="h-5 w-5 text-blue-600" />
                        {t('pilAnalysis.resultsTitle')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">
                        {result.analysis}
                      </p>
                    </CardContent>
                  </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-headline text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      {t('pilAnalysis.tips')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.improvementTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-headline text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      {t('pilAnalysis.documents')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {result.requiredDocuments.map((doc, i) => (
                        <li key={i}>{doc}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="font-headline text-base flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    {t('pilAnalysis.lawyers')}
                  </CardTitle>
                  <CardDescription>
                    Based on your topic, we recommend consulting lawyers with these specializations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {result.recommendedLawyerSpecializations.map((spec, i) => (
                      <span key={i} className="px-3 py-1 bg-background border rounded-full text-sm font-medium">
                        {spec}
                      </span>
                    ))}
                  </div>
                  <Button onClick={() => router.push('/lawyers')} variant="default">
                    {t('pilAnalysis.findLawyersButton')}
                  </Button>
                </CardContent>
              </Card>

              <Alert variant="default" className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <AlertTitle className="font-headline text-yellow-700">Disclaimer</AlertTitle>
                <AlertDescription className="text-yellow-600 text-sm">
                  {result.disclaimer}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>
    
  );
}
