'use client';

import * as React from 'react';
import Link from 'next/link';
import { PanelLeft, CircleDashed } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import {
  TooltipProvider,
} from "@/components/ui/tooltip"
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { UserNav } from '@/components/user-nav';
import { SidebarNav } from '@/components/sidebar-nav';
import { Icons } from '@/components/icons';
import { useUser } from '@/firebase/auth/use-user';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const pathname = usePathname();

  const getPageTitle = () => {
    const segment = pathname.split('/').pop();
    if (segment === 'dashboard') return 'Court Statistics Dashboard';
    if (!segment) return 'Dashboard';
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <CircleDashed className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <aside className={cn(
          "fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background transition-all duration-300 ease-in-out sm:flex",
          isCollapsed && "w-16"
        )}>
          <div className={cn(
            "flex h-16 items-center border-b px-6",
            isCollapsed ? "justify-center px-2" : "justify-between"
          )}>
            <Link
              href="/dashboard"
              className={cn("flex items-center gap-2 font-semibold font-headline", isCollapsed && "hidden")}
            >
              <Icons.logo className="h-6 w-6 text-primary" />
              <span>Nyaya Mitra</span>
            </Link>
             <Button variant="ghost" size="icon" className={cn(isCollapsed && "mx-auto")} onClick={toggleSidebar}>
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Sidebar</span>
            </Button>
          </div>
          <SidebarNav isCollapsed={isCollapsed} />
        </aside>

        <div className={cn(
          "flex flex-col sm:pl-64 transition-all duration-300 ease-in-out",
          isCollapsed && "sm:pl-16"
        )}>
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 sm:hidden"
                >
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col p-0 w-64">
                 <div className="flex h-16 items-center border-b px-6">
                    <Link href="#" className="flex items-center gap-2 font-semibold font-headline">
                        <Icons.logo className="h-6 w-6 text-primary" />
                        <span>Nyaya Mitra</span>
                    </Link>
                </div>
                <SidebarNav isCollapsed={false} />
              </SheetContent>
            </Sheet>
            
            <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                <h1 className="flex-1 text-xl font-semibold font-headline">{getPageTitle()}</h1>
                <div className="ml-auto flex items-center gap-2">
                    <LanguageSwitcher />
                    <UserNav />
                </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
