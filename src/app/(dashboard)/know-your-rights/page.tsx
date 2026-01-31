'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, GraduationCap, Baby, User, Briefcase, ShoppingCart, ShieldAlert, Info, Home, HeartPulse, Scale } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

// Data
const RIGHTS_METADATA = [
    // Fundamental Rights
    {
        id: 'fr1',
        categoryKey: 'Fundamental Rights',
        article: 'Articles 14–18'
    },
    {
        id: 'fr2',
        categoryKey: 'Fundamental Rights',
        article: 'Articles 19–22'
    },
    {
        id: 'fr3',
        categoryKey: 'Fundamental Rights',
        article: 'Articles 23–24'
    },
    {
        id: 'fr4',
        categoryKey: 'Fundamental Rights',
        article: 'Articles 25–28'
    },
    {
        id: 'fr5',
        categoryKey: 'Fundamental Rights',
        article: 'Articles 29–30'
    },
    {
        id: 'fr6',
        categoryKey: 'Fundamental Rights',
        article: 'Article 32'
    },
    // Women
    {
        id: 'w1',
        categoryKey: 'Women',
        article: 'Section 154 CrPC'
    },
    {
        id: 'w2',
        categoryKey: 'Women',
        article: 'Section 164 CrPC'
    },
    {
        id: 'w3',
        categoryKey: 'Women',
        article: 'Section 46(4) CrPC'
    },
    {
        id: 'w4',
        categoryKey: 'Women',
        article: 'Equal Remuneration Act'
    },
    {
        id: 'w5',
        categoryKey: 'Women',
        article: 'Maternity Benefit Act'
    },
    {
        id: 'w6',
        categoryKey: 'Women',
        article: 'Domestic Violence Act, 2005'
    },

    // Children
    {
        id: 'c1',
        categoryKey: 'Children',
        article: 'Article 21A, RTE Act'
    },
    {
        id: 'c2',
        categoryKey: 'Children',
        article: 'Article 24'
    },
    {
        id: 'c3',
        categoryKey: 'Children',
        article: 'POCSO Act, 2012'
    },

    // Students
    {
        id: 's1',
        categoryKey: 'Students',
        article: 'RTI Act, 2005'
    },
    {
        id: 's2',
        categoryKey: 'Students',
        article: 'UGC Regulations'
    },

    // Employees
    {
        id: 'e1',
        categoryKey: 'Employees',
        article: 'Minimum Wages Act'
    },
    {
        id: 'e2',
        categoryKey: 'Employees',
        article: 'POSH Act, 2013'
    },
    {
        id: 'e3',
        categoryKey: 'Employees',
        article: 'Payment of Gratuity Act'
    },

    // Consumers
    {
        id: 'co1',
        categoryKey: 'Consumers',
        article: 'Consumer Protection Act'
    },
    {
        id: 'co2',
        categoryKey: 'Consumers',
        article: 'Consumer Protection Act'
    },
    {
        id: 'co3',
        categoryKey: 'Consumers',
        article: 'Consumer Protection Act'
    },

    // Arrested Persons
    {
        id: 'a1',
        categoryKey: 'Arrested Persons',
        article: 'Article 22(1), Section 50 CrPC'
    },
    {
        id: 'a2',
        categoryKey: 'Arrested Persons',
        article: 'Article 22(2), Section 57 CrPC'
    },
    {
        id: 'a3',
        categoryKey: 'Arrested Persons',
        article: 'Article 39A'
    },

    // Senior Citizens
    {
        id: 'sc1',
        categoryKey: 'Senior Citizens',
        article: 'Maintenance and Welfare of Parents and Senior Citizens Act'
    },
    {
        id: 'sc2',
        categoryKey: 'Senior Citizens',
        article: 'Income Tax Act'
    },

    // Men
    {
        id: 'm1',
        categoryKey: 'Men',
        article: 'Judicial Precedents'
    },
    {
        id: 'm2',
        categoryKey: 'Men',
        article: 'Guardians and Wards Act'
    },
    
    // Tenants
    {
        id: 't1',
        categoryKey: 'Tenants',
        article: 'Rent Control Act'
    },
    {
        id: 't2',
        categoryKey: 'Tenants',
        article: 'Rent Control Act'
    }
];

const CATEGORIES_METADATA = [
    { nameKey: 'All', icon: BookOpen },
    { nameKey: 'Fundamental Rights', icon: Scale },
    { nameKey: 'Women', icon: User },
    { nameKey: 'Children', icon: Baby },
    { nameKey: 'Students', icon: GraduationCap },
    { nameKey: 'Employees', icon: Briefcase },
    { nameKey: 'Consumers', icon: ShoppingCart },
    { nameKey: 'Arrested Persons', icon: ShieldAlert },
    { nameKey: 'Senior Citizens', icon: HeartPulse },
    { nameKey: 'Men', icon: User },
    { nameKey: 'Tenants', icon: Home },
];

export default function KnowYourRightsPage() {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryKey, setSelectedCategoryKey] = useState('All');

    const rightsData = RIGHTS_METADATA.map(item => ({
        ...item,
        title: t(`knowYourRightsPage.rights.${item.id}.title`),
        description: t(`knowYourRightsPage.rights.${item.id}.description`),
        category: t(`knowYourRightsPage.categories.${item.categoryKey}`)
    }));

    const categories = CATEGORIES_METADATA.map(cat => ({
        ...cat,
        name: t(`knowYourRightsPage.categories.${cat.nameKey}`)
    }));

    const filteredRights = rightsData.filter(right => {
        const matchesSearch = right.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              right.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = selectedCategoryKey === 'All' || right.categoryKey === selectedCategoryKey;
        
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-0 pb-12">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">{t('knowYourRightsPage.title')}</h1>
                    <p className="text-muted-foreground">{t('knowYourRightsPage.subtitle')}</p>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col gap-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder={t('knowYourRightsPage.searchPlaceholder')} 
                        className="pl-10 h-12 text-lg"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => {
                        const Icon = cat.icon;
                        const isSelected = selectedCategoryKey === (cat.nameKey === 'All' ? 'All' : cat.nameKey);
                        return (
                            <Button
                                key={cat.nameKey}
                                variant={isSelected ? "default" : "outline"}
                                onClick={() => setSelectedCategoryKey(cat.nameKey === 'All' ? 'All' : cat.nameKey)}
                                className="gap-2 rounded-full"
                            >
                                <Icon className="h-4 w-4" />
                                {cat.name}
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* Rights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRights.length > 0 ? (
                    filteredRights.map(right => (
                        <Card key={right.id} className="hover:shadow-md transition-shadow border-l-4 border-l-primary">
                            <CardHeader>
                                <div className="flex justify-between items-start gap-2">
                                    <Badge variant="secondary" className="mb-2">{right.category}</Badge>
                                    <Badge variant="outline" className="font-mono text-xs">{right.article}</Badge>
                                </div>
                                <CardTitle className="text-xl">{right.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-base text-foreground/80">
                                    {right.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        <Info className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">{t('knowYourRightsPage.noResults')}</p>
                        <Button variant="link" onClick={() => {setSearchQuery(''); setSelectedCategoryKey('All');}}>{t('knowYourRightsPage.clearFilters')}</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
