'use client'

import { useState, useMemo } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Star, Filter, MapPin, Briefcase, GraduationCap, Mail, Phone, ArrowUpDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/use-language';

interface Lawyer {
  id: string;
  displayName: string;
  specialization: string;
  experience: number;
  rating: number;
  ratingCount?: number;
  imageId: string;
  role: string;
  location: string;
  education?: string;
  lawyerType?: string[];
  email: string;
  contactNumber: string;
}

export default function LawyerRecommendationPage() {
  const { t } = useLanguage();
  const [specializationFilter, setSpecializationFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [sortOption, setSortOption] = useState('Default');
  const { data: users, loading } = useCollection<Lawyer>('users');

  const lawyers = useMemo(() => users.filter(user => user.role === 'lawyer'), [users]);

  const specializations = useMemo(() => {
    return ["All", ...Array.from(new Set(lawyers.map(l => l.specialization).filter(Boolean))).sort()]
  }, [lawyers]);

  const locations = useMemo(() => {
    return ["All", ...Array.from(new Set(lawyers.map(l => l.location).filter(Boolean))).sort()]
  }, [lawyers]);

  const filteredLawyers = useMemo(() => {
    let filtered = lawyers.filter(lawyer => {
      const specializationMatch = specializationFilter === 'All' || lawyer.specialization === specializationFilter;
      const locationMatch = locationFilter === 'All' || lawyer.location === locationFilter;
      return specializationMatch && locationMatch;
    });

    if (sortOption === 'Top Rated') {
      filtered = filtered.sort((a, b) => {
        const ratingA = a.ratingCount ? Number(a.rating) : 0;
        const ratingB = b.ratingCount ? Number(b.rating) : 0;
        return ratingB - ratingA;
      });
    } else if (sortOption === 'Experience') {
      filtered = filtered.sort((a, b) => b.experience - a.experience);
    }
    return filtered;
  }, [lawyers, specializationFilter, locationFilter, sortOption]);

  if (loading) {
    return (
       <div className="space-y-8">
        <div className="flex flex-wrap items-center gap-4">
          <Skeleton className="h-10 w-[240px]" />
          <Skeleton className="h-10 w-[240px]" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
       </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold">{t('dashboard.findLawyerTitle')}</h1>
        <p className="text-muted-foreground">{t('dashboard.findLawyerDescription')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-5 h-5 text-muted-foreground shrink-0" />
            <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Filter by specialization" />
                </SelectTrigger>
                <SelectContent>
                {specializations.map(spec => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                ))}
                </SelectContent>
            </Select>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
            <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                {locations.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
                </SelectContent>
            </Select>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <ArrowUpDown className="w-5 h-5 text-muted-foreground shrink-0" />
            <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Default">Default</SelectItem>
                    <SelectItem value="Top Rated">Top Rated</SelectItem>
                    <SelectItem value="Experience">Most Experienced</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredLawyers.map(lawyer => {
          const nameInitials = lawyer.displayName.split(' ').map(n => n[0]).join('');

          return (
            <Card key={lawyer.id} className="shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border-2 border-primary/20">
                    <AvatarFallback className="text-2xl bg-muted">{nameInitials}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <CardTitle className="font-headline text-xl">{lawyer.displayName}</CardTitle>
                    <CardDescription>{lawyer.specialization}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-grow">
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground pt-1">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4" />
                      <span>{lawyer.experience} yrs experience</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                      <span>{lawyer.ratingCount ? `${Number(lawyer.rating).toFixed(1)} (${lawyer.ratingCount})` : 'New'}</span>
                    </div>
                </div>
                {lawyer.location && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{lawyer.location}</span>
                    </div>
                )}
                {lawyer.education && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <GraduationCap className="w-4 h-4" />
                        <span>{lawyer.education}</span>
                    </div>
                )}
                 <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{lawyer.email}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{lawyer.contactNumber}</span>
                </div>
              </CardContent>
              {lawyer.lawyerType && lawyer.lawyerType.length > 0 && (
                <CardFooter className="flex flex-wrap gap-2 pt-0">
                  {lawyer.lawyerType.map(type => (
                      <Badge key={type} variant="secondary" className="capitalize">{type.replace('-', ' ')}</Badge>
                  ))}
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>
       {filteredLawyers.length === 0 && !loading && (
        <div className="text-center py-16 text-muted-foreground col-span-full">
            <p>No lawyers found for the selected filters.</p>
        </div>
       )}
    </div>
  );
}
