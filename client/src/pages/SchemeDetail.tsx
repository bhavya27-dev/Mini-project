import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sprout, Briefcase, GraduationCap, Home as HomeIcon, Heart, CheckCircle2, Calendar, FileText, ArrowLeft } from 'lucide-react';
import type { Scheme } from '@shared/schema';

const categoryIcons = {
  Agriculture: Sprout,
  Business: Briefcase,
  'Women Empowerment': Heart,
  'Education & Training': GraduationCap,
  Housing: HomeIcon,
  Healthcare: Heart,
};

export default function SchemeDetail() {
  const { t, language } = useLanguage();
  const { id } = useParams();

  const { data: scheme, isLoading } = useQuery<Scheme>({
    queryKey: ['/api/schemes', id],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-8">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="p-6 text-center">
        <p className="text-xl text-muted-foreground">Scheme not found</p>
      </div>
    );
  }

  const Icon = categoryIcons[scheme.category as keyof typeof categoryIcons] || Sprout;
  
  const schemeName = language === 'kn' && scheme.nameKannada ? scheme.nameKannada :
                     language === 'hi' && scheme.nameHindi ? scheme.nameHindi :
                     scheme.name;
  
  const schemeDesc = language === 'kn' && scheme.descriptionKannada ? scheme.descriptionKannada :
                     language === 'hi' && scheme.descriptionHindi ? scheme.descriptionHindi :
                     scheme.description;

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/schemes">
            <Button variant="ghost" className="mb-6" data-testid="button-back">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Schemes
            </Button>
          </Link>
          <div className="flex items-start gap-6 flex-wrap">
            <div className="bg-primary/20 p-6 rounded-lg">
              <Icon className="h-20 w-20 text-primary" />
            </div>
            <div className="flex-1">
              <Badge variant="secondary" className="mb-4 text-base">{scheme.category}</Badge>
              <h1 className="text-4xl font-bold mb-4">{schemeName}</h1>
              {scheme.applicationDeadline && (
                <div className="flex items-center gap-2 text-lg text-muted-foreground">
                  <Calendar className="h-5 w-5" />
                  <span>Application Deadline: {new Date(scheme.applicationDeadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">About This Scheme</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed">{schemeDesc}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              {t('eligibility')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scheme.eligibility.states && scheme.eligibility.states.length > 0 && (
              <div>
                <p className="font-semibold text-lg mb-2">Applicable States:</p>
                <div className="flex flex-wrap gap-2">
                  {scheme.eligibility.states.map((state: string) => (
                    <Badge key={state} variant="outline" className="text-base">{state}</Badge>
                  ))}
                </div>
              </div>
            )}
            {scheme.eligibility.occupations && scheme.eligibility.occupations.length > 0 && (
              <div>
                <p className="font-semibold text-lg mb-2">Eligible Occupations:</p>
                <div className="flex flex-wrap gap-2">
                  {scheme.eligibility.occupations.map((occ: string) => (
                    <Badge key={occ} variant="outline" className="text-base">{occ}</Badge>
                  ))}
                </div>
              </div>
            )}
            {(scheme.eligibility.minIncome || scheme.eligibility.maxIncome) && (
              <div>
                <p className="font-semibold text-lg mb-2">Income Criteria:</p>
                <p className="text-base">
                  {scheme.eligibility.minIncome && `Minimum: ₹${scheme.eligibility.minIncome.toLocaleString()}`}
                  {scheme.eligibility.minIncome && scheme.eligibility.maxIncome && ' | '}
                  {scheme.eligibility.maxIncome && `Maximum: ₹${scheme.eligibility.maxIncome.toLocaleString()}`}
                </p>
              </div>
            )}
            {scheme.eligibility.requiresLand !== undefined && (
              <div>
                <p className="font-semibold text-lg mb-2">Land Ownership:</p>
                <p className="text-base">{scheme.eligibility.requiresLand ? 'Required' : 'Not required'}</p>
              </div>
            )}
            {(scheme.eligibility.minAge || scheme.eligibility.maxAge) && (
              <div>
                <p className="font-semibold text-lg mb-2">Age Criteria:</p>
                <p className="text-base">
                  {scheme.eligibility.minAge && `Minimum: ${scheme.eligibility.minAge} years`}
                  {scheme.eligibility.minAge && scheme.eligibility.maxAge && ' | '}
                  {scheme.eligibility.maxAge && `Maximum: ${scheme.eligibility.maxAge} years`}
                </p>
              </div>
            )}
            {scheme.eligibility.gender && (
              <div>
                <p className="font-semibold text-lg mb-2">Gender:</p>
                <p className="text-base">{scheme.eligibility.gender}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('benefits')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {scheme.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-accent/50 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-base mb-1">
                      {language === 'kn' && benefit.titleKn ? benefit.titleKn :
                       language === 'hi' && benefit.titleHi ? benefit.titleHi :
                       benefit.titleEn}
                    </p>
                    <p className="text-base text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              {t('documents')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {scheme.requiredDocuments.map((doc, index) => (
                <li key={index} className="flex items-center gap-3 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  {doc}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="how-to-apply">
            <AccordionTrigger className="text-xl font-semibold">How to Apply</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed pt-4">
              {scheme.howToApply}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="sticky bottom-6 bg-card border rounded-lg p-4 shadow-lg">
          <Link href={`/apply/${scheme.id}`}>
            <Button size="lg" className="w-full text-lg h-14" data-testid="button-apply-scheme">
              {t('apply')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
