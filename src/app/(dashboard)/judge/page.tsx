'use client';

import { useMemo } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useUser } from '@/firebase/auth/use-user';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Gavel, Plus, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CaseData {
  id: string;
  title: string;
  status: 'active' | 'pending' | 'closed';
  type: string;
  clientName?: string;
  lawyerName?: string;
  opposingLawyerName?: string;
  judgeId?: string;
  createdAt?: any;
}

export default function JudgeDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const { data: cases, loading } = useCollection<CaseData>('cases');

  const myCases = useMemo(() => {
    if (!user) return [];
    return cases.filter(c => c.judgeId === user.uid);
  }, [cases, user]);

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-0 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Judge Dashboard</h1>
          <p className="text-muted-foreground">Manage your court docket and assigned cases.</p>
        </div>
        <Button onClick={() => router.push('/judge/file-case')}>
            <Plus className="w-4 h-4 mr-2" /> File New Case
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned Cases</CardTitle>
                <Gavel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{myCases.length}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Hearings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{myCases.filter(c => c.status === 'active').length}</div>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Case Docket</CardTitle>
            <CardDescription>Cases assigned to your bench.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50">
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Case Title</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Plaintiff Lawyer</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Defense Lawyer</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {myCases.map(c => (
                            <tr key={c.id} className="border-b transition-colors hover:bg-muted/50">
                                <td className="p-4 align-middle font-medium">{c.title}</td>
                                <td className="p-4 align-middle">{c.type}</td>
                                <td className="p-4 align-middle"><Badge variant={c.status === 'active' ? 'default' : 'secondary'}>{c.status}</Badge></td>
                                <td className="p-4 align-middle">{c.lawyerName}</td>
                                <td className="p-4 align-middle">{c.opposingLawyerName || 'N/A'}</td>
                                <td className="p-4 align-middle">
                                    <Button variant="ghost" size="sm" onClick={() => router.push(`/my-cases/${c.id}`)}>View</Button>
                                </td>
                            </tr>
                        ))}
                        {myCases.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No cases assigned.</td></tr>}
                    </tbody>
                </table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
