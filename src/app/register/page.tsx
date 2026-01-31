'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
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
import { Icons } from '@/components/icons';
import { useAuth, useFirestore } from '@/firebase/provider';
import { CircleDashed } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/hooks/use-language';
import { Checkbox } from '@/components/ui/checkbox';
import { maharashtraDistricts } from '@/lib/districts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TRANSLATIONS } from '@/lib/translations';


const formSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("user"),
    displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    email: z.string().email({ message: 'Please enter a valid email.' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
    contactNumber: z.string().min(10, { message: 'Please enter a valid contact number.' }),
    location: z.string({ required_error: 'Please select a district.' }),
  }),
  z.object({
    role: z.literal("lawyer"),
    displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    email: z.string().email({ message: 'Please enter a valid email.' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
    contactNumber: z.string().min(10, { message: 'Please enter a valid contact number.' }),
    location: z.string({ required_error: 'Please select a district.' }),
    specialization: z.string().min(2, { message: 'Specialization is required.' }),
    experience: z.coerce.number().min(0, { message: 'Experience must be a positive number.' }),
    education: z.string().min(2, { message: 'Education is required.' }),
    lawyerType: z.array(z.string()).refine((value) => value.some((item) => item), {
      message: "You have to select at least one type of law.",
    }),
  }),
]);


export default function RegisterPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'user' | 'lawyer'>('user');
  const { language } = useLanguage();
  const t = TRANSLATIONS[language as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;

  const registerT = t.register || TRANSLATIONS.en.register;
  const lawyerTypesT = registerT.lawyerTypes || TRANSLATIONS.en.register.lawyerTypes;

  const lawyerTypes = [
    { id: "corporate", label: lawyerTypesT.corporate },
    { id: "criminal", label: lawyerTypesT.criminal },
    { id: "family", label: lawyerTypesT.family },
    { id: "immigration", label: lawyerTypesT.immigration },
    { id: "civil", label: lawyerTypesT.civil },
    { id: "ip", label: lawyerTypesT.ip },
  ];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: 'user',
      displayName: '',
      email: '',
      password: '',
      contactNumber: '',
    },
  });

  const { watch, setValue } = form;

  const currentRole = watch("role");

  useEffect(() => {
    setValue("role", role);
    if (role === 'user') {
      setValue('specialization', undefined);
      setValue('experience', undefined);
      setValue('education', undefined);
      setValue('lawyerType', undefined);
    } else {
      if (!watch('specialization')) {
        setValue('specialization', '');
      }
      if (!watch('experience')) {
        setValue('experience', 0);
      }
      if (!watch('lawyerType')) {
        setValue('lawyerType', []);
      }
    }
  }, [role, setValue, watch]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    if (!auth || !firestore) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Firebase not initialized. Please try again later.',
        });
        setIsLoading(false);
        return;
    };

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: values.displayName,
      });

      const userProfileData: any = {
        displayName: values.displayName,
        email: values.email,
        role: values.role,
        contactNumber: values.contactNumber,
        location: values.location,
        imageId: `lawyer-${Math.floor(Math.random() * 6) + 1}`,
      };

      if (values.role === 'lawyer') {
        userProfileData.specialization = values.specialization;
        userProfileData.experience = values.experience;
        userProfileData.education = values.education;
        userProfileData.lawyerType = values.lawyerType;
        userProfileData.rating = (Math.random() * (5 - 4) + 4).toFixed(1);
      }

      await setDoc(doc(firestore, 'users', user.uid), userProfileData);
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.code === 'auth/email-already-in-use' 
          ? 'This email is already registered. Please sign in.' 
          : 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-2xl my-8">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <Icons.logo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl">{registerT.createAccount ?? 'Create an account'}</CardTitle>
          <CardDescription>{registerT.joinMessage ?? 'Enter your email below to create your account'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value: 'user' | 'lawyer') => setRole(value)}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="user" id="user" />
                          </FormControl>
                          <Label htmlFor="user" className="font-normal">{registerT.userRole}</Label>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="lawyer" id="lawyer" />
                          </FormControl>
                          <Label htmlFor="lawyer" className="font-normal">{registerT.lawyerRole}</Label>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{registerT.fullNameLabel}</FormLabel>
                    <FormControl>
                      <Input placeholder={registerT.fullNamePlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{registerT.emailLabel}</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{registerT.passwordLabel}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={registerT.passwordPlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{registerT.contactNumberLabel}</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 234 567 890" {...field} value={field.value ?? ''}/>
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
                    <FormLabel>{registerT.locationLabel}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={registerT.locationPlaceholder} />
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

              {currentRole === 'lawyer' && (
                <>
                  <FormField
                    control={form.control}
                    name="specialization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{registerT.specializationLabel}</FormLabel>
                        <FormControl>
                          <Input placeholder={registerT.specializationPlaceholder} {...field} value={field.value ?? ''} />
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
                        <FormLabel>{registerT.experienceLabel}</FormLabel>
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
                        <FormLabel>{registerT.educationLabel}</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., J.D. from Harvard Law" {...field} value={field.value ?? ''} />
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
                          <FormLabel>{registerT.lawyerTypeLabel}</FormLabel>
                          <FormDescription>
                            {registerT.lawyerTypeDescription}
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
                                        return checked
                                          ? field.onChange([...(field.value || []), item.id])
                                          : field.onChange(
                                              field.value?.filter(
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <CircleDashed className="mr-2 h-4 w-4 animate-spin" />}
                {registerT.signUpButton}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            {registerT.haveAccount}{' '}
            <Link href="/login" className="underline hover:text-primary">
              {registerT.signInLink}
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
