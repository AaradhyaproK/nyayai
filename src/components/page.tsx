'use client';

import { useMemo } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Briefcase, FileText, Shield, CheckCircle, AlertCircle, Gavel } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface UserData {
  id: string;
  displayName: string;
  email: string;
  role: 'user' | 'lawyer' | 'admin';
  specialization?: string;
  location?: string;
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
}

export default function AdminPage() {
  const { data: users, loading: usersLoading } = useCollection<UserData>('users');
  const { data: cases, loading: casesLoading } = useCollection<CaseData>('cases');

  const stats = useMemo(() => {
    const totalUsers = users.filter(u => u.role === 'user').length;
    const totalLawyers = users.filter(u => u.role === 'lawyer').length;
    const totalCases = cases.length;
    const activeCases = cases.filter(c => c.status === 'active').length;
    
    return { totalUsers, totalLawyers, totalCases, activeCases };
  }, [users, cases]);

  const lawyersList = useMemo(() => users.filter(u => u.role === 'lawyer'), [users]);
  const usersList = useMemo(() => users.filter(u => u.role === 'user'), [users]);

  if (usersLoading || casesLoading) {
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-0 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and management.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          <TabsTrigger value="users">Users Directory</TabsTrigger>
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
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Client</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Assigned Lawyer</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {cases.length > 0 ? cases.map((c) => (
                        <tr key={c.id} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle font-medium">{c.title}</td>
                          <td className="p-4 align-middle">{c.type}</td>
                          <td className="p-4 align-middle">
                            <Badge variant={c.status === 'active' ? 'default' : c.status === 'closed' ? 'secondary' : 'outline'}>
                              {c.status}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle">{c.clientName || 'N/A'}</td>
                          <td className="p-4 align-middle">{c.lawyerName || 'Unassigned'}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-muted-foreground">No cases found.</td>
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
                  <div key={lawyer.id} className="flex items-center justify-between space-x-4 rounded-md border p-4">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>{lawyer.displayName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">{lawyer.displayName}</p>
                        <p className="text-sm text-muted-foreground">{lawyer.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline">{lawyer.specialization || 'General'}</Badge>
                        <span className="text-xs text-muted-foreground">{lawyer.location}</span>
                    </div>
                  </div>
                ))}
                {lawyersList.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No lawyers registered.</p>}
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
                          <td className="p-4 align-middle"><Badge variant="secondary">User</Badge></td>
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