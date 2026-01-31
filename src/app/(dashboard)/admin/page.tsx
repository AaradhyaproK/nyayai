'use client';

import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getApp, initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useUser } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Briefcase, FileText, Shield, CheckCircle, AlertCircle, Gavel, Trash2, Check, X, BrainCircuit, Loader2, Plus, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { analyzeCase, CaseAnalysisOutput } from '@/ai/flows/case-analysis';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserData {
  id: string;
  displayName: string;
  email: string;
  role: 'user' | 'lawyer' | 'admin' | 'judge';
  specialization?: string;
  location?: string;
  isVerified?: boolean;
  createdAt?: any;
}

interface CaseData {
  id: string;
  title: string;
  status: 'active' | 'pending' | 'closed';
  type: string;
  clientName?: string;
  lawyerName?: string;
  createdAt?: any;
  description?: string;
}

interface FeedbackData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  category?: string;
  subject?: string;
  message: string;
  lawyerDetails?: string;
  createdAt?: any;
}

export default function AdminPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const { data: userProfile, loading: profileLoading } = useDoc<UserData>(user ? `users/${user.uid}` : '');

  const { data: users, loading: usersLoading } = useCollection<UserData>('users');
  const { data: cases, loading: casesLoading } = useCollection<CaseData>('cases');
  const { data: feedbackList, loading: feedbackLoading } = useCollection<FeedbackData>('feedback');

  const [analyzingCaseId, setAnalyzingCaseId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<CaseAnalysisOutput | null>(null);
  
  const [isRegisteringJudge, setIsRegisteringJudge] = useState(false);
  const [judgeFormData, setJudgeFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    location: '',
    contactNumber: ''
  });
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackData | null>(null);

  useEffect(() => {
    if (!authLoading && !profileLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (userProfile && userProfile.role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [user, userProfile, authLoading, profileLoading, router]);

  const handleVerifyLawyer = async (lawyerId: string, currentStatus?: boolean) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'users', lawyerId), {
        isVerified: !currentStatus
      });
      toast({ title: "Success", description: `Lawyer ${!currentStatus ? 'activated' : 'deactivated'} successfully.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update lawyer status." });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!firestore) return;
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(firestore, 'users', userId));
      toast({ title: "Success", description: "User deleted successfully." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete user." });
    }
  };

  const handleAnalyzeCase = async (caseData: CaseData) => {
    setAnalyzingCaseId(caseData.id);
    setAnalysisResult(null);
    try {
        const result = await analyzeCase({ caseDetails: caseData.description || caseData.title, language: 'English' });
        setAnalysisResult(result);
    } catch (error) {
        toast({ variant: "destructive", title: "Analysis Failed", description: "Could not analyze the case." });
        setAnalyzingCaseId(null);
    }
  };

  const handleRegisterJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegisteringJudge(true);
    
    let secondaryApp;
    try {
        // Use a secondary app to avoid logging out the admin
        const app = getApp();
        // Use a unique name to avoid "App named ... already exists" errors
        const secondaryAppName = `JudgeRegistration-${Date.now()}`;
        secondaryApp = initializeApp(app.options, secondaryAppName);
        const secondaryAuth = getAuth(secondaryApp);
        
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, judgeFormData.email, judgeFormData.password);
        const newUser = userCredential.user;
        
        await updateProfile(newUser, { displayName: judgeFormData.displayName });
        
        if (firestore) {
            await setDoc(doc(firestore, 'users', newUser.uid), {
                displayName: judgeFormData.displayName,
                email: judgeFormData.email,
                role: 'judge',
                location: judgeFormData.location,
                contactNumber: judgeFormData.contactNumber,
                createdAt: serverTimestamp(),
                isVerified: true
            });
        }
        
        toast({ title: "Success", description: "Judge registered successfully." });
        setJudgeFormData({ displayName: '', email: '', password: '', location: '', contactNumber: '' });
    } catch (error: any) {
        console.error(error);
        toast({ variant: "destructive", title: "Error", description: error.message || "Failed to register judge." });
    } finally {
        if (secondaryApp) {
            await deleteApp(secondaryApp);
        }
        setIsRegisteringJudge(false);
    }
  };

  const stats = useMemo(() => {
    const totalUsers = users.filter(u => u.role === 'user').length;
    const totalLawyers = users.filter(u => u.role === 'lawyer').length;
    const totalJudges = users.filter(u => u.role === 'judge').length;
    const totalCases = cases.length;
    const activeCases = cases.filter(c => c.status === 'active').length;
    
    return { totalUsers, totalLawyers, totalCases, activeCases, totalJudges };
  }, [users, cases]);

  const lawyersList = useMemo(() => users.filter(u => u.role === 'lawyer'), [users]);
  const judgesList = useMemo(() => users.filter(u => u.role === 'judge'), [users]);
  const usersList = useMemo(() => users.filter(u => u.role === 'user'), [users]);

  if (authLoading || profileLoading || usersLoading || casesLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (!user) return null;

  if (userProfile && userProfile.role !== 'admin') return null;

  if (!userProfile) {
    return null;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-0 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and management.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard 
          title="Total Users" 
          value={stats.totalUsers} 
          icon={<Users className="h-4 w-4 text-muted-foreground" />} 
          description="Registered citizens"
        />
        <StatsCard 
          title="Total Lawyers" 
          value={stats.totalLawyers} 
          icon={<Briefcase className="h-4 w-4 text-muted-foreground" />} 
          description="Verified legal professionals"
        />
        <StatsCard 
          title="Total Judges" 
          value={stats.totalJudges} 
          icon={<Gavel className="h-4 w-4 text-muted-foreground" />} 
          description="Presiding officers"
        />
        <StatsCard 
          title="Total Cases" 
          value={stats.totalCases} 
          icon={<FileText className="h-4 w-4 text-muted-foreground" />} 
          description="Cases filed on platform"
        />
        <StatsCard 
          title="Active Cases" 
          value={stats.activeCases} 
          icon={<Gavel className="h-4 w-4 text-muted-foreground" />} 
          description="Currently in progress"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="cases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cases">Cases Registry</TabsTrigger>
          <TabsTrigger value="lawyers">Lawyers Directory</TabsTrigger>
          <TabsTrigger value="judges">Judges Directory</TabsTrigger>
          <TabsTrigger value="users">Users Directory</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        {/* Cases Tab */}
        <TabsContent value="cases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Cases</CardTitle>
              <CardDescription>A list of all cases registered on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Case Title</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Description</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Client</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Assigned Lawyer</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Created At</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {cases.length > 0 ? cases.map((c) => (
                        <tr key={c.id} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle font-medium">{c.title}</td>
                          <td className="p-4 align-middle">{c.type}</td>
                          <td className="p-4 align-middle text-muted-foreground max-w-[200px] truncate" title={c.description}>{c.description}</td>
                          <td className="p-4 align-middle">
                            <Badge variant={c.status === 'active' ? 'default' : c.status === 'closed' ? 'secondary' : 'outline'}>
                              {c.status}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle">{c.clientName || 'N/A'}</td>
                          <td className="p-4 align-middle">{c.lawyerName || 'Unassigned'}</td>
                          <td className="p-4 align-middle">{c.createdAt?.toDate().toLocaleDateString()}</td>
                          <td className="p-4 align-middle">
                            <Dialog onOpenChange={(open) => !open && setAnalyzingCaseId(null)}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => handleAnalyzeCase(c)}>
                                        <BrainCircuit className="w-4 h-4 mr-2" /> AI Insight
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[80vh]">
                                    <DialogHeader>
                                        <DialogTitle>AI Case Analysis: {c.title}</DialogTitle>
                                        <DialogDescription>Real-time insights and possibilities.</DialogDescription>
                                    </DialogHeader>
                                    <ScrollArea className="h-[60vh] pr-4">
                                        {analyzingCaseId === c.id && !analysisResult ? (
                                            <div className="flex flex-col items-center justify-center h-40">
                                                <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                                                <p className="text-muted-foreground">Analyzing case details...</p>
                                            </div>
                                        ) : analysisResult ? (
                                            <div className="space-y-6">
                                                <div><h4 className="font-semibold text-primary">Summary</h4><p>{analysisResult.caseSummary}</p></div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div><h4 className="font-semibold text-green-600">Strengths</h4><ul className="list-disc pl-5 text-sm">{analysisResult.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
                                                    <div><h4 className="font-semibold text-red-600">Weaknesses</h4><ul className="list-disc pl-5 text-sm">{analysisResult.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul></div>
                                                </div>
                                                <div><h4 className="font-semibold text-primary">Potential Outcomes</h4><ul className="space-y-2 mt-2">{analysisResult.potentialOutcomes.map((o, i) => <li key={i} className="bg-muted p-2 rounded text-sm flex justify-between"><span>{o.outcome}</span><span className="font-bold">{(o.probability * 100).toFixed(0)}%</span></li>)}</ul></div>
                                            </div>
                                        ) : null}
                                    </ScrollArea>
                                </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-muted-foreground">No cases found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lawyers Tab */}
        <TabsContent value="lawyers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registered Lawyers</CardTitle>
              <CardDescription>Manage legal professionals on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {lawyersList.map((lawyer) => (
                  <div key={lawyer.id} className="flex flex-col justify-between rounded-lg border p-6 shadow-sm transition-all hover:shadow-md bg-card text-card-foreground">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4 overflow-hidden">
                        <Avatar className="h-12 w-12 shrink-0">
                          <AvatarFallback>{lawyer.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1 overflow-hidden">
                          <p className="font-semibold leading-none truncate" title={lawyer.displayName}>{lawyer.displayName}</p>
                          <p className="text-sm text-muted-foreground truncate" title={lawyer.email}>{lawyer.email}</p>
                        </div>
                      </div>
                      <div className="shrink-0 ml-2">
                         {lawyer.isVerified ? (
                            <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>
                         ) : (
                            <Badge variant="secondary" className="text-muted-foreground">Inactive</Badge>
                         )}
                      </div>
                    </div>
                    
                    <div className="grid gap-2 text-sm mb-6">
                        <div className="flex justify-between items-start gap-2">
                            <span className="text-muted-foreground shrink-0">Specialization</span>
                            <span className="font-medium text-right break-words">{lawyer.specialization || 'General'}</span>
                        </div>
                        <div className="flex justify-between items-start gap-2">
                            <span className="text-muted-foreground shrink-0">Location</span>
                            <span className="font-medium text-right break-words">{lawyer.location || 'N/A'}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-auto">
                        <Button 
                            className="flex-1" 
                            size="sm" 
                            variant={lawyer.isVerified ? "outline" : "default"} 
                            onClick={() => handleVerifyLawyer(lawyer.id, lawyer.isVerified)}
                        >
                            {lawyer.isVerified ? "Deactivate" : "Activate"}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(lawyer.id)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                  </div>
                ))}
                {lawyersList.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No lawyers registered.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Judges Tab */}
        <TabsContent value="judges" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Registered Judges</CardTitle>
                <CardDescription>Manage court officials.</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button><Plus className="w-4 h-4 mr-2" /> Register Judge</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Register New Judge</DialogTitle>
                    <DialogDescription>Create a new account for a judge. They will be verified automatically.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleRegisterJudge} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input required value={judgeFormData.displayName} onChange={e => setJudgeFormData({...judgeFormData, displayName: e.target.value})} placeholder="Hon. Justice Name" />
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input required type="email" value={judgeFormData.email} onChange={e => setJudgeFormData({...judgeFormData, email: e.target.value})} placeholder="judge@court.gov.in" />
                    </div>
                    <div className="space-y-2">
                        <Label>Password</Label>
                        <Input required type="password" value={judgeFormData.password} onChange={e => setJudgeFormData({...judgeFormData, password: e.target.value})} placeholder="******" />
                    </div>
                    <div className="space-y-2">
                        <Label>Court / Location</Label>
                        <Input required value={judgeFormData.location} onChange={e => setJudgeFormData({...judgeFormData, location: e.target.value})} placeholder="High Court, Mumbai" />
                    </div>
                    <div className="space-y-2">
                        <Label>Contact Number</Label>
                        <Input required value={judgeFormData.contactNumber} onChange={e => setJudgeFormData({...judgeFormData, contactNumber: e.target.value})} placeholder="+91..." />
                    </div>
                    <Button type="submit" className="w-full" disabled={isRegisteringJudge}>
                        {isRegisteringJudge && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Register Judge
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {judgesList.map((judge) => (
                  <div key={judge.id} className="flex flex-col justify-between rounded-lg border p-6 shadow-sm bg-card text-card-foreground">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4 overflow-hidden">
                        <Avatar className="h-12 w-12 shrink-0">
                          <AvatarFallback>{judge.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1 overflow-hidden">
                          <p className="font-semibold leading-none truncate" title={judge.displayName}>{judge.displayName}</p>
                          <p className="text-sm text-muted-foreground truncate" title={judge.email}>{judge.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid gap-2 text-sm mb-6">
                        <div className="flex justify-between items-start gap-2">
                            <span className="text-muted-foreground shrink-0">Court</span>
                            <span className="font-medium text-right break-words">{judge.location || 'N/A'}</span>
                        </div>
                    </div>

                    <Button size="sm" variant="destructive" className="w-full" onClick={() => handleDeleteUser(judge.id)}><Trash2 className="w-4 h-4 mr-2" /> Remove Judge</Button>
                  </div>
                ))}
                {judgesList.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No judges registered.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registered Users</CardTitle>
              <CardDescription>Citizens registered on Nyaya Mitra.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Location</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {usersList.map((user) => (
                        <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle font-medium">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {user.displayName}
                            </div>
                          </td>
                          <td className="p-4 align-middle">{user.email}</td>
                          <td className="p-4 align-middle">{user.location || 'N/A'}</td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">User</Badge>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive/90" onClick={() => handleDeleteUser(user.id)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {usersList.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-muted-foreground">No users found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Feedback</CardTitle>
              <CardDescription>Feedback submitted from the landing page.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Subject</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {feedbackList && feedbackList.length > 0 ? feedbackList.map((f) => (
                        <tr key={f.id} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle font-medium">
                            <div>{f.name}</div>
                            <div className="text-xs text-muted-foreground">{f.role || 'User'}</div>
                          </td>
                          <td className="p-4 align-middle"><Badge variant="outline">{f.category || 'General'}</Badge></td>
                          <td className="p-4 align-middle max-w-[200px] truncate" title={f.subject}>{f.subject || 'No Subject'}</td>
                          <td className="p-4 align-middle">{f.createdAt?.toDate().toLocaleDateString()}</td>
                          <td className="p-4 align-middle">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedFeedback(f)}>
                                        <Eye className="w-4 h-4 mr-2" /> View
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Feedback Details</DialogTitle>
                                        <DialogDescription>Submitted on {f.createdAt?.toDate().toLocaleString()}</DialogDescription>
                                    </DialogHeader>
                                    <div className="grid grid-cols-2 gap-4 py-4">
                                        <div><Label className="text-muted-foreground">Name</Label><p className="font-medium">{f.name}</p></div>
                                        <div><Label className="text-muted-foreground">Email</Label><p className="font-medium">{f.email}</p></div>
                                        <div><Label className="text-muted-foreground">Phone</Label><p className="font-medium">{f.phone || 'N/A'}</p></div>
                                        <div><Label className="text-muted-foreground">Role</Label><p className="font-medium">{f.role || 'N/A'}</p></div>
                                        <div><Label className="text-muted-foreground">Category</Label><p className="font-medium">{f.category || 'General'}</p></div>
                                        <div><Label className="text-muted-foreground">Subject</Label><p className="font-medium">{f.subject || 'N/A'}</p></div>
                                        
                                        {f.category === 'Complaint' && f.lawyerDetails && (
                                            <div className="col-span-2 bg-red-50 p-3 rounded-md border border-red-100">
                                                <Label className="text-red-600">Complaint Against / Lawyer Details</Label>
                                                <p className="font-medium text-red-900">{f.lawyerDetails}</p>
                                            </div>
                                        )}

                                        <div className="col-span-2 mt-2">
                                            <Label className="text-muted-foreground">Message</Label>
                                            <div className="mt-1 p-4 bg-muted rounded-md text-sm leading-relaxed whitespace-pre-wrap">{f.message}</div>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-muted-foreground">No feedback found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatsCard({ title, value, icon, description }: { title: string, value: number, icon: React.ReactNode, description: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
