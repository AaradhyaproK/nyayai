'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase/provider';
import { useUser } from '@/firebase/auth/use-user';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/use-language';

interface Case {
  id: string;
  description: string;
  status: 'pending' | 'active' | 'closed';
  userDisplayName: string;
  lawyerDisplayName: string;
  userId: string;
  lawyerId: string;
  createdAt: any;
}

export default function MyCasesPage() {
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    async function fetchCases() {
      if (!firestore || !user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const asClientQuery = query(collection(firestore, 'cases'), where('userId', '==', user.uid));
        const asLawyerQuery = query(collection(firestore, 'cases'), where('lawyerId', '==', user.uid));
        
        const [clientSnaps, lawyerSnaps] = await Promise.all([
          getDocs(asClientQuery),
          getDocs(asLawyerQuery),
        ]);

        const allCases: Case[] = [];
        const caseIds = new Set<string>();

        const processSnap = (snap: any) => {
          snap.forEach((doc: any) => {
            if (!caseIds.has(doc.id)) {
              allCases.push({ id: doc.id, ...doc.data() } as Case);
              caseIds.add(doc.id);
            }
          });
        };

        processSnap(clientSnaps);
        processSnap(lawyerSnaps);
        
        allCases.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());

        setCases(allCases);
      } catch (error) {
        console.error("Error fetching cases:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!userLoading) {
      fetchCases();
    }
  }, [firestore, user, userLoading]);

  if (loading || userLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {cases.length === 0 ? (
        <Card className="text-center py-16">
          <CardHeader>
            <div className="mx-auto bg-muted p-3 rounded-full w-fit">
              <Briefcase className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle className="font-headline mt-4">{t('myCasesPage.noCases')}</CardTitle>
            <CardDescription>{t('myCasesPage.noCasesDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
                <Link href="/ai-judge">{t('myCasesPage.startAnalysis')}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {cases.map((caseItem) => (
            <Card key={caseItem.id} className="shadow-sm">
              <CardHeader className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-start gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <CardTitle className="font-headline text-lg">
                      {t('myCasesPage.caseWith', { name: user?.uid === caseItem.userId ? caseItem.lawyerDisplayName : caseItem.userDisplayName })}
                    </CardTitle>
                    <Badge variant={caseItem.status === 'active' ? 'default' : caseItem.status === 'pending' ? 'secondary' : 'outline'}>{t(`myCasesPage.status.${caseItem.status}`)}</Badge>
                  </div>
                  <CardDescription className="mt-2 line-clamp-2">{caseItem.description}</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-2 md:mt-0 ml-auto">
                    <Link href={`/my-cases/${caseItem.id}`}>
                        {t('myCasesPage.viewCase')} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
