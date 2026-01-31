'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { doc, setDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase/provider';
import { CircleDashed } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { Checkbox } from '@/components/ui/checkbox';
import { maharashtraDistricts } from '@/lib/districts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Skeleton } from '@/components/ui/skeleton';
import { TRANSLATIONS } from '@/lib/translations';

// Combined schema for both user and lawyer, with lawyer fields being optional.
const profileSchema = z.object({
    displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    contactNumber: z.string().min(10, { message: 'Please enter a valid contact number.' }),
    location: z.string({ required_error: 'Please select a district.' }),
    // Lawyer specific fields
    specialization: z.string().optional(),
    experience: z.coerce.number().optional(),
    education: z.string().optional(),
    lawyerType: z.array(z.string()).optional(),
});


export default function ProfilePage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguage();
  const t = TRANSLATIONS[language as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;
  const { user, loading: userLoading } = useUser();
  const { data: userProfile, loading: profileLoading } = useDoc<any>(user ? `users/${user.uid}` : '');

  const lawyerTypes = [
    { id: "corporate", label: t.register?.lawyerTypes?.corporate ?? 'Corporate' },
    { id: "criminal", label: t.register?.lawyerTypes?.criminal ?? 'Criminal' },
    { id: "family", label: t.register?.lawyerTypes?.family ?? 'Family' },
    { id: "immigration", label: t.register?.lawyerTypes?.immigration ?? 'Immigration' },
    { id: "civil", label: t.register?.lawyerTypes?.civil ?? 'Civil' },
    { id: "ip", label: t.register?.lawyerTypes?.ip ?? 'Intellectual Property' },
  ];

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {},
  });
  
  const { reset } = form;

  useEffect(() => {
    if (userProfile) {
      reset(userProfile);
    }
  }, [userProfile, reset]);


  async function onSubmit(values: z.infer<typeof profileSchema>) {
    setIsLoading(true);
    if (!firestore || !user || !userProfile) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not update profile. User not found.',
        });
        setIsLoading(false);
        return;
    };

    try {
      const userProfileRef = doc(firestore, 'users', user.uid);
      
      await setDoc(userProfileRef, values, { merge: true });
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });

    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  if (userLoading || profileLoading) {
      return (
          <Card className="w-full max-w-2xl mx-auto">
              <CardHeader>
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-6">
                  <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                  </div>
                   <Skeleton className="h-10 w-32" />
              </CardContent>
          </Card>
      );
  }

  if (!userProfile) {
      return (
        <Card>
            <CardHeader>
                <CardTitle>Profile not found</CardTitle>
            </CardHeader>
            <CardContent>
                <p>We could not find your profile data.</p>
            </CardContent>
        </Card>
      )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Edit Profile</CardTitle>
        <CardDescription>Update your account information.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.register?.fullNameLabel ?? 'Full Name'}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.register?.fullNamePlaceholder ?? 'John Doe'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormItem>
              <FormLabel>{t.register?.emailLabel ?? 'Email'}</FormLabel>
              <FormControl>
                <Input placeholder="name@example.com" value={userProfile.email} disabled />
              </FormControl>
              <FormDescription>
                You cannot change your email address.
              </FormDescription>
            </FormItem>

            <FormField
              control={form.control}
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.register?.contactNumberLabel ?? 'Contact Number'}</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 234 567 890" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.register?.locationLabel ?? 'Location'}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t.register?.locationPlaceholder ?? 'Select District'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {maharashtraDistricts.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {userProfile.role === 'lawyer' && (
              <>
                <FormField
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.register?.specializationLabel ?? 'Specialization'}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.register?.specializationPlaceholder ?? 'e.g. Criminal Law'} {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.register?.experienceLabel ?? 'Experience (Years)'}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 5" {...field} value={field.value ?? 0} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="education"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.register?.educationLabel ?? 'Education'}</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., J.D. from Harvard Law" {...field} value={field.value ?? ''}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lawyerType"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>{t.register?.lawyerTypeLabel ?? 'Lawyer Type'}</FormLabel>
                        <FormDescription>
                          {t.register?.lawyerTypeDescription ?? 'Select the areas of law you practice.'}
                        </FormDescription>
                      </div>
                      <div className='grid grid-cols-2 gap-4'>
                      {lawyerTypes.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="lawyerType"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValue = field.value || [];
                                      return checked
                                        ? field.onChange([...currentValue, item.id])
                                        : field.onChange(
                                            currentValue?.filter(
                                              (value) => value !== item.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {item.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <Button type="submit" disabled={isLoading}>
              {isLoading && <CircleDashed className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
