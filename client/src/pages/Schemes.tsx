import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Sprout, Briefcase, GraduationCap, Home as HomeIcon, Heart, Search, Filter, Calendar } from 'lucide-react';
import { Link } from 'wouter';
import type { Scheme } from '@shared/schema';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const categoryIcons = {
  Agriculture: Sprout,
  Business: Briefcase,
  'Women Empowerment': Heart,
  'Education & Training': GraduationCap,
  Housing: HomeIcon,
  Healthcare: Heart,
};

const categories = ['Agriculture', 'Business', 'Women Empowerment', 'Education & Training', 'Housing', 'Healthcare'];

export default function Schemes() {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { data: schemes, isLoading } = useQuery<Scheme[]>({
    queryKey: ['/api/schemes'],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const filteredSchemes = schemes?.filter((scheme) => {
    const schemeName = language === 'kn' && scheme.nameKannada ? scheme.nameKannada :
                       language === 'hi' && scheme.nameHindi ? scheme.nameHindi :
                       scheme.name;
    const schemeDesc = language === 'kn' && scheme.descriptionKannada ? scheme.descriptionKannada :
                       language === 'hi' && scheme.descriptionHindi ? scheme.descriptionHindi :
                       scheme.description;
    
    const matchesSearch = searchQuery === '' || 
      schemeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schemeDesc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(scheme.category);
    return matchesSearch && matchesCategory;
  });

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('category')}</h3>
        <div className="space-y-3">
          {categories.map((category) => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons];
            return (
              <div key={category} className="flex items-center space-x-3">
                <Checkbox
                  id={category}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => toggleCategory(category)}
                  data-testid={`checkbox-category-${category}`}
                />
                <Label htmlFor={category} className="flex items-center gap-2 cursor-pointer text-base">
                  <Icon className="h-5 w-5 text-primary" />
                  {category}
                </Label>
              </div>
            );
          })}
        </div>
      </div>
      {selectedCategories.length > 0 && (
        <Button
          variant="outline"
          onClick={() => setSelectedCategories([])}
          className="w-full"
          data-testid="button-clear-filters"
        >
          Clear Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold mb-2">{t('schemes')}</h1>
        <p className="text-lg text-muted-foreground">
          Discover government schemes and programs
        </p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
              data-testid="input-search-schemes"
            />
          </div>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button size="lg" variant="outline" data-testid="button-open-filters">
              <Filter className="mr-2 h-5 w-5" />
              {t('filter')}
              {selectedCategories.length > 0 && (
                <Badge variant="secondary" className="ml-2">{selectedCategories.length}</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle className="text-2xl">{t('filter')}</SheetTitle>
              <SheetDescription>Filter schemes by category</SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden lg:block">
        <Card>
          <CardHeader>
            <CardTitle>{t('filter')}</CardTitle>
          </CardHeader>
          <CardContent>
            <FilterContent />
          </CardContent>
        </Card>
      </div>

      {filteredSchemes && filteredSchemes.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchemes.map((scheme) => {
            const Icon = categoryIcons[scheme.category as keyof typeof categoryIcons] || Sprout;
            const schemeName = language === 'kn' && scheme.nameKannada ? scheme.nameKannada :
                               language === 'hi' && scheme.nameHindi ? scheme.nameHindi :
                               scheme.name;
            const schemeDesc = language === 'kn' && scheme.descriptionKannada ? scheme.descriptionKannada :
                               language === 'hi' && scheme.descriptionHindi ? scheme.descriptionHindi :
                               scheme.description;
            return (
              <Card key={scheme.id} className="hover-elevate flex flex-col" data-testid={`card-scheme-${scheme.id}`}>
                <CardHeader>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <Icon className="h-12 w-12 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-sm">{t(scheme.category.toLowerCase().replace(/\s+/g, ''))}</Badge>
                  </div>
                  <CardTitle className="text-2xl leading-tight">{schemeName}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                  <CardDescription className="text-base line-clamp-4">
                    {schemeDesc}
                  </CardDescription>
                  {scheme.applicationDeadline && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Deadline: {new Date(scheme.applicationDeadline).toLocaleDateString()}</span>
                    </div>
                  )}
                  <Link href={`/scheme/${scheme.id}`} className="mt-auto">
                    <Button className="w-full" data-testid={`button-view-scheme-${scheme.id}`}>
                      {t('view')} Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-xl text-muted-foreground">No schemes found matching your criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
