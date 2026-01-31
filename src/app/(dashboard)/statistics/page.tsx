'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Scale, 
  Gavel, 
  FileText, 
  AlertCircle, 
  Clock, 
  Users, 
  TrendingUp
} from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

const COLORS = {
  civil: '#3b82f6', // blue-500
  criminal: '#ef4444', // red-500
  total: '#10b981', // green-500
  purple: '#8b5cf6',
  orange: '#f97316',
  gray: '#9ca3af'
};

const formatNumber = (num: number) => new Intl.NumberFormat('en-IN').format(num);

export default function CourtStatisticsPage() {
  const { t } = useLanguage();

  const data = useMemo(() => ({
    summary: {
      civil: 11109034,
      criminal: 36767155,
      total: 47876189,
      preLitigation: 1283564
    },
    instituted: { civil: 311392, criminal: 2618266, total: 2929642 },
    disposal: { civil: 358933, criminal: 3189444, total: 3548377 },
    purpose: [
      { name: t('statisticsPage.labels.contested'), civil: 71328, criminal: 297503, total: 368831, percentage: '10%' },
      { name: t('statisticsPage.labels.uncontested'), civil: 287605, criminal: 2891941, total: 3179546, percentage: '90%' }
    ],
    categories: [
      { name: t('statisticsPage.labels.listedToday'), civil: 419658, criminal: 820139, total: 1239797, note: `3% ${t('statisticsPage.summary.ofTotal')}` },
      { name: t('statisticsPage.labels.undated'), civil: 304044, criminal: 1328565, total: 1632609, note: `3% ${t('statisticsPage.summary.ofTotal')}` },
      { name: t('statisticsPage.labels.excessiveDated'), civil: 351858, criminal: 3815034, total: 4166892, note: `9% ${t('statisticsPage.summary.ofTotal')}` },
    ],
    demographics: [
      { name: t('statisticsPage.labels.women'), civil: 1840690, criminal: 2015315, total: 3856005, note: `8% ${t('statisticsPage.summary.ofTotal')}` },
      { name: t('statisticsPage.labels.seniorCitizens'), civil: 2436029, criminal: 757176, total: 3193205, note: `7% ${t('statisticsPage.summary.ofTotal')}` },
    ],
    ageWise: [
      { range: '0-1 Years', civil: 2500000, criminal: 8000000 },
      { range: '1-3 Years', civil: 3000000, criminal: 9000000 },
      { range: '3-5 Years', civil: 2000000, criminal: 7000000 },
      { range: '5-10 Years', civil: 2000000, criminal: 8000000 },
      { range: '10-20 Years', civil: 1000000, criminal: 3000000 },
      { range: '20-30 Years', civil: 500000, criminal: 1000000 },
      { range: '30+ Years', civil: 109034, criminal: 767155 },
    ]
  }), [t]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-0 pb-12">
      {/* Header & Filters */}
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">{t('statisticsPage.title')}</h1>
          <p className="text-muted-foreground">{t('statisticsPage.description')}</p>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          title={t('statistics.cards.pending')} 
          value={data.summary.total} 
          icon={<Scale className="w-5 h-5 text-white" />} 
          color="bg-primary"
          subtext={t('statisticsPage.summary.acrossCourts')}
        />
        <SummaryCard 
          title={t('statistics.cards.civil')} 
          value={data.summary.civil} 
          icon={<FileText className="w-5 h-5 text-white" />} 
          color="bg-blue-500"
          subtext={`${((data.summary.civil / data.summary.total) * 100).toFixed(1)}${t('statisticsPage.summary.ofTotal')}`}
        />
        <SummaryCard 
          title={t('statistics.cards.criminal')} 
          value={data.summary.criminal} 
          icon={<Gavel className="w-5 h-5 text-white" />} 
          color="bg-red-500"
          subtext={`${((data.summary.criminal / data.summary.total) * 100).toFixed(1)}${t('statisticsPage.summary.ofTotal')}`}
        />
        <SummaryCard 
          title={t('statistics.cards.preLitigation')} 
          value={data.summary.preLitigation} 
          icon={<Clock className="w-5 h-5 text-white" />} 
          color="bg-orange-500"
          subtext={t('statisticsPage.summary.preTrial')}
        />
      </div>

      {/* Main Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto justify-start gap-2 bg-transparent p-0">
          <TabsTrigger value="overview">{t('statisticsPage.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="demographics">{t('statisticsPage.tabs.demographics')}</TabsTrigger>
          <TabsTrigger value="pendency">{t('statisticsPage.tabs.pendency')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Instituted vs Disposal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> {t('statisticsPage.charts.caseFlow')}</CardTitle>
                <CardDescription>{t('statisticsPage.charts.caseFlowDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: t('statisticsPage.labels.instituted'), civil: data.instituted.civil, criminal: data.instituted.criminal },
                    { name: t('statisticsPage.labels.disposed'), civil: data.disposal.civil, criminal: data.disposal.criminal },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => `${(value / 100000).toFixed(1)}L`} />
                    <Tooltip formatter={(value: number) => formatNumber(value)} />
                    <Legend />
                    <Bar dataKey="civil" name={t('statisticsPage.labels.civil')} fill={COLORS.civil} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="criminal" name={t('statisticsPage.labels.criminal')} fill={COLORS.criminal} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Contested vs Uncontested */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Gavel className="w-5 h-5" /> {t('statisticsPage.charts.disposalNature')}</CardTitle>
                <CardDescription>{t('statisticsPage.charts.disposalNatureDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.purpose}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="total"
                    >
                      {data.purpose.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.orange : COLORS.total} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatNumber(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
 
              </CardContent>
            </Card>
          </div>

          {/* Specific Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.categories.map((cat, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">{cat.name}</CardTitle>
                  <CardDescription>{cat.note}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{formatNumber(cat.total)}</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('statisticsPage.labels.civil')}:</span>
                      <span className="font-medium">{formatNumber(cat.civil)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('statisticsPage.labels.criminal')}:</span>
                      <span className="font-medium">{formatNumber(cat.criminal)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.demographics.map((demo, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" /> {t('statisticsPage.charts.casesFiledBy', { name: demo.name })}
                  </CardTitle>
                  <CardDescription>{demo.note}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2 mb-4">
                    <div className="text-4xl font-bold">{formatNumber(demo.total)}</div>
                  </div>
                  <div className="h-[10px] w-full bg-secondary rounded-full overflow-hidden flex">
                    <div className="bg-blue-500 h-full" style={{ width: `${(demo.civil / demo.total) * 100}%` }} />
                    <div className="bg-red-500 h-full" style={{ width: `${(demo.criminal / demo.total) * 100}%` }} />
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span>{t('statisticsPage.labels.civil')}: {formatNumber(demo.civil)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span>{t('statisticsPage.labels.criminal')}: {formatNumber(demo.criminal)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pendency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('statisticsPage.charts.ageWise')}</CardTitle>
              <CardDescription>{t('statisticsPage.charts.ageWiseDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.ageWise}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: number) => formatNumber(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="civil" name={t('statisticsPage.labels.civil')} stackId="1" stroke={COLORS.civil} fill={COLORS.civil} />
                  <Area type="monotone" dataKey="criminal" name={t('statisticsPage.labels.criminal')} stackId="1" stroke={COLORS.criminal} fill={COLORS.criminal} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({ title, value, icon, color, subtext }: { title: string, value: number, icon: React.ReactNode, color: string, subtext: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-stretch">
          <div className={`${color} w-16 md:w-24 flex items-center justify-center shrink-0`}>
            {icon}
          </div>
          <div className="p-4 flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate" title={title}>{title}</p>
            <h3 className="text-xl md:text-2xl font-bold mt-1 truncate">{formatNumber(value)}</h3>
            <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}