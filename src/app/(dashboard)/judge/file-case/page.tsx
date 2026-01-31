'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase/provider';
import { useUser } from '@/firebase/auth/use-user';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select as UiSelect, SelectContent as UiSelectContent, SelectItem as UiSelectItem, SelectTrigger as UiSelectTrigger, SelectValue as UiSelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CircleDashed, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

interface UserData {
    id: string;
    displayName: string;
    role: string;
    email?: string;
}

function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder,
}: {
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedLabel = options.find((option) => option.value === value)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
          {selectedLabel || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search by name or email..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem 
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function FileCasePage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const { data: users } = useCollection<UserData>('users');

    const { lawyers, clients, lawyerOptions, clientOptions } = useMemo(() => {
        if (!users) return { lawyers: [], clients: [], lawyerOptions: [], clientOptions: [] };
        const lawyers = users.filter(u => u.role === 'lawyer');
        const clients = users.filter(u => u.role === 'user');
        return { lawyers, clients, lawyerOptions: lawyers.map(l => ({ value: l.id, label: `${l.displayName || 'Unknown'} (${l.email || 'No Email'})` })), clientOptions: clients.map(c => ({ value: c.id, label: `${c.displayName || 'Unknown'} (${c.email || 'No Email'})` })) };
    }, [users]);

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: '',
        clientId: '',
        lawyerId: '', // Plaintiff
        opposingLawyerId: '', // Defense
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !user) return;
        setLoading(true);

        try {
            const client = clients.find(c => c.id === formData.clientId);
            const lawyer = lawyers.find(l => l.id === formData.lawyerId);
            const opposingLawyer = lawyers.find(l => l.id === formData.opposingLawyerId);

            await addDoc(collection(firestore, 'cases'), {
                title: formData.title,
                description: formData.description,
                type: formData.type,
                status: 'active',
                userId: formData.clientId,
                clientName: client?.displayName || 'Unknown',
                lawyerId: formData.lawyerId,
                lawyerName: lawyer?.displayName || 'Unknown',
                opposingLawyerId: formData.opposingLawyerId,
                opposingLawyerName: opposingLawyer?.displayName || 'Unknown',
                judgeId: user.uid,
                createdAt: serverTimestamp(),
            });

            toast({ title: "Success", description: "Case filed successfully." });
            router.push('/judge');
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to file case." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle>File New Case</CardTitle>
                    <CardDescription>Create a new case record and assign legal counsel.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Case Title</Label>
                            <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. State vs John Doe" />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Case details..." />
                        </div>
                        <div className="space-y-2">
                            <Label>Case Type</Label>
                            <UiSelect onValueChange={v => setFormData({...formData, type: v})}>
                                <UiSelectTrigger><UiSelectValue placeholder="Select Type" /></UiSelectTrigger>
                                <UiSelectContent>
                                    <UiSelectItem value="Criminal">Criminal</UiSelectItem>
                                    <UiSelectItem value="Civil">Civil</UiSelectItem>
                                    <UiSelectItem value="Corporate">Corporate</UiSelectItem>
                                    <UiSelectItem value="Family">Family</UiSelectItem>
                                </UiSelectContent>
                            </UiSelect>
                        </div>
                        <div className="space-y-2">
                            <Label>Client (Plaintiff/Petitioner)</Label>
                            <SearchableSelect
                                options={clientOptions}
                                value={formData.clientId}
                                onValueChange={v => setFormData({...formData, clientId: v})}
                                placeholder="Search for a client..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Plaintiff Lawyer</Label>
                                <SearchableSelect
                                    options={lawyerOptions}
                                    value={formData.lawyerId}
                                    onValueChange={v => setFormData({...formData, lawyerId: v})}
                                    placeholder="Search for a lawyer..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Defense Lawyer</Label>
                                <SearchableSelect
                                    options={lawyerOptions}
                                    value={formData.opposingLawyerId}
                                    onValueChange={v => setFormData({...formData, opposingLawyerId: v})}
                                    placeholder="Search for a lawyer..."
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <CircleDashed className="mr-2 h-4 w-4 animate-spin" />} File Case
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
