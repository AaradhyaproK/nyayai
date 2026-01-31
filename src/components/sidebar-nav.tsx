'use client'

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart3, 
  FileText, 
  Gavel, 
  MessageSquare, 
  Briefcase,
  Users, 
  Megaphone,
  ScrollText,
  User,
  PieChart,
  BookOpen,
  Shield,
  Unlock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguage } from '@/hooks/use-language';
import { useUser } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';

interface UserProfile {
    role: 'user' | 'lawyer' | 'admin' | 'judge';
}

export function SidebarNav({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user } = useUser();
  const { data: userProfile } = useDoc<UserProfile>(user ? `users/${user.uid}` : '');

  const navItems = [
    { href: '/dashboard', icon: BarChart3, label: t('sidebar.dashboard'), roles: ['user', 'lawyer'] },
    { href: '/profile', icon: User, label: t('sidebar.profile'), roles: ['user', 'lawyer'] },
    { href: '/statistics', icon: PieChart, label: t('sidebar.statistics'), roles: ['user', 'lawyer'] },
    { href: '/ai-judge', icon: Gavel, label: t('sidebar.caseAnalysis'), roles: ['user'] },
    { href: '/my-cases', icon: Briefcase, label: t('sidebar.myCases'), roles: ['user', 'lawyer'] },
    { href: '/pil', icon: Megaphone, label: t('sidebar.pil'), roles: ['user', 'lawyer'] },
    { href: '/zero-fir', icon: FileText, label: t('sidebar.zeroFir'), roles: ['user', 'lawyer'] },
    { href: '/bail-prediction', icon: Unlock, label: t('sidebar.bailPrediction'), roles: ['user', 'lawyer'] },
    { href: '/rti', icon: ScrollText, label: t('sidebar.rti'), roles: ['user', 'lawyer'] },
    { href: '/know-your-rights', icon: BookOpen, label: t('sidebar.knowYourRights'), roles: ['user', 'lawyer'] },
    { href: '/lawyers', icon: Users, label: t('sidebar.findLawyer'), roles: ['user'] },
    { href: '/legal-research', icon: ScrollText, label: t('sidebar.legalResearch'), roles: ['lawyer'] },
    { href: '/chatbot', icon: MessageSquare, label: t('sidebar.chatbot'), roles: ['user', 'lawyer'] },
    { href: '/summarize', icon: FileText, label: t('sidebar.summarizer'), roles: ['user', 'lawyer'] },
    { href: '/admin', icon: Shield, label: t('sidebar.admin'), roles: ['admin'] },
    { href: '/judge', icon: Gavel, label: t('sidebar.judgeDashboard'), roles: ['judge'] },
    { href: '/judge/file-case', icon: FileText, label: t('sidebar.fileCase'), roles: ['judge'] },
  ];

  const visibleNavItems = navItems.filter(item => userProfile && item.roles.includes(userProfile.role));

  return (
    <nav className="flex flex-col gap-2 px-2 py-4">
      {visibleNavItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return isCollapsed ? (
          <Tooltip key={item.href} delayDuration={0}>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                  isActive && 'bg-primary text-primary-foreground hover:text-primary-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-4">
              {item.label}
            </TooltipContent>
          </Tooltip>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground',
              isActive && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
