'use client';

import { useState, useRef, useEffect } from 'react';
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Gavel,
  Scale,
  FileText,
  MessageSquare,
  Users,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Megaphone,
  ScrollText,
  Mic,
  ChevronRight,
  PlayCircle,
  Star,
  Briefcase,
  Globe,
  GraduationCap,
  Calendar,
  Search,
  Unlock,
  Menu,
  BrainCircuit,
  Languages,
  Accessibility,
  TrendingUp,
  Clock,
  Quote,
  X,
  Send,
  Loader2,
  Bell,
  Check
} from "lucide-react"
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from "@/components/ui/textarea";
import { useFirestore } from "@/firebase/provider";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { chatWithLandingBot } from '@/ai/flows/landing-chat';
import { useLanguage } from '@/hooks/use-language';
import { TRANSLATIONS } from '@/lib/translations';

const NATIONAL_DATA = {
  summary: {
    civil: 11109034,
    criminal: 36767155,
    total: 47876189,
    preLitigation: 1283564
  },
  instituted: { civil: 311392, criminal: 2618266, total: 2929642 },
  disposal: { civil: 358933, criminal: 3189444, total: 3548377 },
  purpose: [
    { name: 'Contested', civil: 71328, criminal: 297503, total: 368831, percentage: '10%' },
    { name: 'Uncontested', civil: 287605, criminal: 2891941, total: 3179546, percentage: '90%' }
  ],
  categories: [
    { name: 'Listed Today', civil: 419658, criminal: 820139, total: 1239797, note: '3% of Pending' },
    { name: 'Undated', civil: 304044, criminal: 1328565, total: 1632609, note: '3% of Pending' },
    { name: 'Excessive Dated', civil: 351858, criminal: 3815034, total: 4166892, note: '9% of Pending' },
  ],
  demographics: [
    { name: 'Women', civil: 1840690, criminal: 2015315, total: 3856005, note: '8% of Pending' },
    { name: 'Senior Citizens', civil: 2436029, criminal: 757176, total: 3193205, note: '7% of Pending' },
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
};

const COLORS = {
  civil: '#3b82f6',
  criminal: '#ef4444',
  total: '#10b981',
  purple: '#8b5cf6',
  orange: '#f97316',
  gray: '#9ca3af'
};

const formatNumber = (num: number) => new Intl.NumberFormat('en-IN').format(num);

const IMPACT_STATS = [
    { label: "Cases Analyzed", value: "1.2M+" },
    { label: "Legal Professionals", value: "50k+" },
    { label: "Citizens Helped", value: "10M+" },
    { label: "Success Rate", value: "94%" },
];

const TESTIMONIALS = [
    {
        name: "Rajesh Kumar",
        role: "Citizen",
        content: "NyayaAI helped me understand my property dispute rights in minutes. The AI analysis was spot on!",
    },
    {
        name: "Adv. Priya Sharma",
        role: "High Court Lawyer",
        content: "The legal research tool saves me hours of work. Finding relevant precedents has never been easier.",
    },
    {
        name: "Amit Patel",
        role: "Small Business Owner",
        content: "Filing an RTI was daunting until I used this platform. The step-by-step guidance is excellent.",
    }
];

const LEGAL_NEWS = [
    "Supreme Court digitizes 1 crore pages of judicial records for public access.",
    "New consumer protection rules for e-commerce platforms notified by Ministry.",
    "National Lok Adalat settles record number of pending cases in a single day.",
    "Government launches expanded tele-law service for rural areas."
];

const RIGHTS_METADATA_LANDING = [
    {
        id: 'fr1',
        categoryKey: 'Fundamental Rights',
        article: 'Article 14'
    },
    {
        id: 'w1',
        categoryKey: 'Women',
        article: 'Section 154 CrPC'
    },
    {
        id: 'c2',
        categoryKey: 'Children',
        article: 'Article 24'
    },
    {
        id: 'a2',
        categoryKey: 'Arrested Persons',
        article: 'Article 22(2)'
    },
    {
        id: 'co3',
        categoryKey: 'Consumers',
        article: 'Consumer Protection Act'
    },
    {
        id: 't1',
        categoryKey: 'Tenants',
        article: 'Rent Control Act'
    }
];

export default function LandingPage() {
  const data = NATIONAL_DATA;
  const firestore = useFirestore();
  const { toast } = useToast();
  const { language, setLanguage, t: translate } = useLanguage();
  
  const getLangCode = (lang: string) => {
    if (lang === 'Hindi' || lang === 'hi') return 'hi';
    if (lang === 'Marathi' || lang === 'mr') return 'mr';
    return 'en';
  };
  
  const currentLang = getLangCode(language);
  const t = (TRANSLATIONS as any)[currentLang] || TRANSLATIONS.en;
  
  const rightsDataLanding = RIGHTS_METADATA_LANDING.map(item => ({
      ...item,
      title: translate(`knowYourRightsPage.rights.${item.id}.title`),
      description: translate(`knowYourRightsPage.rights.${item.id}.description`),
      category: translate(`knowYourRightsPage.categories.${item.categoryKey}`)
  }));

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', content: string}[]>([
      { role: 'model', content: 'Namaste! I am NyayaAI Assistant. Ask me about your rights, our features, or legal statistics.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [feedbackForm, setFeedbackForm] = useState({ 
    name: '', 
    email: '', 
    phone: '',
    role: '',
    category: '',
    subject: '',
    message: '',
    lawyerDetails: ''
  });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
        setCurrentNewsIndex((prev) => (prev + 1) % LEGAL_NEWS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatOpen]);

  const handleChatSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatLoading(true);

    try {
        const result = await chatWithLandingBot({
            messages: chatMessages,
            newMessage: userMsg
        });
        setChatMessages(prev => [...prev, { role: 'model', content: result.response }]);
    } catch (error) {
        setChatMessages(prev => [...prev, { role: 'model', content: "I apologize, but I'm having trouble connecting to the server right now." }]);
    } finally {
        setIsChatLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;
    setIsSubmittingFeedback(true);
    try {
      await addDoc(collection(firestore, 'feedback'), {
        ...feedbackForm,
        createdAt: serverTimestamp(),
      });
      setFeedbackForm({ 
        name: '', 
        email: '', 
        phone: '',
        role: '',
        category: '',
        subject: '',
        message: '',
        lawyerDetails: ''
      });
      toast({ title: "Feedback Submitted", description: "Thank you for your feedback!" });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to submit feedback. Please try again." });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans selection:bg-[#3F51B5] selection:text-white">
      {/* News Ticker */}
      <div className="bg-slate-900 text-white text-xs py-2.5 border-b border-slate-800">
        <div className="container px-4 md:px-6 flex items-center justify-center md:justify-start gap-3">
            <Badge variant="secondary" className="bg-[#4CAF50] text-white hover:bg-[#43A047] border-none text-[10px] px-2 h-5">LATEST UPDATE</Badge>
            <div className="flex-1 overflow-hidden relative h-4">
                <p key={currentNewsIndex} className="animate-in slide-in-from-bottom-2 fade-in duration-500 absolute w-full truncate">
                    {LEGAL_NEWS[currentNewsIndex]}
                </p>
            </div>
        </div>
      </div>

      {/* Navbar */}
      <header className="px-6 lg:px-10 h-20 flex items-center border-b bg-white/90 backdrop-blur-xl sticky top-0 z-50 transition-all duration-200 shadow-sm">
        <Link className="flex items-center justify-center group" href="#">
          <div className="bg-gradient-to-br from-[#3F51B5] to-[#303F9F] p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-blue-500/20">
             <Scale className="h-6 w-6 text-white" />
          </div>
          <span className="ml-3 text-2xl font-bold text-slate-900 tracking-tight">NyayaAI</span>
        </Link>
        <nav className="ml-auto flex gap-8 hidden lg:flex items-center">
          <Link className="text-sm font-medium text-slate-600 hover:text-[#3F51B5] transition-colors relative group" href="#features">{t.nav.features}</Link>
          <Link className="text-sm font-medium text-slate-600 hover:text-[#3F51B5] transition-colors relative group" href="#ai-tools">{t.nav.aiTools}</Link>
          <Link className="text-sm font-medium text-slate-600 hover:text-[#3F51B5] transition-colors relative group" href="#statistics">{t.nav.stats}</Link>
          <Link className="text-sm font-medium text-slate-600 hover:text-[#3F51B5] transition-colors relative group" href="#testimonials">{t.nav.testimonials}</Link>
          <Link className="text-sm font-medium text-slate-600 hover:text-[#3F51B5] transition-colors relative group" href="#know-your-rights">{t.nav.knowRights}</Link>
        </nav>
        <div className="ml-8 flex gap-4">
            <Select value={currentLang} onValueChange={setLanguage}>
                <SelectTrigger className="w-[110px] bg-transparent border-slate-200">
                    <Languages className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="mr">Marathi</SelectItem>
                </SelectContent>
            </Select>
            <Link href="/login">
                <Button variant="ghost" className="text-slate-600 hover:text-[#3F51B5] hover:bg-blue-50">{t.nav.login}</Button>
            </Link>
            <Link href="/register">
                <Button className="bg-[#3F51B5] hover:bg-[#303F9F] text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5">{t.nav.getStarted}</Button>
            </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-40 bg-gradient-to-br from-[#3F51B5] via-[#3949AB] to-[#283593] relative overflow-hidden">
             {/* Background elements... */}
             <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20"></div>
             <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
             <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-400/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3"></div>
             
             <div className="container px-4 md:px-6 relative z-10">
                <div className="grid gap-12 lg:grid-cols-2 items-center">
                    <div className="flex flex-col justify-center space-y-8 animate-in slide-in-from-left duration-700 fade-in">
                        <div className="space-y-4">
                            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-md shadow-sm">
                                <span className="flex h-2.5 w-2.5 rounded-full bg-[#4CAF50] mr-2 animate-pulse shadow-[0_0_10px_#4CAF50]"></span>
                                {t.hero.badge}
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl xl:text-7xl leading-tight">
                                {t.hero.title}
                            </h1>
                            <p className="max-w-[600px] text-blue-100 md:text-xl leading-relaxed">
                                {t.hero.subtitle}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/register">
                                <Button size="lg" className="bg-[#4CAF50] hover:bg-[#43A047] text-white border-none px-8 font-bold text-lg h-14 rounded-full shadow-xl shadow-green-900/30 transition-all hover:scale-105 hover:shadow-2xl w-full sm:w-auto">
                                    {t.hero.ctaPrimary} <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button variant="outline" size="lg" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 h-14 rounded-full px-8 font-semibold w-full sm:w-auto hover:border-white/40 transition-all">
                                    {t.hero.ctaSecondary}
                                </Button>
                            </Link>
                        </div>
                    </div>
                    {/* Hero Graphic */}
                    <div className="relative flex items-center justify-center animate-in slide-in-from-right duration-700 fade-in">
                        <div className="relative w-full max-w-[500px] aspect-square bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-full border border-white/20 shadow-2xl flex items-center justify-center animate-in fade-in zoom-in duration-1000 overflow-hidden hover:scale-[1.02] transition-transform duration-500">
                            <img src="https://rockybhai.lovable.app/assets/hero-illustration-DgrLGejo.png" alt="Hero Illustration" className="w-full h-full object-cover drop-shadow-2xl" />
                            <div className="absolute inset-0 rounded-full border-t-2 border-white/30 animate-[spin_10s_linear_infinite]"></div>
                            <div className="absolute inset-4 rounded-full border-b-2 border-[#4CAF50]/50 animate-[spin_15s_linear_infinite_reverse]"></div>
                        </div>
                    </div>
                </div>
             </div>
        </section>

        {/* Impact Stats Banner */}
        <section className="w-full py-16 bg-white border-b border-slate-100 relative z-20 -mt-8 rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <div className="container px-4 md:px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {IMPACT_STATS.map((stat, index) => (
                        <div key={index} className="space-y-2 animate-in zoom-in duration-500 delay-100">
                            <div className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#3F51B5] to-[#303F9F]">{stat.value}</div>
                            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{Object.values(t.stats)[index]}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-24 bg-white">
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-4">{t.features.title}</h2>
                    <p className="text-lg text-slate-600">{t.features.subtitle}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard icon={<Megaphone />} title={t.features.cards.pil.title} description={t.features.cards.pil.desc} color="bg-red-500" delay={0} />
                    <FeatureCard icon={<ScrollText />} title={t.features.cards.rti.title} description={t.features.cards.rti.desc} color="bg-orange-500" delay={100} />
                    <FeatureCard icon={<Gavel />} title={t.features.cards.aiJudge.title} description={t.features.cards.aiJudge.desc} color="bg-blue-600" delay={200} />
                    <FeatureCard icon={<BarChart3 />} title={t.features.cards.dashboard.title} description={t.features.cards.dashboard.desc} color="bg-purple-500" delay={300} />
                    <FeatureCard icon={<Users />} title={t.features.cards.lawyer.title} description={t.features.cards.lawyer.desc} color="bg-indigo-500" delay={400} />
                    <FeatureCard icon={<Languages />} title={t.features.cards.multilingual.title} description={t.features.cards.multilingual.desc} color="bg-green-500" delay={500} />
                    <FeatureCard icon={<Mic />} title={t.features.cards.voice.title} description={t.features.cards.voice.desc} color="bg-pink-500" delay={600} />
                    <FeatureCard icon={<MessageSquare />} title={t.features.cards.chatbot.title} description={t.features.cards.chatbot.desc} color="bg-teal-500" delay={700} />
                    <FeatureCard icon={<FileText />} title={t.features.cards.docs.title} description={t.features.cards.docs.desc} color="bg-slate-600" delay={800} />
                </div>
            </div>
        </section>

        {/* AI Tools Section */}
        <section id="ai-tools" className="w-full py-24 bg-slate-50">
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-4">{t.aiTools.title}</h2>
                    <p className="text-lg text-slate-600">{t.aiTools.subtitle}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ToolCard icon={<Scale />} title={t.aiTools.cards.judgment.title} description={t.aiTools.cards.judgment.desc} delay={0} />
                    <ToolCard icon={<Search />} title={t.aiTools.cards.facts.title} description={t.aiTools.cards.facts.desc} delay={100} />
                    <ToolCard icon={<Calendar />} title={t.aiTools.cards.management.title} description={t.aiTools.cards.management.desc} delay={200} />
                    <ToolCard icon={<Unlock />} title={t.aiTools.cards.bail.title} description={t.aiTools.cards.bail.desc} delay={300} />
                    <ToolCard icon={<GraduationCap />} title={t.aiTools.cards.study.title} description={t.aiTools.cards.study.desc} delay={400} />
                    <ToolCard icon={<BookOpen />} title={t.aiTools.cards.rights.title} description={t.aiTools.cards.rights.desc} delay={500} />
                </div>
            </div>
        </section>

        {/* Statistics Section */}
        <section id="statistics" className="w-full py-24 bg-slate-50">
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-4">{t.statistics.title}</h2>
                    <p className="text-lg text-slate-600">{t.statistics.subtitle}</p>
                </div>

                {/* Top Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <SummaryCard 
                    title={t.statistics.cards.pending} 
                    value={data.summary.total} 
                    icon={<Scale className="w-5 h-5 text-white" />} 
                    color="bg-primary"
                    subtext="Across all courts"
                    />
                    <SummaryCard 
                    title={t.statistics.cards.civil} 
                    value={data.summary.civil} 
                    icon={<FileText className="w-5 h-5 text-white" />} 
                    color="bg-blue-500"
                    subtext={`${((data.summary.civil / data.summary.total) * 100).toFixed(1)}% of Total`}
                    />
                    <SummaryCard 
                    title={t.statistics.cards.criminal} 
                    value={data.summary.criminal} 
                    icon={<Gavel className="w-5 h-5 text-white" />} 
                    color="bg-red-500"
                    subtext={`${((data.summary.criminal / data.summary.total) * 100).toFixed(1)}% of Total`}
                    />
                    <SummaryCard 
                    title={t.statistics.cards.preLitigation} 
                    value={data.summary.preLitigation} 
                    icon={<Clock className="w-5 h-5 text-white" />} 
                    color="bg-orange-500"
                    subtext="Pre-Trial Stage"
                    />
                </div>

                {/* Main Charts Section */}
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList className="flex flex-wrap h-auto justify-start gap-2 bg-transparent p-0">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="demographics">Demographics</TabsTrigger>
                    <TabsTrigger value="pendency">Pendency Analysis</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Case Flow (Last Month)</CardTitle>
                            <CardDescription>Comparison of cases instituted vs disposed</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'Instituted', civil: data.instituted.civil, criminal: data.instituted.criminal },
                                { name: 'Disposed', civil: data.disposal.civil, criminal: data.disposal.criminal },
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tickFormatter={(value) => `${(value / 100000).toFixed(1)}L`} />
                                <Tooltip formatter={(value: number) => formatNumber(value)} />
                                <Legend />
                                <Bar dataKey="civil" name="Civil" fill={COLORS.civil} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="criminal" name="Criminal" fill={COLORS.criminal} radius={[4, 4, 0, 0]} />
                            </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                        </Card>

                        <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Gavel className="w-5 h-5" /> Disposal Nature</CardTitle>
                            <CardDescription>Breakdown of contested vs uncontested disposals</CardDescription>
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
                    </TabsContent>

                    <TabsContent value="demographics" className="space-y-4">
                        {/* Demographics content would go here, simplified for brevity */}
                        <div className="p-8 text-center text-muted-foreground border rounded-lg bg-white">
                            Detailed demographic breakdown available in the full dashboard.
                        </div>
                    </TabsContent>

                    <TabsContent value="pendency" className="space-y-4">
                        <Card>
                            <CardHeader>
                            <CardTitle>Age-wise Pendency</CardTitle>
                            <CardDescription>Distribution of cases based on duration pending</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.ageWise}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                                <Tooltip formatter={(value: number) => formatNumber(value)} />
                                <Legend />
                                <Area type="monotone" dataKey="civil" name="Civil Cases" stackId="1" stroke={COLORS.civil} fill={COLORS.civil} />
                                <Area type="monotone" dataKey="criminal" name="Criminal Cases" stackId="1" stroke={COLORS.criminal} fill={COLORS.criminal} />
                                </AreaChart>
                            </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-24 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-5">
                <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-green-500 rounded-full blur-3xl"></div>
             </div>
             <div className="container px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-4">{t.testimonials.title}</h2>
                    <p className="text-lg text-slate-600">{t.testimonials.subtitle}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {TESTIMONIALS.map((testimonial, i) => (
                        <Card key={i} className="bg-white border border-slate-100 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group">
                            <CardContent className="pt-6">
                                <Quote className="w-10 h-10 text-[#3F51B5]/20 mb-4" />
                                <p className="text-slate-600 mb-6 italic leading-relaxed">"{testimonial.content}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3F51B5] to-blue-600 flex items-center justify-center text-white font-bold text-sm">{testimonial.name.charAt(0)}</div>
                                    <div>
                                        <div className="font-bold text-slate-900">{testimonial.name}</div>
                                        <div className="text-xs text-slate-500">{testimonial.role}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
             </div>
        </section>

        {/* Why Choose Us Section (New) */}
        <section className="w-full py-24 bg-[#3F51B5] text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className="container px-4 md:px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">{t.whyChoose.title}</h2>
                        <p className="text-blue-100 text-lg leading-relaxed">
                            {t.whyChoose.subtitle}
                        </p>
                        <ul className="space-y-4">
                            {t.whyChoose.points.map((point, i) => (
                                <li key={i} className="flex items-center gap-3"><div className="bg-[#4CAF50] p-1 rounded-full"><Check className="w-4 h-4 text-white" /></div> <span>{point}</span></li>
                            ))}
                        </ul>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-2xl opacity-30"></div>
                        <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 p-4 rounded-xl text-center"><div className="text-3xl font-bold mb-1">24/7</div><div className="text-xs text-blue-200">Support</div></div>
                                <div className="bg-white/10 p-4 rounded-xl text-center"><div className="text-3xl font-bold mb-1">100%</div><div className="text-xs text-blue-200">Secure</div></div>
                                <div className="bg-white/10 p-4 rounded-xl text-center"><div className="text-3xl font-bold mb-1">AI</div><div className="text-xs text-blue-200">Powered</div></div>
                                <div className="bg-white/10 p-4 rounded-xl text-center"><div className="text-3xl font-bold mb-1">Free</div><div className="text-xs text-blue-200">Basic Access</div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Who Can Use Section */}
        <section id="who-can-use" className="w-full py-24 bg-white">
            <div className="container px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{t.whoCanUse.title}</h2>
                    <p className="text-slate-600 mt-4">{t.whoCanUse.subtitle}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <PersonaCard icon={<Users />} title={t.whoCanUse.cards.citizens.title} description={t.whoCanUse.cards.citizens.desc} />
                    <PersonaCard icon={<Briefcase />} title={t.whoCanUse.cards.lawyers.title} description={t.whoCanUse.cards.lawyers.desc} />
                    <PersonaCard icon={<Gavel />} title={t.whoCanUse.cards.judges.title} description={t.whoCanUse.cards.judges.desc} />
                </div>
            </div>
        </section>

        {/* Know Your Rights Section */}
        <section id="know-your-rights" className="w-full py-24 bg-slate-50">
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-4">{t.rights.title}</h2>
                    <p className="text-lg text-slate-600">{t.rights.subtitle}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {rightsDataLanding.map(right => (
                        <RightCard key={right.id} {...right} />
                    ))}
                </div>
                <div className="text-center mt-16">
                    <Link href="/know-your-rights">
                        <Button size="lg" variant="outline" className="border-[#3F51B5] text-[#3F51B5] hover:bg-[#3F51B5]/10">
                            {t.rights.explore} <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>

        {/* Accessibility Section */}
        <section id="accessibility" className="w-full py-24 bg-[#3F51B5] text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#283593] to-[#1A237E]"></div>
            <div className="container px-4 md:px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">{t.accessibility.title}</h2>
                        <p className="text-blue-100 text-lg mb-8">{t.accessibility.subtitle}</p>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="bg-white/10 p-3 rounded-lg h-fit"><Languages className="w-6 h-6 text-[#4CAF50]" /></div>
                                <div>
                                    <h3 className="font-bold text-xl">{t.accessibility.features.multilingual.title}</h3>
                                    <p className="text-blue-200">{t.accessibility.features.multilingual.desc}</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-white/10 p-3 rounded-lg h-fit"><Mic className="w-6 h-6 text-[#4CAF50]" /></div>
                                <div>
                                    <h3 className="font-bold text-xl">{t.accessibility.features.voice.title}</h3>
                                    <p className="text-blue-200">{t.accessibility.features.voice.desc}</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-white/10 p-3 rounded-lg h-fit"><BookOpen className="w-6 h-6 text-[#4CAF50]" /></div>
                                <div>
                                    <h3 className="font-bold text-xl">{t.accessibility.features.simple.title}</h3>
                                    <p className="text-blue-200">{t.accessibility.features.simple.desc}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Mock Chat Interface */}
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden text-slate-900 max-w-md mx-auto w-full">
                        <div className="bg-slate-100 p-4 border-b flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-xs font-medium text-slate-500 ml-2">NyayaAI Assistant (Hindi)</span>
                        </div>
                        <div className="p-6 space-y-4 h-[300px] overflow-y-auto bg-slate-50">
                            <div className="flex justify-end">
                                <div className="bg-[#3F51B5] text-white px-4 py-2 rounded-2xl rounded-tr-none max-w-[80%] shadow-md">
                                    "मुझे PIL दाखिल करने में मदद चाहिए"
                                </div>
                            </div>
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-200 text-slate-800 px-4 py-2 rounded-2xl rounded-tl-none max-w-[80%] shadow-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                        <BrainCircuit className="w-3 h-3 text-[#4CAF50]" />
                                        <span className="text-xs font-bold text-[#4CAF50]">NyayaAI Processing...</span>
                                    </div>
                                    मैं आपकी PIL दाखिल करने में मदद करूंगा। कृपया अपनी शिकायत का विवरण दें...
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-white flex gap-2">
                            <div className="h-10 bg-slate-100 rounded-full flex-1"></div>
                            <div className="h-10 w-10 bg-[#3F51B5] rounded-full flex items-center justify-center"><Mic className="w-5 h-5 text-white" /></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-24 bg-white">
          <div className="container px-4 md:px-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 md:p-16 text-center relative overflow-hidden shadow-2xl border border-slate-700">
                {/* Decorative circles */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-green-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
                
                <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">{t.cta.title}</h2>
                    <p className="text-slate-300 text-lg md:text-xl">
                        {t.cta.subtitle}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/register">
                            <Button size="lg" className="bg-[#4CAF50] hover:bg-[#43A047] text-white px-8 h-14 rounded-full text-lg font-semibold w-full sm:w-auto shadow-lg shadow-green-900/30 hover:shadow-green-900/50 transition-all hover:scale-105">
                                {t.cta.btnPrimary}
                            </Button>
                        </Link>
                        <Link href="#ai-tools">
                            <Button variant="outline" size="lg" className="bg-transparent border-slate-600 text-white hover:bg-white/10 px-8 h-14 rounded-full text-lg font-semibold w-full sm:w-auto hover:border-white/50 transition-all">
                                {t.cta.btnSecondary}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
          </div>
        </section>
      </main>

      {/* Feedback Section */}
      <section id="feedback" className="w-full py-24 bg-slate-50 border-t border-slate-200">
          <div className="container px-4 md:px-6">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{t.feedback.title}</h2>
              <p className="text-lg text-slate-600 mt-4">{t.feedback.subtitle}</p>
            </div>
            <Card className="max-w-3xl mx-auto shadow-lg border-t-4 border-t-[#3F51B5]">
              <CardContent className="p-8">
                <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium text-slate-700">Name</label>
                      <Input id="name" placeholder={t.feedback.form.name} value={feedbackForm.name} onChange={(e) => setFeedbackForm({...feedbackForm, name: e.target.value})} required className="bg-slate-50" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
                      <Input id="email" type="email" placeholder={t.feedback.form.email} value={feedbackForm.email} onChange={(e) => setFeedbackForm({...feedbackForm, email: e.target.value})} required className="bg-slate-50" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone Number</label>
                      <Input id="phone" type="tel" placeholder={t.feedback.form.phone} value={feedbackForm.phone} onChange={(e) => setFeedbackForm({...feedbackForm, phone: e.target.value})} className="bg-slate-50" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="role" className="text-sm font-medium text-slate-700">I am a...</label>
                      <Select value={feedbackForm.role} onValueChange={(val) => setFeedbackForm({...feedbackForm, role: val})}>
                        <SelectTrigger className="bg-slate-50">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Citizen">Citizen</SelectItem>
                          <SelectItem value="Lawyer">Lawyer</SelectItem>
                          <SelectItem value="Judge">Judge</SelectItem>
                          <SelectItem value="Student">Law Student</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-medium text-slate-700">Feedback Category</label>
                    <Select value={feedbackForm.category} onValueChange={(val) => setFeedbackForm({...feedbackForm, category: val})}>
                        <SelectTrigger className="bg-slate-50">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General">General Feedback</SelectItem>
                          <SelectItem value="Complaint">Complaint against Lawyer/Service</SelectItem>
                          <SelectItem value="Bug">Report a Bug</SelectItem>
                          <SelectItem value="Feature">Feature Request</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>

                  {feedbackForm.category === 'Complaint' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <label htmlFor="lawyerDetails" className="text-sm font-medium text-slate-700">Lawyer Name / Contact (if applicable)</label>
                      <Input id="lawyerDetails" placeholder="Name or details of the lawyer being reported" value={feedbackForm.lawyerDetails} onChange={(e) => setFeedbackForm({...feedbackForm, lawyerDetails: e.target.value})} className="bg-slate-50 border-red-200 focus-visible:ring-red-500" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium text-slate-700">Subject</label>
                    <Input id="subject" placeholder={t.feedback.form.subject} value={feedbackForm.subject} onChange={(e) => setFeedbackForm({...feedbackForm, subject: e.target.value})} required className="bg-slate-50" />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-slate-700">Detailed Message</label>
                    <Textarea id="message" placeholder={t.feedback.form.message} rows={5} value={feedbackForm.message} onChange={(e) => setFeedbackForm({...feedbackForm, message: e.target.value})} required className="bg-slate-50 resize-none" />
                  </div>

                  <Button type="submit" className="w-full bg-[#3F51B5] hover:bg-[#303F9F] h-11 text-base" disabled={isSubmittingFeedback}>
                    {isSubmittingFeedback ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    {t.feedback.form.submit}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
      </section>

      <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
        <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                <div className="space-y-4">
                    <Link className="flex items-center gap-2" href="#">
                        <div className="bg-[#3F51B5] p-1.5 rounded-md">
                            <Scale className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-900">NyayaAI</span>
                    </Link>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Making legal help faster, simpler, and accessible for everyone through artificial intelligence.
                    </p>
                    <div className="text-xs text-slate-400">
                        Powered by Artificial Intelligence for a Better Justice System
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 mb-4">{t.footer.about}</h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li><Link href="#" className="hover:text-[#3F51B5]">Our Mission</Link></li>
                        <li><Link href="#" className="hover:text-[#3F51B5]">How It Works</Link></li>
                        <li><Link href="#" className="hover:text-[#3F51B5]">Case Studies</Link></li>
                        <li><Link href="#" className="hover:text-[#3F51B5]">Press & Media</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 mb-4">{t.footer.legal}</h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li><Link href="#" className="hover:text-[#3F51B5]">Privacy Policy</Link></li>
                        <li><Link href="#" className="hover:text-[#3F51B5]">Terms & Conditions</Link></li>
                        <li><Link href="#" className="hover:text-[#3F51B5]">Disclaimer</Link></li>
                        <li><Link href="#" className="hover:text-[#3F51B5]">Accessibility Statement</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 mb-4">{t.footer.contact}</h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li>support@nyayaai.gov.in</li>
                        <li>1800-XXX-XXXX (Toll Free)</li>
                        <li>Ministry of Law & Justice, New Delhi</li>
                        <li><Link href="#feedback" className="text-[#3F51B5] font-medium hover:underline">Submit Feedback →</Link></li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-xs text-slate-500">© 2026 NyayaAI – AI in Judiciary System. All rights reserved.</p>
                <div className="text-xs text-slate-500 text-center md:text-right">
                    <span className="block md:inline">{t.footer.developedBy} </span>
                    <span className="hidden md:inline mx-2 text-slate-300">|</span>
                    <span className="block md:inline mt-1 md:mt-0"><a href="https://sanketjadhav.lovable.app/" target="_blank" rel="noopener noreferrer" className="font-medium text-slate-700 hover:text-[#3F51B5] underline decoration-slate-300 underline-offset-2 transition-all">Sanket Jadhav</a> • Yash Jonshale • Prachi Gaykwad • Sakshi Aagle</span>
                </div>
            </div>
        </div>
      </footer>

      {/* Floating Chatbot */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isChatOpen && (
            <Card className="w-[350px] md:w-[400px] h-[500px] shadow-2xl border-slate-200 mb-4 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
                <CardHeader className="bg-[#3F51B5] text-white p-4 rounded-t-xl flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                        <div className="bg-white/20 p-1.5 rounded-full">
                            <BrainCircuit className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-base">NyayaAI Assistant</CardTitle>
                            <CardDescription className="text-blue-200 text-xs">Powered by GenAI • Developed by Aaradhya</CardDescription>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => setIsChatOpen(false)}>
                        <X className="w-5 h-5" />
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 p-0 flex flex-col overflow-hidden bg-slate-50">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatScrollRef}>
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-[#3F51B5] text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isChatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-2 shadow-sm flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-[#3F51B5]" />
                                    <span className="text-xs text-slate-500">Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <form onSubmit={handleChatSubmit} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                        <Input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask about rights, laws..." className="flex-1" disabled={isChatLoading} />
                        <Button type="submit" size="icon" className="bg-[#3F51B5] hover:bg-[#303F9F]" disabled={!chatInput.trim() || isChatLoading}>
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </CardContent>
            </Card>
        )}
        <Button 
            size="lg" 
            className="h-14 w-14 rounded-full bg-[#3F51B5] hover:bg-[#303F9F] shadow-xl shadow-blue-900/20 transition-transform hover:scale-110"
            onClick={() => setIsChatOpen(!isChatOpen)}
        >
            {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </Button>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description, color, delay }: { icon: React.ReactNode, title: string, description: string, color: string, delay?: number }) {
    return (
        <div className="flex flex-col items-start space-y-3 border rounded-xl p-6 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white group cursor-default border-t-4 border-transparent hover:border-[#3F51B5]" style={{ animationDelay: `${delay}ms` }}>
            <div className={`p-3 rounded-lg ${color} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
                {description}
            </p>
        </div>
    )
}

function SummaryCard({ title, value, icon, color, subtext }: { title: string, value: number, icon: React.ReactNode, color: string, subtext: string }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
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

function RightCard({ title, description, category, article }: { title: string, description: string, category: string, article: string }) {
    return (
        <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group cursor-pointer border-l-4 border-l-transparent hover:border-l-[#3F51B5]">
            <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-white bg-[#3F51B5] px-3 py-1 rounded-full">{category}</span>
                <span className="text-xs font-mono text-slate-400">{article}</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-600 leading-relaxed">{description}</p>
        </div>
    )
}

function ToolCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay?: number }) {
    return (
        <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-slate-200 hover:border-[#3F51B5] hover:shadow-xl transition-all duration-300 shadow-sm group cursor-pointer hover:-translate-y-1" style={{ animationDelay: `${delay}ms` }}>
            <div className="p-2 bg-blue-50 text-[#3F51B5] rounded-lg shrink-0 group-hover:bg-[#3F51B5] group-hover:text-white transition-colors">
                {icon}
            </div>
            <div>
                <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                <p className="text-sm text-slate-600">{description}</p>
            </div>
        </div>
    )
}

function PersonaCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="text-center flex flex-col items-center p-8 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-slate-100 group cursor-default">
            <div className="w-16 h-16 bg-[#3F51B5] text-white rounded-full flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-600">{description}</p>
        </div>
    )
}
