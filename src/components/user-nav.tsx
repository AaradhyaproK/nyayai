"use client"

import { useRouter } from "next/navigation"
import { signOut } from "firebase/auth"

import { useUser } from "@/firebase/auth/use-user"
import { useAuth } from "@/firebase/provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User as UserIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useLanguage } from "@/hooks/use-language"

export function UserNav() {
  const { user, loading } = useUser()
  const auth = useAuth()
  const router = useRouter()
  const { t } = useLanguage();

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth)
    router.push("/")
  }

  if (loading) {
    return <Skeleton className="h-9 w-9 rounded-full" />
  }

  if (!user) {
    return null
  }

  const nameInitials = user.displayName
    ?.split(' ')
    .map((n) => n[0])
    .join('') || user.email?.charAt(0).toUpperCase() || 'U';


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{nameInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/profile')}>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>{t.userNav?.profile ?? 'Profile'}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t.userNav?.logOut ?? 'Log out'}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
