'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase/provider';
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { CornerDownLeft, CircleDashed, User, Briefcase, FileText, Bot, CalendarIcon, AlertTriangle, Gavel, Scale, TrendingUp, ShieldAlert, CheckCircle, ListChecks, Star, Plus, UploadCloud, Image as ImageIcon, ExternalLink, Search, Link as LinkIcon, Video, BrainCircuit, BookCopy } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { predictBailOutcome, BailPredictorOutput } from '@/ai/flows/bail-predictor';
import { analyzeCase, CaseAnalysisOutput } from '@/ai/flows/case-analysis';
import { useLanguage } from '@/hooks/use-language';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select as UiSelect, SelectContent as UiSelectContent, SelectItem as UiSelectItem, SelectTrigger as UiSelectTrigger, SelectValue as UiSelectValue } from '@/components/ui/select';


interface Case {
  id: string;
  description: string;
  status: string;
  userId: string;
  lawyerId: string;
  userDisplayName: string;
  lawyerDisplayName: string;
  opposingLawyerId?: string;
  opposingLawyerName?: string;
  judgeId?: string;
  createdAt: { toDate: () => Date };
  nextHearingDate?: { toDate: () => Date };
  caseNotes?: string;
  userRequestsToEnd?: boolean;
  lawyerRequestsToEnd?: boolean;
  analysisReport?: string;
  userRating?: number;
  verdict?: string;
}

interface UserProfile {
    role: 'user' | 'lawyer' | 'judge' | 'admin';
    displayName: string;
    id: string;
    email: string;
    contactNumber: string;
    location: string;
}

interface Message {
  id: string;
  senderId: string;
  recipientId?: string;
  text: string;
  timestamp: { toDate: () => Date } | null;
  isOrder?: boolean;
  isEvidence?: boolean;
  imageUrl?: string;
  pdfLink?: string;
  videoLink?: string;
}

interface CaseDocument {
  id: string;
  name: string;
  url: string;
  uploadedBy: string;
  uploaderName?: string;
  uploaderRole?: string;
  pdfLink?: string;
  videoLink?: string;
  description?: string;
  createdAt: { toDate: () => Date } | null;
}

export default function CaseDetailPage() {
  const { caseId } = useParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const currentLanguage = t('languageName');

  const casePath = `cases/${caseId}`;
  const { data: caseData, loading: caseLoading } = useDoc<Case>(casePath);
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : '');
  
  const { data: clientProfile } = useDoc<UserProfile>(caseData ? `users/${caseData.userId}` : '');
  const { data: lawyerProfile } = useDoc<UserProfile>(caseData ? `users/${caseData.lawyerId}` : '');
  const { data: opposingLawyerProfile } = useDoc<UserProfile>(caseData?.opposingLawyerId ? `users/${caseData.opposingLawyerId}` : '');
  const { data: judgeProfile } = useDoc<UserProfile>(caseData?.judgeId ? `users/${caseData.judgeId}` : '');
  
  const messagesPath = `cases/${caseId}/messages`;
  const { data: messages, loading: messagesLoading } = useCollection<Message>(messagesPath);
  const { data: caseDocuments, loading: documentsLoading } = useCollection<CaseDocument>(`cases/${caseId}/documents`);

  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [caseNotes, setCaseNotes] = useState('');
  const [nextHearingDate, setNextHearingDate] = useState<Date | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  
  const [bailResult, setBailResult] = useState<BailPredictorOutput | null>(null);
  const [isPredictingBail, setIsPredictingBail] = useState(false);
  const [outcomeResult, setOutcomeResult] = useState<CaseAnalysisOutput | null>(null);
  const [isSimulatingOutcome, setIsSimulatingOutcome] = useState(false);
  const [recommendationResult, setRecommendationResult] = useState<CaseAnalysisOutput | null>(null);
  const [isGettingRecommendations, setIsGettingRecommendations] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<CaseAnalysisOutput | null>(null);
  const [judgeAnalysisResult, setJudgeAnalysisResult] = useState<CaseAnalysisOutput | null>(null);
  const [isJudgeAnalyzing, setIsJudgeAnalyzing] = useState(false);


  const [isEndCaseAlertOpen, setIsEndCaseAlertOpen] = useState(false);
  const [isEndingCase, setIsEndingCase] = useState(false);

  const [rating, setRating] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const [verdictInput, setVerdictInput] = useState('');
  const [orderInput, setOrderInput] = useState('');
  const [isIssuingOrder, setIsIssuingOrder] = useState(false);
  const [isDeliveringVerdict, setIsDeliveringVerdict] = useState(false);
  const [evidenceInput, setEvidenceInput] = useState('');
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePdfLink, setEvidencePdfLink] = useState('');
  const [evidenceVideoLink, setEvidenceVideoLink] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [documentDescription, setDocumentDescription] = useState('');
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<'all' | 'orders' | 'submissions'>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [documentPdfLink, setDocumentPdfLink] = useState('');
  const [documentVideoLink, setDocumentVideoLink] = useState('');
  const [isUploadVisible, setIsUploadVisible] = useState(false);
  const [documentFilter, setDocumentFilter] = useState<'all' | 'plaintiff' | 'defense' | 'court'>('all');
  const [selectedChat, setSelectedChat] = useState('all');

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const sortedMessages = messages.sort((a, b) => a.timestamp && b.timestamp ? a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime() : 0);

  const displayedMessages = useMemo(() => {
    if (!user) return [];
    return sortedMessages.filter(message => {
        // Orders and evidence submissions are treated as broadcast messages and only shown there.
        if (message.isOrder || message.isEvidence) {
            return selectedChat === 'all';
        }

        if (selectedChat === 'all') {
            // Show broadcast messages (recipientId is 'all' or undefined for old messages)
            return message.recipientId === 'all' || !message.recipientId;
        }
        
        // Private chat logic
        const me = user.uid;
        const other = selectedChat;
        
        const fromMeToOther = message.senderId === me && message.recipientId === other;
        const fromOtherToMe = message.senderId === other && message.recipientId === me;

        return fromMeToOther || fromOtherToMe;
    });
  }, [sortedMessages, selectedChat, user]);

  const isLawyer = userProfile?.role === 'lawyer' || userProfile?.role === 'judge'; // Judges can also edit notes/dates
  const isJudge = userProfile?.role === 'judge';

  const chatParticipants = useMemo(() => {
    if (!caseData || !user) return [];
    const participants = [];
    if (user.uid !== caseData.userId && clientProfile) { participants.push({ id: caseData.userId, name: clientProfile.displayName }); }
    if (user.uid !== caseData.lawyerId && lawyerProfile) { participants.push({ id: caseData.lawyerId, name: `${lawyerProfile.displayName} (Plaintiff Lawyer)` }); }
    if (caseData.opposingLawyerId && user.uid !== caseData.opposingLawyerId && opposingLawyerProfile) { participants.push({ id: caseData.opposingLawyerId, name: `${opposingLawyerProfile.displayName} (Defense Lawyer)` }); }
    if (caseData.judgeId && user.uid !== caseData.judgeId && judgeProfile) { participants.push({ id: caseData.judgeId, name: `${judgeProfile.displayName} (Judge)` }); }
    return participants;
  }, [caseData, user, clientProfile, lawyerProfile, opposingLawyerProfile, judgeProfile]);

  const filteredOrdersAndSubmissions = useMemo(() => {
    return messages
        .filter(m => m.isOrder || m.isEvidence)
        .filter(m => {
            if (orderFilter === 'orders') return m.isOrder;
            if (orderFilter === 'submissions') return m.isEvidence;
            return true;
        })
        .filter(m => {
            if (!orderSearch.trim()) return true;
            return m.text.toLowerCase().includes(orderSearch.toLowerCase());
        })
        .sort((a, b) => (b.timestamp?.toDate().getTime() || 0) - (a.timestamp?.toDate().getTime() || 0));
  }, [messages, orderFilter, orderSearch]);

  const filteredDocuments = useMemo(() => {
    if (!caseDocuments || !caseData) return [];
    return caseDocuments.filter(doc => {
        if (documentFilter === 'all') return true;
        
        if (documentFilter === 'plaintiff') return doc.uploadedBy === caseData.userId || doc.uploadedBy === caseData.lawyerId;
        if (documentFilter === 'defense') return doc.uploadedBy === caseData.opposingLawyerId;
        if (documentFilter === 'court') return doc.uploadedBy === caseData.judgeId;
        
        return true;
    });
  }, [caseDocuments, documentFilter, caseData]);

  useEffect(() => {
    if (!caseLoading && caseData && user) {
      if (user.uid !== caseData.userId && user.uid !== caseData.lawyerId && user.uid !== caseData.opposingLawyerId && user.uid !== caseData.judgeId && userProfile?.role !== 'admin') {
        router.push('/dashboard');
      }
      setCaseNotes(caseData.caseNotes || '');
      setNextHearingDate(caseData.nextHearingDate?.toDate());
      if (caseData.analysisReport) {
        try {
            setAnalysisReport(JSON.parse(caseData.analysisReport));
        } catch(e) {
            console.error("Failed to parse analysis report", e);
        }
      }
    }
  }, [caseData, caseLoading, user, router, userProfile]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo(0, scrollAreaRef.current.scrollHeight);
    }
  }, [messages]);

  const uploadToImgBB = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (data.success) {
      return data.data.url;
    }
    throw new Error('Image upload failed');
  };

  const handleSendMessage = async () => {
    if (!firestore || !user || !newMessage.trim()) return;

    setIsSending(true);
    const messagesCollection = collection(firestore, `cases/${caseId}/messages`);
    try {
      await addDoc(messagesCollection, {
        caseId,
        senderId: user.uid,
        recipientId: selectedChat,
        text: newMessage,
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message: ", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!firestore || !caseData) return;
    setIsSaving(true);
    try {
        const caseRef = doc(firestore, 'cases', caseData.id);
        await updateDoc(caseRef, {
            caseNotes,
            nextHearingDate: nextHearingDate || null,
        });
        toast({ title: t('caseDetail.toasts.success'), description: t('caseDetail.toasts.updated') });
    } catch (error) {
        console.error("Error updating case: ", error);
        toast({ variant: "destructive", title: t('caseDetail.toasts.error'), description: t('caseDetail.toasts.updateFailed') });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleSimulateOutcome = async () => {
    if (!caseData) return;
    setIsSimulatingOutcome(true);
    setOutcomeResult(null);
    try {
      const outcome = await analyzeCase({
        caseDetails: caseData.description,
        language: currentLanguage,
      });
      setOutcomeResult(outcome);
    } catch (error) {
      toast({ variant: "destructive", title: t('caseDetail.toasts.error'), description: t('caseDetail.toasts.simulateFailed') });
    } finally {
      setIsSimulatingOutcome(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (!caseData) return;
    setIsGettingRecommendations(true);
    setRecommendationResult(null);
    try {
      const outcome = await analyzeCase({
        caseDetails: caseData.description,
        language: currentLanguage,
      });
      setRecommendationResult(outcome);
    } catch (error) {
      toast({ variant: "destructive", title: t('caseDetail.toasts.error'), description: t('caseDetail.toasts.recFailed') });
    } finally {
      setIsGettingRecommendations(false);
    }
  };

  const handleJudgeAnalysis = async () => {
    if (!caseData) return;
    setIsJudgeAnalyzing(true);
    setJudgeAnalysisResult(null);
    try {
      // Combine description with any notes for a fuller context if available
      const context = `Case Description: ${caseData.description}\n\nNotes: ${caseData.caseNotes || 'None'}`;
      const result = await analyzeCase({
        caseDetails: context,
        language: currentLanguage,
      });
      setJudgeAnalysisResult(result);
    } catch (error) {
      toast({ variant: "destructive", title: t('caseDetail.toasts.analysisFailed'), description: t('caseDetail.toasts.analysisFailedDesc') });
    } finally {
      setIsJudgeAnalyzing(false);
    }
  };

  const handlePredictBail = async () => {
    if (!caseData) return;
    setIsPredictingBail(true);
    setBailResult(null);
    try {
      const result = await predictBailOutcome({ caseDetails: caseData.description });
      setBailResult(result);
    } catch (error) {
      toast({ variant: "destructive", title: t('caseDetail.toasts.error'), description: t('caseDetail.toasts.bailFailed') });
    } finally {
      setIsPredictingBail(false);
    }
  };

  const handleEndCaseRequest = async () => {
    if (!firestore || !caseData || !user || !userProfile) return;
    setIsEndingCase(true);

    const caseRef = doc(firestore, 'cases', caseData.id);

    const myRequestField = isLawyer ? 'lawyerRequestsToEnd' : 'userRequestsToEnd';
    const otherPartyHasRequested = isLawyer ? caseData.userRequestsToEnd : caseData.lawyerRequestsToEnd;

    try {
        if (otherPartyHasRequested) {
            // Both parties have agreed, close the case
            await updateDoc(caseRef, {
                [myRequestField]: true,
                status: 'closed'
            });
            toast({ title: t('caseDetail.toasts.caseClosed'), description: t('caseDetail.toasts.caseClosedDesc') });
        } else {
            // This is the first request
            await updateDoc(caseRef, {
                [myRequestField]: true
            });
            toast({ title: t('caseDetail.toasts.requestSent'), description: t('caseDetail.toasts.requestSentDesc') });
        }
    } catch (error) {
        console.error("Error ending case: ", error);
        toast({ variant: "destructive", title: t('caseDetail.toasts.error'), description: t('caseDetail.toasts.processFailed') });
    } finally {
        setIsEndingCase(false);
        setIsEndCaseAlertOpen(false);
    }
  };

  const handleRateLawyer = async () => {
    if (!firestore || !caseData || rating === 0) return;
    setIsSubmittingRating(true);
    try {
        const caseRef = doc(firestore, 'cases', caseData.id);
        await updateDoc(caseRef, { userRating: rating });

        const lawyerRef = doc(firestore, 'users', caseData.lawyerId);
        const lawyerSnap = await getDoc(lawyerRef);

        if (lawyerSnap.exists()) {
            const lawyerData = lawyerSnap.data();
            const currentRating = lawyerData.rating || 0;
            const currentCount = lawyerData.ratingCount || 0;
            
            const newCount = currentCount + 1;
            const newAverage = ((currentRating * currentCount) + rating) / newCount;

            await updateDoc(lawyerRef, {
                rating: parseFloat(newAverage.toFixed(1)),
                ratingCount: newCount
            });
        }
        
        toast({ title: t('caseDetail.toasts.thankYou'), description: t('caseDetail.toasts.ratingSubmitted') });
    } catch (error) {
        console.error("Error submitting rating:", error);
        toast({ variant: "destructive", title: t('caseDetail.toasts.error'), description: t('caseDetail.toasts.ratingFailed') });
    } finally {
        setIsSubmittingRating(false);
    }
  };

  const handleIssueOrder = async () => {
    if (!firestore || !user || !orderInput.trim()) return;
    setIsIssuingOrder(true);
    try {
        const messagesCollection = collection(firestore, `cases/${caseId}/messages`);
        await addDoc(messagesCollection, {
            caseId,
            senderId: user.uid,
            text: `COURT ORDER: ${orderInput}`,
            isOrder: true,
            timestamp: serverTimestamp(),
        });
        toast({ title: t('caseDetail.toasts.orderIssued'), description: t('caseDetail.toasts.orderIssuedDesc') });
        setOrderInput('');
        setIsOrderDialogOpen(false);
    } catch (error) {
        console.error("Error issuing order: ", error);
        toast({ variant: "destructive", title: t('caseDetail.toasts.error'), description: t('caseDetail.toasts.orderFailed') });
    } finally {
        setIsIssuingOrder(false);
    }
  };

  const handleSubmitEvidence = async () => {
    if (!firestore || !user || (!evidenceInput.trim() && !evidenceFile && !evidencePdfLink && !evidenceVideoLink)) return;
    setIsSubmittingEvidence(true);
    try {
        let imageUrl = null;
        if (evidenceFile) {
            imageUrl = await uploadToImgBB(evidenceFile);
        }

        const messagesCollection = collection(firestore, `cases/${caseId}/messages`);
        await addDoc(messagesCollection, {
            caseId,
            senderId: user.uid,
            text: `SUBMISSION: ${evidenceInput}`,
            isEvidence: true,
            imageUrl: imageUrl,
            pdfLink: evidencePdfLink,
            videoLink: evidenceVideoLink,
            timestamp: serverTimestamp(),
        });
        toast({ title: t('caseDetail.toasts.evidenceSubmitted'), description: t('caseDetail.toasts.evidenceSubmittedDesc') });
        setEvidenceInput('');
        setEvidenceFile(null);
        setEvidencePdfLink('');
        setEvidenceVideoLink('');
        setIsOrderDialogOpen(false);
    } catch (error) {
        console.error("Error submitting evidence: ", error);
        toast({ variant: "destructive", title: t('caseDetail.toasts.error'), description: t('caseDetail.toasts.evidenceFailed') });
    } finally {
        setIsSubmittingEvidence(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!firestore || !user || (!documentFile && !documentPdfLink && !documentVideoLink)) return;
    setIsUploadingDocument(true);
    try {
        let imageUrl = '';
        if (documentFile) {
            imageUrl = await uploadToImgBB(documentFile);
        }
        const docsCollection = collection(firestore, `cases/${caseId}/documents`);
        await addDoc(docsCollection, {
            name: documentFile ? documentFile.name : (documentPdfLink ? 'External Document' : 'External Video'),
            url: imageUrl,
            pdfLink: documentPdfLink,
            videoLink: documentVideoLink,
            uploadedBy: user.uid,
            uploaderName: user.displayName || 'Unknown',
            uploaderRole: userProfile?.role || 'unknown',
            description: documentDescription,
            createdAt: serverTimestamp(),
        });
        toast({ title: t('caseDetail.toasts.docUploaded'), description: t('caseDetail.toasts.docUploadedDesc') });
        setDocumentFile(null);
        setDocumentPdfLink('');
        setDocumentVideoLink('');
        setDocumentDescription('');
        setIsUploadVisible(false);
    } catch (error) {
        console.error("Error uploading document: ", error);
        toast({ variant: "destructive", title: t('caseDetail.toasts.error'), description: t('caseDetail.toasts.docUploadFailed') });
    } finally {
        setIsUploadingDocument(false);
    }
  };

  const handleDeliverVerdict = async () => {
    if (!firestore || !caseData || !verdictInput.trim()) return;
    setIsDeliveringVerdict(true);
    try {
        const caseRef = doc(firestore, 'cases', caseData.id);
        await updateDoc(caseRef, {
            status: 'closed',
            verdict: verdictInput,
        });
        toast({ title: t('caseDetail.toasts.verdictDelivered'), description: t('caseDetail.toasts.verdictDeliveredDesc') });
    } catch (error) {
        console.error("Error delivering verdict: ", error);
        toast({ variant: "destructive", title: t('caseDetail.toasts.error'), description: t('caseDetail.toasts.verdictFailed') });
    } finally {
        setIsDeliveringVerdict(false);
    }
  };

  if (caseLoading || profileLoading) {
    return <Skeleton className="w-full h-96" />;
  }

  if (!caseData) {
    return <div className="text-center">Case not found.</div>;
  }

  const getUserInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'U';

  const myRequest = isLawyer ? caseData.lawyerRequestsToEnd : caseData.userRequestsToEnd;
  const otherPartyRequest = isLawyer ? caseData.userRequestsToEnd : caseData.lawyerRequestsToEnd;

  let endCaseDescription = t('caseDetail.overview.endCaseDesc');
  if (myRequest) {
      endCaseDescription = t('caseDetail.overview.myRequestDesc');
  } else if (otherPartyRequest) {
      endCaseDescription = t('caseDetail.overview.otherRequestDesc');
  }

  const endCaseButtonText = otherPartyRequest ? t('caseDetail.overview.confirmClosure') : t('caseDetail.overview.requestEnd');
  const endCaseAlertDescription = otherPartyRequest ? t('caseDetail.overview.alertDescConfirm') : t('caseDetail.overview.alertDescRequest');

  const mostLikelyOutcome = analysisReport?.potentialOutcomes?.[0];
  const probabilityData = mostLikelyOutcome
    ? [{ name: 'Favorable', value: mostLikelyOutcome.probability }, { name: 'Unfavorable', value: 1 - mostLikelyOutcome.probability }]
    : [];
  const COLORS = ['hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <div>
      <Tabs defaultValue="overview" className="w-full">
      <TabsList className="flex w-full h-auto p-1 bg-muted rounded-lg overflow-x-auto">
        <TabsTrigger value="overview" className="flex-1 min-w-[90px]">{t('caseDetail.tabs.overview')}</TabsTrigger>
        <TabsTrigger value="chat" className="flex-1 min-w-[90px]">{t('caseDetail.tabs.chat')}</TabsTrigger>
        <TabsTrigger value="orders" className="flex-1 min-w-[90px]">{t('caseDetail.tabs.orders')}</TabsTrigger>
        <TabsTrigger value="documents" className="flex-1 min-w-[90px]">{t('caseDetail.tabs.documents')}</TabsTrigger>
        {isJudge && <TabsTrigger value="judge-ai" className="flex-1 min-w-[110px]">{t('caseDetail.tabs.judgeAi')}</TabsTrigger>}
        {isLawyer && <TabsTrigger value="ai-toolkit" className="flex-1 min-w-[110px]">{t('caseDetail.tabs.aiToolkit')}</TabsTrigger>}
      </TabsList>
      
      <TabsContent value="overview" className="mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                {isJudge && caseData.status !== 'closed' && (
                    <Card className="border-l-4 border-l-primary shadow-md">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><Gavel className="w-5 h-5" /> {t('caseDetail.overview.judicialControls')}</CardTitle>
                            <CardDescription>{t('caseDetail.overview.judicialControlsDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Next Hearing Date */}
                            <div className="space-y-2">
                                <Label>{t('caseDetail.overview.scheduleHearing')}</Label>
                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-[240px] justify-start text-left font-normal", !nextHearingDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {nextHearingDate ? format(nextHearingDate, "PPP") : <span>{t('caseDetail.overview.pickDate')}</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={nextHearingDate} onSelect={setNextHearingDate} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                    <Button onClick={handleSaveChanges} disabled={isSaving} size="sm">{t('caseDetail.overview.updateDate')}</Button>
                                </div>
                            </div>

                            {/* Final Verdict */}
                            <div className="pt-4 border-t">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="default" className="w-full bg-slate-900 text-white hover:bg-slate-800">{t('caseDetail.overview.deliverVerdict')}</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>{t('caseDetail.overview.deliverVerdict')}</DialogTitle>
                                            <DialogDescription>{t('caseDetail.overview.deliverVerdictDesc')}</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <Label>{t('caseDetail.overview.verdictLabel')}</Label>
                                            <Textarea placeholder={t('caseDetail.overview.verdictPlaceholder')} className="min-h-[150px]" value={verdictInput} onChange={(e) => setVerdictInput(e.target.value)} />
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleDeliverVerdict} disabled={isDeliveringVerdict || !verdictInput.trim()}>{isDeliveringVerdict && <CircleDashed className="mr-2 h-4 w-4 animate-spin" />} {t('caseDetail.overview.pronounceVerdict')}</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">{t('caseDetail.overview.caseDetails')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold">{t('caseDetail.overview.status')}</h4>
                            <Badge variant={caseData.status === 'active' ? 'default' : caseData.status === 'pending' ? 'secondary' : 'destructive'}>{caseData.status}</Badge>
                        </div>
                        <div>
                            <h4 className="font-semibold">{t('caseDetail.overview.initialComplaint')}</h4>
                            <p className="text-muted-foreground text-sm">{caseData.description}</p>
                        </div>
                         <div>
                            <h4 className="font-semibold">{t('caseDetail.overview.startedOn')}</h4>
                            <p className="text-muted-foreground text-sm">{caseData.createdAt ? format(caseData.createdAt.toDate(), 'PPP') : 'N/A'}</p>
                        </div>
                        {caseData.status === 'closed' && caseData.verdict && (
                            <div>
                                <h4 className="font-semibold text-primary mb-2">{t('caseDetail.overview.finalVerdict')}</h4>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-md border-l-4 border-primary text-sm leading-relaxed">{caseData.verdict}</div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">{t('caseDetail.overview.timelineNotes')}</CardTitle>
                        <CardDescription>{t('caseDetail.overview.timelineNotesDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div>
                            <Label htmlFor="next-hearing">{t('caseDetail.overview.nextHearing')}</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !nextHearingDate && "text-muted-foreground"
                                    )}
                                    disabled={!isLawyer || isJudge} // Disable here if judge uses the top card, or keep enabled. Let's disable to avoid confusion if judge card is present.
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {nextHearingDate ? format(nextHearingDate, "PPP") : <span>{isLawyer && !isJudge ? t('caseDetail.overview.pickDate') : t('caseDetail.overview.notSet')}</span>}
                                    </Button>
                                </PopoverTrigger>
                                {isLawyer && (
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                        mode="single"
                                        selected={nextHearingDate}
                                        onSelect={setNextHearingDate}
                                        initialFocus
                                        />
                                    </PopoverContent>
                                )}
                            </Popover>
                        </div>
                        <div>
                            <Label htmlFor="case-notes">{t('caseDetail.overview.caseNotes')}</Label>
                            <Textarea id="case-notes" value={caseNotes} onChange={(e) => isLawyer && setCaseNotes(e.target.value)} placeholder={isLawyer ? t('caseDetail.overview.caseNotesPlaceholder') : t('caseDetail.overview.noNotes')} className="min-h-[150px]" readOnly={!isLawyer} />
                        </div>
                        {isLawyer && !isJudge && (
                            <Button onClick={handleSaveChanges} disabled={isSaving}>
                                {isSaving && <CircleDashed className="animate-spin mr-2" />}
                                {t('caseDetail.overview.saveChanges')}
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {analysisReport && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">{t('caseDetail.overview.initialAnalysis')}</CardTitle>
                            <CardDescription>{t('caseDetail.overview.initialAnalysisDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-6 h-6 text-primary" />
                                        <CardTitle className="font-headline">{t('caseDetail.judgeAi.desc')}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{analysisReport.caseSummary}</p>
                                </CardContent>
                            </Card>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card className="shadow-sm">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <TrendingUp className="w-6 h-6 text-green-500" />
                                            <CardTitle className="font-headline">{t('caseDetail.judgeAi.strengths')}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-3">
                                            {analysisReport.strengths.map((item, i) => <li key={i} className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" /> <span className="text-muted-foreground">{item}</span></li>)}
                                        </ul>
                                    </CardContent>
                                </Card>
                                <Card className="shadow-sm">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <ShieldAlert className="w-6 h-6 text-yellow-500" />
                                            <CardTitle className="font-headline">{t('caseDetail.judgeAi.weaknesses')}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-3">
                                            {analysisReport.weaknesses.map((item, i) => <li key={i} className="flex items-start gap-3"><AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" /> <span className="text-muted-foreground">{item}</span></li>)}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="shadow-sm">
                                <CardHeader>
                                <div className="flex items-center gap-3">
                                    <ListChecks className="w-6 h-6 text-primary" />
                                    <CardTitle className="font-headline">{t('caseDetail.judgeAi.recommendations')}</CardTitle>
                                </div>
                                </CardHeader>
                                <CardContent>
                                    <ol className="space-y-3 list-decimal list-inside">
                                        {analysisReport.recommendedNextSteps.map((item, i) => <li key={i} className="text-muted-foreground">{item}</li>)}
                                    </ol>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {mostLikelyOutcome && (
                                    <Card className="shadow-sm">
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <Gavel className="w-6 h-6 text-primary" />
                                                <CardTitle className="font-headline">{t('caseDetail.judgeAi.scenarios')}</CardTitle>
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
                                            <CardTitle className="font-headline">{t('caseDetail.aiToolkit.similarPrecedents')}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <Accordion type="single" collapsible className="w-full">
                                            {analysisReport.similarCasePrecedents.map((precedent, index) => (
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
                                <AlertTitle className="font-headline text-yellow-700">{t('caseDetail.judgeAi.disclaimerTitle')}</AlertTitle>
                                <AlertDescription className="text-yellow-600">
                                    {analysisReport.disclaimer}
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                )}


                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">{t('caseDetail.overview.caseActions')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {caseData.status !== 'closed' && !isJudge ? (
                            <div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {endCaseDescription}
                                </p>
                                <AlertDialog open={isEndCaseAlertOpen} onOpenChange={setIsEndCaseAlertOpen}>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="destructive"
                                            disabled={myRequest}
                                        >
                                            {endCaseButtonText}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>{t('caseDetail.overview.alertTitle')}</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                {endCaseAlertDescription}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel disabled={isEndingCase}>{t('caseDetail.overview.cancel')}</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleEndCaseRequest} disabled={isEndingCase}>
                                                {isEndingCase && <CircleDashed className="animate-spin mr-2" />}
                                                {t('caseDetail.overview.continue')}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ) : caseData.status === 'closed' ? (
                            <div className="space-y-4">
                                <p className="text-sm font-semibold text-destructive">{t('caseDetail.overview.caseClosed')}</p>
                                {!isLawyer && (
                                    <div className="pt-4 border-t">
                                        <h4 className="font-semibold mb-2">{t('caseDetail.overview.rateLawyer')}</h4>
                                        {caseData.userRating ? (
                                            <div className="flex items-center gap-1 text-yellow-500">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={cn("w-5 h-5", i < (caseData.userRating || 0) ? "fill-current" : "text-muted-foreground")} />
                                                ))}
                                                <span className="text-muted-foreground text-sm ml-2">{t('caseDetail.overview.youRated')}</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <p className="text-sm text-muted-foreground">{t('caseDetail.overview.rateExperience', { name: caseData.lawyerDisplayName })}</p>
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                                                            <Star className={cn("w-6 h-6 transition-colors", star <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground")} />
                                                        </button>
                                                    ))}
                                                </div>
                                                <Button size="sm" onClick={handleRateLawyer} disabled={rating === 0 || isSubmittingRating}>
                                                    {isSubmittingRating && <CircleDashed className="w-4 h-4 mr-2 animate-spin" />}
                                                    {t('caseDetail.overview.submitRating')}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : isJudge ? <p className="text-sm text-muted-foreground">{t('caseDetail.overview.judgeManage')}</p> : null}
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><User className="w-5 h-5 text-primary" /> {t('caseDetail.overview.client')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                        <p className="font-semibold">{clientProfile?.displayName}</p>
                        <p className="text-muted-foreground">{clientProfile?.email}</p>
                        <p className="text-muted-foreground">{clientProfile?.contactNumber}</p>
                        <p className="text-muted-foreground">{clientProfile?.location}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" /> {t('caseDetail.overview.plaintiffLawyer')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                        <p className="font-semibold">{lawyerProfile?.displayName}</p>
                        <p className="text-muted-foreground">{lawyerProfile?.email}</p>
                        <p className="text-muted-foreground">{lawyerProfile?.contactNumber}</p>
                        <p className="text-muted-foreground">{lawyerProfile?.location}</p>
                    </CardContent>
                </Card>
                {caseData.opposingLawyerId && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><Briefcase className="w-5 h-5 text-destructive" /> {t('caseDetail.overview.defenseLawyer')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                            <p className="font-semibold">{opposingLawyerProfile?.displayName || caseData.opposingLawyerName}</p>
                            <p className="text-muted-foreground">{opposingLawyerProfile?.email}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
      </TabsContent>
      
      <TabsContent value="chat" className="mt-4">
         <Card className="h-[calc(100vh-14rem)] flex flex-col shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="font-headline">{t('caseDetail.chat.title')}</CardTitle>
            <div className="flex items-center gap-2">
                <Label htmlFor="chat-select" className="text-sm text-muted-foreground">{t('caseDetail.chat.to')}</Label>
                <UiSelect value={selectedChat} onValueChange={setSelectedChat}>
                    <UiSelectTrigger id="chat-select" className="w-auto md:w-[250px]">
                        <UiSelectValue placeholder={t('caseDetail.chat.selectRecipient')} />
                    </UiSelectTrigger>
                    <UiSelectContent>
                        <UiSelectItem value="all">{t('caseDetail.chat.broadcast')}</UiSelectItem>
                        {chatParticipants.map(p => (
                            <UiSelectItem key={p.id} value={p.id}>{p.name}</UiSelectItem>
                        ))}
                    </UiSelectContent>
                </UiSelect>
            </div>
          </CardHeader>
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
             <div className="space-y-6">
              {messagesLoading && <CircleDashed className="mx-auto w-8 h-8 animate-spin text-primary" />}
              {displayedMessages.map((message) => {
                const isUser = message.senderId === user?.uid;
                const senderProfile = [clientProfile, lawyerProfile, opposingLawyerProfile, judgeProfile].find(p => p && p.id === message.senderId);
                const senderName = isUser ? user?.displayName : senderProfile?.displayName || 'Unknown';
                const isOrder = message.isOrder;
                const isEvidence = message.isEvidence;
                return (
                  <div key={message.id} className={cn('flex items-start gap-3', isUser ? 'justify-end' : 'justify-start')}>
                     {!isUser && <Avatar className="w-8 h-8 border"><AvatarFallback>{getUserInitials(senderName || 'L')}</AvatarFallback></Avatar>}
                     <div className={cn('max-w-md rounded-lg px-4 py-3 text-sm', isOrder ? 'bg-red-50 border border-red-200 text-red-900 dark:bg-red-900/20 dark:text-red-100' : isEvidence ? 'bg-blue-50 border border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100' : isUser ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                       {isOrder && <div className="font-bold text-xs mb-1 flex items-center gap-1"><Gavel className="w-3 h-3" /> {t('caseDetail.chat.courtOrder')}</div>}
                       {isEvidence && <div className="font-bold text-xs mb-1 flex items-center gap-1"><FileText className="w-3 h-3" /> {t('caseDetail.chat.submission')}</div>}
                       <p>{message.text}</p>
                       {message.imageUrl && (
                            <div className="mt-2">
                                <a href={message.imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 underline mb-1"><ExternalLink className="w-3 h-3" /> {t('caseDetail.chat.viewImage')}</a>
                                <img src={message.imageUrl} alt="Attachment" className="max-w-full rounded-md border max-h-48" />
                            </div>
                       )}
                       {message.pdfLink && (
                            <a href={message.pdfLink} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 underline mt-2 text-blue-600"><LinkIcon className="w-3 h-3" /> {t('caseDetail.chat.viewDoc')}</a>
                       )}
                       {message.videoLink && (
                            <a href={message.videoLink} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 underline mt-1 text-blue-600"><Video className="w-3 h-3" /> {t('caseDetail.chat.watchVideo')}</a>
                       )}
                       <p className={cn("text-xs mt-2", isUser ? 'text-primary-foreground/70' : 'text-muted-foreground/70')}>
                         {message.timestamp ? format(message.timestamp.toDate(), 'p') : ''}
                       </p>
                     </div>
                     {isUser && <Avatar className="w-8 h-8 border"><AvatarFallback>{getUserInitials(user?.displayName || 'U')}</AvatarFallback></Avatar>}
                  </div>
                );
              })}
             </div>
          </ScrollArea>
          <div className="p-4 border-t">
            <div className="relative">
              <Textarea
                placeholder={t('caseDetail.chat.typeMessage')}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="pr-16 min-h-[48px] resize-none"
                rows={1}
                disabled={isSending}
              />
              <Button type="submit" size="icon" className="absolute top-1/2 right-3 -translate-y-1/2" onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
                {isSending ? <CircleDashed className="w-4 h-4 animate-spin" /> : <CornerDownLeft className="w-4 h-4" />}
                <span className="sr-only">{t('caseDetail.chat.send')}</span>
              </Button>
            </div>
          </div>
        </Card>
      </TabsContent>
      
      <TabsContent value="orders" className="mt-4">
        <Card className="border-t-4 border-t-destructive shadow-sm h-[calc(100vh-14rem)] flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="font-headline flex items-center gap-2"><Gavel className="w-5 h-5 text-destructive" /> {t('caseDetail.orders.title')}</CardTitle>
                    <CardDescription>{t('caseDetail.orders.desc')}</CardDescription>
                </div>
                {(isJudge || (isLawyer && !isJudge)) && caseData.status !== 'closed' && (
                    <Button onClick={() => setIsOrderDialogOpen(true)} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        {isJudge ? t('caseDetail.orders.issueOrder') : t('caseDetail.orders.submitResponse')}
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col min-h-0">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('caseDetail.orders.searchPlaceholder')}
                            value={orderSearch}
                            onChange={(e) => setOrderSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" variant={orderFilter === 'all' ? 'default' : 'outline'} onClick={() => setOrderFilter('all')}>{t('caseDetail.orders.all')}</Button>
                        <Button size="sm" variant={orderFilter === 'orders' ? 'default' : 'outline'} onClick={() => setOrderFilter('orders')}>{t('caseDetail.orders.orders')}</Button>
                        <Button size="sm" variant={orderFilter === 'submissions' ? 'default' : 'outline'} onClick={() => setOrderFilter('submissions')}>{t('caseDetail.orders.submissions')}</Button>
                    </div>
                </div>

                <ScrollArea className="flex-1 w-full rounded-md border p-4">
                    {filteredOrdersAndSubmissions.length > 0 ? (
                        <div className="space-y-4">
                            {filteredOrdersAndSubmissions.map((msg) => (
                                <div key={msg.id} className={cn("flex flex-col gap-2 p-4 rounded-lg border text-sm transition-colors", msg.isOrder ? "bg-destructive/5 border-destructive/20 hover:bg-destructive/10" : "bg-primary/5 border-primary/20 hover:bg-primary/10")}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 font-semibold">
                                            {msg.isOrder ? <Gavel className="w-4 h-4 text-destructive" /> : <FileText className="w-4 h-4 text-primary" />}
                                            <span className={msg.isOrder ? "text-destructive" : "text-primary"}>{msg.isOrder ? t('caseDetail.chat.courtOrder') : t('caseDetail.chat.submission')}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{msg.timestamp ? format(msg.timestamp.toDate(), 'PPP p') : ''}</span>
                                    </div>
                                    <p className="leading-relaxed text-foreground/90">{msg.text.replace('COURT ORDER: ', '').replace('SUBMISSION: ', '')}</p>
                                    {msg.imageUrl && (
                                        <div className="mt-2">
                                            <div className="relative group cursor-pointer overflow-hidden rounded-md border bg-background w-fit" onClick={() => setViewingImageUrl(msg.imageUrl)}>
                                                <img src={msg.imageUrl} alt="Attachment" className="h-32 w-auto object-cover transition-transform group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <ExternalLink className="w-5 h-5 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {msg.pdfLink && (
                                        <a href={msg.pdfLink} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-blue-600 hover:underline mt-1"><LinkIcon className="w-3 h-3" /> {t('caseDetail.orders.externalDoc')}</a>
                                    )}
                                    {msg.videoLink && (
                                        <a href={msg.videoLink} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-blue-600 hover:underline mt-1"><Video className="w-3 h-3" /> {t('caseDetail.orders.externalVideo')}</a>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                            <Search className="w-8 h-8 mb-2" />
                            <p className="text-sm">{t('caseDetail.orders.noItems')}</p>
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="documents" className="mt-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex flex-col space-y-1.5">
                    <CardTitle className="font-headline flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> {t('caseDetail.documents.title')}</CardTitle>
                    <CardDescription>{t('caseDetail.documents.desc')}</CardDescription>
                </div>
                {(isLawyer || isJudge) && (
                    <Button onClick={() => setIsUploadVisible(true)} size="sm" className="h-9">
                        <Plus className="w-4 h-4 mr-2" /> Add Document
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-2">
                    <Button size="sm" variant={documentFilter === 'all' ? 'default' : 'outline'} onClick={() => setDocumentFilter('all')}>{t('caseDetail.documents.all')}</Button>
                    <Button size="sm" variant={documentFilter === 'plaintiff' ? 'default' : 'outline'} onClick={() => setDocumentFilter('plaintiff')}>{t('caseDetail.documents.plaintiff')}</Button>
                    <Button size="sm" variant={documentFilter === 'defense' ? 'default' : 'outline'} onClick={() => setDocumentFilter('defense')}>{t('caseDetail.documents.defense')}</Button>
                    <Button size="sm" variant={documentFilter === 'court' ? 'default' : 'outline'} onClick={() => setDocumentFilter('court')}>{t('caseDetail.documents.court')}</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDocuments.map((doc) => (
                        <Card key={doc.id} className="overflow-hidden group">
                            <div className="aspect-video relative bg-muted flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => doc.url && setViewingImageUrl(doc.url)}>
                                {doc.url ? (
                                    <img src={doc.url} alt={doc.name} className="object-cover w-full h-full transition-transform group-hover:scale-105" />
                                ) : (
                                    <FileText className="w-12 h-12 text-muted-foreground" />
                                )}
                            </div>
                            <div className="p-3">
                                <p className="font-medium truncate text-sm" title={doc.name}>{doc.name}</p>
                                {doc.uploaderName && <p className="text-[10px] text-muted-foreground">{t('caseDetail.documents.by')} {doc.uploaderName}</p>}
                                {doc.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2" title={doc.description}>{doc.description}</p>}
                                <p className="text-xs text-muted-foreground mt-1">{doc.createdAt ? format(doc.createdAt.toDate(), 'PPP') : t('caseDetail.documents.unknownDate')}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {doc.url && <Button variant="link" size="sm" className="px-0 h-auto" onClick={() => setViewingImageUrl(doc.url)}>{t('caseDetail.documents.viewImage')} <ExternalLink className="ml-1 w-3 h-3" /></Button>}
                                    {doc.pdfLink && <Button variant="link" size="sm" className="px-0 h-auto" asChild><a href={doc.pdfLink} target="_blank" rel="noopener noreferrer">{t('caseDetail.documents.openDoc')} <LinkIcon className="ml-1 w-3 h-3" /></a></Button>}
                                    {doc.videoLink && <Button variant="link" size="sm" className="px-0 h-auto" asChild><a href={doc.videoLink} target="_blank" rel="noopener noreferrer">{t('caseDetail.documents.watchVideo')} <Video className="ml-1 w-3 h-3" /></a></Button>}
                                </div>
                            </div>
                        </Card>
                    ))}
                    {filteredDocuments.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">{t('caseDetail.documents.noDocs')}</p>}
                </div>
            </CardContent>
        </Card>
      </TabsContent>

      {isJudge && (
        <TabsContent value="judge-ai" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-primary" /> {t('caseDetail.judgeAi.title')}</CardTitle>
                    <CardDescription>{t('caseDetail.judgeAi.desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!judgeAnalysisResult && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <p className="text-muted-foreground text-center max-w-md">
                                {t('caseDetail.judgeAi.analyzePrompt')}
                            </p>
                            <Button onClick={handleJudgeAnalysis} disabled={isJudgeAnalyzing} size="lg">
                                {isJudgeAnalyzing && <CircleDashed className="mr-2 h-5 w-5 animate-spin" />}
                                {isJudgeAnalyzing ? t('caseDetail.judgeAi.analyzing') : t('caseDetail.judgeAi.generate')}
                            </Button>
                        </div>
                    )}

                    {judgeAnalysisResult && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-end">
                                <Button variant="outline" size="sm" onClick={handleJudgeAnalysis} disabled={isJudgeAnalyzing}>
                                    <TrendingUp className="w-4 h-4 mr-2" /> {t('caseDetail.judgeAi.refresh')}
                                </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="bg-muted/30">
                                    <CardHeader className="pb-2"><CardTitle className="text-base font-semibold text-green-600">{t('caseDetail.judgeAi.strengths')}</CardTitle></CardHeader>
                                    <CardContent>
                                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                            {judgeAnalysisResult.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                        </ul>
                                    </CardContent>
                                </Card>
                                <Card className="bg-muted/30">
                                    <CardHeader className="pb-2"><CardTitle className="text-base font-semibold text-red-600">{t('caseDetail.judgeAi.weaknesses')}</CardTitle></CardHeader>
                                    <CardContent>
                                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                            {judgeAnalysisResult.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="border-l-4 border-l-primary">
                                <CardHeader><CardTitle className="text-lg">{t('caseDetail.judgeAi.outcomesTips')}</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2">{t('caseDetail.judgeAi.scenarios')}</h4>
                                        <ul className="space-y-2">
                                            {judgeAnalysisResult.potentialOutcomes.map((outcome, i) => (
                                                <li key={i} className="flex justify-between items-center bg-background p-3 rounded-md border text-sm">
                                                    <span>{outcome.outcome}</span>
                                                    <Badge variant={i === 0 ? "default" : "secondary"}>{(outcome.probability * 100).toFixed(0)}% {t('caseDetail.aiToolkit.likelihood')}</Badge>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2">{t('caseDetail.judgeAi.recommendations')}</h4>
                                        <ul className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
                                            {judgeAnalysisResult.recommendedNextSteps.map((step, i) => <li key={i}>{step}</li>)}
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>

                            <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                <AlertTitle>{t('caseDetail.judgeAi.disclaimerTitle')}</AlertTitle>
                                <AlertDescription className="text-xs">
                                    {t('caseDetail.judgeAi.disclaimer')}
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      )}

      {isLawyer && (
        <TabsContent value="ai-toolkit" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><Gavel className="w-5 h-5 text-primary" /> {t('caseDetail.aiToolkit.simulationTitle')}</CardTitle>
                        <CardDescription>{t('caseDetail.aiToolkit.simulationDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleSimulateOutcome} disabled={isSimulatingOutcome}>
                            {isSimulatingOutcome && <CircleDashed className="animate-spin mr-2" />}
                            {t('caseDetail.aiToolkit.simulateBtn')}
                        </Button>
                        {isSimulatingOutcome && <Skeleton className="w-full h-24 mt-4" />}
                        {outcomeResult && outcomeResult.potentialOutcomes && outcomeResult.potentialOutcomes.length > 0 && (
                             <div className="mt-4 space-y-4">
                                <Card>
                                    <CardContent className="pt-6">
                                        <h3 className="font-semibold text-center text-lg text-primary">{(outcomeResult.potentialOutcomes[0].probability * 100).toFixed(0)}% {t('caseDetail.aiToolkit.likelihood')}</h3>
                                        <p className="text-sm text-muted-foreground mt-2">{outcomeResult.potentialOutcomes[0].outcome}</p>
                                    </CardContent>
                                </Card>
                                <Alert variant="default" className="bg-yellow-50 border-yellow-200">
                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                    <AlertTitle className="font-headline text-yellow-700">{t('caseDetail.aiToolkit.disclaimer')}</AlertTitle>
                                    <AlertDescription className="text-yellow-600">
                                        {outcomeResult.disclaimer}
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><Scale className="w-5 h-5 text-primary" /> {t('caseDetail.aiToolkit.bailTitle')}</CardTitle>
                        <CardDescription>{t('caseDetail.aiToolkit.bailDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Button onClick={handlePredictBail} disabled={isPredictingBail}>
                            {isPredictingBail && <CircleDashed className="animate-spin mr-2" />}
                            {t('caseDetail.aiToolkit.predictBailBtn')}
                        </Button>
                        {isPredictingBail && <Skeleton className="w-full h-24 mt-4" />}
                        {bailResult && (
                             <div className="mt-4 space-y-4">
                                <Card>
                                     <CardContent className="pt-6">
                                        <h3 className="font-semibold text-center text-lg text-primary">{bailResult.prediction} ({(bailResult.probability * 100).toFixed(0)}%)</h3>
                                        <p className="text-sm text-muted-foreground mt-2">{bailResult.reasoning}</p>
                                    </CardContent>
                                </Card>
                                <Alert variant="default" className="bg-yellow-50 border-yellow-200">
                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                    <AlertTitle className="font-headline text-yellow-700">{t('caseDetail.aiToolkit.disclaimer')}</AlertTitle>
                                    <AlertDescription className="text-yellow-600">
                                        {bailResult.disclaimer}
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><BookCopy className="w-5 h-5 text-primary" /> {t('caseDetail.aiToolkit.judgmentRecTitle')}</CardTitle>
                        <CardDescription>{t('caseDetail.aiToolkit.judgmentRecDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleGetRecommendations} disabled={isGettingRecommendations}>
                            {isGettingRecommendations && <CircleDashed className="animate-spin mr-2" />}
                            {t('caseDetail.aiToolkit.getRecBtn')}
                        </Button>
                        {isGettingRecommendations && <Skeleton className="w-full h-40 mt-4" />}
                        {recommendationResult && (
                            <div className="mt-4 space-y-4">
                                <h4 className="font-semibold">{t('caseDetail.aiToolkit.similarPrecedents')}</h4>
                                <Accordion type="single" collapsible className="w-full">
                                    {recommendationResult.similarCasePrecedents.map((precedent, index) => (
                                    <AccordionItem value={`item-${index}`} key={index}>
                                        <AccordionTrigger className="font-semibold text-sm text-left">{precedent.caseName} <span className="text-xs text-muted-foreground ml-2">({precedent.citation})</span></AccordionTrigger>
                                        <AccordionContent className="space-y-2">
                                        <p className="text-sm text-muted-foreground">{precedent.summary}</p>
                                        {precedent.relevantLinks && precedent.relevantLinks.length > 0 && (
                                            <div className="mt-2 pt-2 border-t">
                                                <p className="text-xs font-semibold mb-1">{t('caseDetail.aiToolkit.externalResources')}</p>
                                                <ul className="space-y-1">
                                                    {precedent.relevantLinks.map((link, i) => (
                                                        <li key={i}><a href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" /> {link}</a></li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        </AccordionContent>
                                    </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
      )}
    </Tabs>

    <Dialog open={!!viewingImageUrl} onOpenChange={(open) => !open && setViewingImageUrl(null)}>
        <DialogContent className="max-w-5xl w-full h-[85vh] p-0 bg-black/90 border-none flex items-center justify-center">
            <DialogTitle className="sr-only">{t('caseDetail.dialogs.viewerTitle')}</DialogTitle>
            <DialogDescription className="sr-only">{t('caseDetail.dialogs.viewerDesc')}</DialogDescription>
            {viewingImageUrl && (
                <div className="relative w-full h-full flex items-center justify-center p-4">
                    <img 
                        src={viewingImageUrl} 
                        alt="Full size document" 
                        className="max-w-full max-h-full object-contain rounded-md" 
                    />
                </div>
            )}
        </DialogContent>
    </Dialog>

    <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{isJudge ? t('caseDetail.dialogs.issueOrderTitle') : t('caseDetail.dialogs.submitResponseTitle')}</DialogTitle>
                <DialogDescription>
                    {isJudge ? t('caseDetail.dialogs.issueOrderDesc') : t('caseDetail.dialogs.submitResponseDesc')}
                </DialogDescription>
            </DialogHeader>
            
            {isJudge ? (
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>{t('caseDetail.dialogs.orderDetails')}</Label>
                        <Textarea 
                            placeholder={t('caseDetail.dialogs.enterOrder')}
                            value={orderInput}
                            onChange={(e) => setOrderInput(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <Button onClick={handleIssueOrder} disabled={isIssuingOrder || !orderInput.trim()} className="w-full">
                        {isIssuingOrder ? <CircleDashed className="w-4 h-4 animate-spin mr-2" /> : <Gavel className="w-4 h-4 mr-2" />}
                        {t('caseDetail.dialogs.issueBtn')}
                    </Button>
                </div>
            ) : (
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>{t('caseDetail.dialogs.responseDesc')}</Label>
                        <Textarea 
                            placeholder={t('caseDetail.dialogs.describeEvidence')}
                            value={evidenceInput}
                            onChange={(e) => setEvidenceInput(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('caseDetail.dialogs.attachments')}</Label>
                        <Input type="file" accept="image/*" onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)} />
                        <Input placeholder={t('caseDetail.dialogs.pdfLink')} value={evidencePdfLink} onChange={(e) => setEvidencePdfLink(e.target.value)} className="mt-2" />
                        <Input placeholder={t('caseDetail.dialogs.videoLink')} value={evidenceVideoLink} onChange={(e) => setEvidenceVideoLink(e.target.value)} className="mt-2" />
                    </div>
                    <Button onClick={handleSubmitEvidence} disabled={isSubmittingEvidence || (!evidenceInput.trim() && !evidenceFile && !evidencePdfLink && !evidenceVideoLink)} className="w-full">
                        {isSubmittingEvidence ? <CircleDashed className="w-4 h-4 animate-spin mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                        {t('caseDetail.dialogs.submitBtn')}
                    </Button>
                </div>
            )}
        </DialogContent>
    </Dialog>

    <Dialog open={isUploadVisible} onOpenChange={setIsUploadVisible}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t('caseDetail.dialogs.uploadTitle')}</DialogTitle>
                <DialogDescription>{t('caseDetail.dialogs.uploadDesc')}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
                <div className="grid w-full items-center gap-3">
                    <Label htmlFor="document-upload">{t('caseDetail.dialogs.uploadLabel')}</Label>
                    <Input id="document-upload" type="file" accept="image/*" onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} />
                    
                    <Input placeholder={t('caseDetail.dialogs.pdfLinkOptional')} value={documentPdfLink} onChange={(e) => setDocumentPdfLink(e.target.value)} />
                    <Input placeholder={t('caseDetail.dialogs.videoLinkOptional')} value={documentVideoLink} onChange={(e) => setDocumentVideoLink(e.target.value)} />
                    <Input placeholder={t('caseDetail.dialogs.docDesc')} value={documentDescription} onChange={(e) => setDocumentDescription(e.target.value)} />
                </div>
                <Button onClick={handleUploadDocument} disabled={isUploadingDocument || (!documentFile && !documentPdfLink && !documentVideoLink)} className="w-full">
                    {isUploadingDocument && <CircleDashed className="mr-2 h-4 w-4 animate-spin" />}
                    {t('caseDetail.dialogs.uploadBtn')}
                </Button>
            </div>
        </DialogContent>
    </Dialog>
    </div>
  );
}
