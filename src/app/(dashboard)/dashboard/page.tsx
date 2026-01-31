'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/firebase/auth/use-user";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Gavel, Users, Briefcase, ScrollText, PlusCircle, LayoutDashboard, BrainCircuit, Shield, Activity } from "lucide-react";
import Link from "next/link";
import { useLanguage } from '@/hooks/use-language';
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection } from "@/firebase/firestore/use-collection";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList } from 'recharts';

interface UserProfile {
  role: 'user' | 'lawyer' | 'judge' | 'admin';
  displayName: string;
}

const DashboardStats = ({ role, uid }: { role: string; uid?: string }) => {
    const { data: users, loading: usersLoading } = useCollection<UserProfile>('users');
    const { data: cases, loading: casesLoading } = useCollection<any>('cases');

    if (usersLoading || casesLoading) {
        return (
            <div className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-[400px] w-full" />
                    <Skeleton className="h-[400px] w-full" />
                </div>
            </div>
        );
    }

    // Platform stats (Directory counts)
    const totalLawyers = users?.filter(u => u.role === 'lawyer').length || 0;
    const totalJudges = users?.filter(u => u.role === 'judge').length || 0;
    const totalUsers = users?.filter(u => u.role === 'user').length || 0;
    
    // Use all cases for stats to show platform-wide data for everyone
    const allCases = cases || [];
    
    const totalCases = allCases.length;
    const solvedCases = allCases.filter((c: any) => c.status?.toLowerCase() === 'closed').length;
    const activeCases = allCases.filter((c: any) => c.status?.toLowerCase() === 'active').length;
    const pendingCases = allCases.filter((c: any) => c.status?.toLowerCase() === 'pending').length;

    const caseData = [
        { name: 'Total', value: totalCases, fill: '#8b5cf6' },
        { name: 'Active', value: activeCases, fill: '#3b82f6' },
        { name: 'Pending', value: pendingCases, fill: '#eab308' },
        { name: 'Solved', value: solvedCases, fill: '#22c55e' },
    ];

    const roleData = [
        { name: 'Users', value: totalUsers, fill: '#64748b' },
        { name: 'Lawyers', value: totalLawyers, fill: '#3b82f6' },
        { name: 'Judges', value: totalJudges, fill: '#a855f7' },
    ];

    return (
        <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Lawyers</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Briefcase className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalLawyers}</div>
                        <p className="text-xs text-muted-foreground mt-1">Registered legal professionals</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Judges</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <Gavel className="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalJudges}</div>
                        <p className="text-xs text-muted-foreground mt-1">Active judicial officers</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Cases</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <ScrollText className="h-4 w-4 text-orange-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalCases}</div>
                        <p className="text-xs text-muted-foreground mt-1">Cases filed on platform</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Solved Cases</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <Shield className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{solvedCases}</div>
                        <p className="text-xs text-muted-foreground mt-1">Successfully resolved</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Activity className="w-5 h-5 text-primary" />
                            Case Statistics
                        </CardTitle>
                        <CardDescription>Overview of total, active, and solved cases</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={caseData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} allowDecimals={false} />
                                <Tooltip 
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={50}>
                                    {caseData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                    <LabelList dataKey="value" position="top" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="w-5 h-5 text-primary" />
                            User Role Distribution
                        </CardTitle>
                        <CardDescription>Breakdown of registered users by role</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={roleData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {roleData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const UserDashboard = ({ uid }: { uid?: string }) => {
    const { t } = useLanguage();
    return (
        <div className="space-y-8">
            <DashboardStats role="user" uid={uid} />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/ai-judge">
            <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
                <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                    <Gavel className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="font-headline">{t('dashboard.aiAnalysisTitle')}</CardTitle>
                </div>
                </CardHeader>
                <CardContent>
                <p className="text-muted-foreground">{t('dashboard.aiAnalysisDescription')}</p>
                </CardContent>
            </Card>
            </Link>
            <Link href="/lawyers">
            <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
                <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                    <Users className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="font-headline">{t('dashboard.findLawyerTitle')}</CardTitle>
                </div>
                </CardHeader>
                <CardContent>
                <p className="text-muted-foreground">{t('dashboard.findLawyerDescription')}</p>
                </CardContent>
            </Card>
            </Link>
            <Link href="/my-cases">
            <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
                <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                    <Briefcase className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="font-headline">{t('dashboard.manageCasesTitle')}</CardTitle>
                </div>
                </CardHeader>
                <CardContent>
                <p className="text-muted-foreground">{t('dashboard.manageCasesDescription')}</p>
                </CardContent>
            </Card>
            </Link>
            </div>
      </div>
    )
}

const LawyerDashboard = ({ uid }: { uid?: string }) => {
    const { t } = useLanguage();
    return (
      <div className="space-y-8">
        <DashboardStats role="lawyer" uid={uid} />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Link href="/my-cases">
          <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="font-headline">{t('dashboard.viewCasesTitle')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('dashboard.viewCasesDescription')}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/legal-research">
          <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <ScrollText className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="font-headline">{t('dashboard.legalResearchTitle')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('dashboard.legalResearchDescription')}</p>
            </CardContent>
          </Card>
        </Link>
      </div>
      </div>
    )
}

const JudgeDashboard = ({ uid }: { uid?: string }) => {
    const { t } = useLanguage();
    return (
        <div className="space-y-8">
            <DashboardStats role="judge" uid={uid} />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Link href="/judge/file-case">
            <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
                <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                    <PlusCircle className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="font-headline">{t('sidebar.fileCase')}</CardTitle>
                </div>
                </CardHeader>
                <CardContent>
                <p className="text-muted-foreground">Initiate a new case file and assign initial details.</p>
                </CardContent>
            </Card>
            </Link>

            <Link href="/judge">
            <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
                <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                    <LayoutDashboard className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="font-headline">Case Docket</CardTitle>
                </div>
                </CardHeader>
                <CardContent>
                <p className="text-muted-foreground">View and manage all cases assigned to your bench.</p>
                </CardContent>
            </Card>
            </Link>
            </div>
        </div>
    )
}

const AdminDashboard = () => {
    return (
        <div className="space-y-8">
            <DashboardStats role="admin" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 <Link href="/admin">
                <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
                    <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                        <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="font-headline">Admin Console</CardTitle>
                    </div>
                    </CardHeader>
                    <CardContent>
                    <p className="text-muted-foreground">Manage users, lawyers, and platform settings.</p>
                    </CardContent>
                </Card>
                </Link>
                 <Link href="/statistics">
                <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
                    <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                        <Activity className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="font-headline">Platform Statistics</CardTitle>
                    </div>
                    </CardHeader>
                    <CardContent>
                    <p className="text-muted-foreground">View detailed analytics about platform usage.</p>
                    </CardContent>
                </Card>
                </Link>
            </div>
        </div>
    )
}

export default function DashboardClient() {
  const { user } = useUser();
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(user?.uid ? `users/${user.uid}` : '');
  const { t } = useLanguage();

  const role = userProfile?.role || 'user';

  if (profileLoading || !userProfile) {
      return (
          <div className="space-y-8">
              <Card className="shadow-sm border-0 bg-transparent">
                  <CardHeader>
                      <Skeleton className="h-10 w-1/2" />
                      <Skeleton className="h-6 w-3/4 mt-2" />
                  </CardHeader>
                  <CardContent>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6 mt-2" />
                  </CardContent>
              </Card>
               <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                   <Skeleton className="h-48" />
                   <Skeleton className="h-48" />
                   <Skeleton className="h-48" />
               </div>
          </div>
      )
  }

  return (
    <div className="space-y-8">
       <Card className="shadow-sm border-0 bg-transparent">
        <CardHeader>
          <CardTitle className="font-headline text-2xl md:text-4xl">
            {role === 'lawyer' 
              ? t('dashboard.lawyerWelcome', { name: userProfile?.displayName || '' })
              : role === 'judge'
              ? t('sidebar.judgeDashboard')
              : role === 'admin'
              ? t('sidebar.admin')
              : t('dashboard.welcome', { name: userProfile?.displayName || 'User' })
            }
          </CardTitle>
          <CardDescription className="text-lg">
            {role === 'lawyer' ? t('dashboard.lawyerSubheading') 
             : role === 'judge' ? 'Manage your court docket and assigned cases.'
             : role === 'admin' ? 'Platform overview and management.'
             : t('dashboard.subheading')}
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="max-w-2xl">
                {role === 'lawyer' ? t('dashboard.lawyerDescription') 
                 : role === 'user' ? t('dashboard.description')
                 : ''}
            </p>
        </CardContent>
      </Card>
      
      {role === 'judge' && <JudgeDashboard uid={user?.uid} />}
      {role === 'admin' && <AdminDashboard />}
      {role === 'lawyer' && <LawyerDashboard uid={user?.uid} />}
      {role === 'user' && <UserDashboard uid={user?.uid} />}
    </div>
  )
}
