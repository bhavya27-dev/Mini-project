import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Sprout, Briefcase, GraduationCap, Home as HomeIcon, Heart, TrendingUp, User } from 'lucide-react';
import { Link } from 'wouter';
import type { Application, Scheme } from '@shared/schema';

const categoryIcons = {
  Agriculture: Sprout,
  Business: Briefcase,
  'Women Empowerment': Heart,
  'Education & Training': GraduationCap,
  Housing: HomeIcon,
  Healthcare: Heart,
};

const statusColors = {
  draft: 'bg-gray-500',
  submitted: 'bg-blue-500',
  'under review': 'bg-yellow-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
};

export default function Dashboard() {
  const { t } = useLanguage();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/user/profile'],
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery<(Application & { scheme: Scheme })[]>({
    queryKey: ['/api/applications'],
  });

  const { data: recommendedSchemes, isLoading: schemesLoading } = useQuery<Scheme[]>({
    queryKey: ['/api/schemes/recommended'],
  });

  if (userLoading || applicationsLoading || schemesLoading) {
    return (
      <div className="p-6 space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // Only show the latest draft per scheme (avoid duplicates)
  const draftApplicationsByScheme = new Map();
  applications?.filter(app => app.status === 'draft').forEach(app => {
    const existing = draftApplicationsByScheme.get(app.schemeId);
    if (!existing || new Date(app.createdAt) > new Date(existing.createdAt)) {
      draftApplicationsByScheme.set(app.schemeId, app);
    }
  });
  const draftApplications = Array.from(draftApplicationsByScheme.values());
  const submittedApplications = applications?.filter(app => app.status !== 'draft') || [];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">
            {t('welcome')}, {user?.name}!
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            {user?.district}, {user?.state}
          </p>
        </div>
        <Link href="/profile">
          <Button size="lg" variant="outline" data-testid="button-view-profile">
            <User className="mr-2 h-5 w-5" />
            {t('profile')}
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">{t('appliedSchemes')}</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-applied-count">{submittedApplications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">{t('draftApplications')}</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-draft-count">{draftApplications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Approved</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600" data-testid="text-approved-count">
              {applications?.filter(app => app.status === 'approved').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {draftApplications.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-6">{t('draftApplications')}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {draftApplications.map((app) => {
              const Icon = categoryIcons[app.scheme.category as keyof typeof categoryIcons] || Sprout;
              const completion = (app.currentStep / app.totalSteps) * 100;
              return (
                <Card key={app.id} className="hover-elevate" data-testid={`card-draft-${app.id}`}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{app.scheme.name}</CardTitle>
                        <Badge variant="secondary">{app.scheme.category}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">{t('completionRate')}</span>
                        <span className="font-medium">{Math.round(completion)}%</span>
                      </div>
                      <Progress value={completion} className="h-2" />
                    </div>
                    <Link href={`/apply/${app.schemeId}?applicationId=${app.id}`}>
                      <Button className="w-full" data-testid={`button-resume-${app.id}`}>
                        {t('resume')}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {submittedApplications.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-6">{t('appliedSchemes')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {submittedApplications.map((app) => {
              const Icon = categoryIcons[app.scheme.category as keyof typeof categoryIcons] || Sprout;
              return (
                <Card key={app.id} className="hover-elevate" data-testid={`card-application-${app.id}`}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{app.scheme.name}</CardTitle>
                        <Badge className={statusColors[app.status as keyof typeof statusColors]}>
                          {t(app.status.replace(' ', ''))}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/application/${app.id}`}>
                      <Button variant="outline" className="w-full" data-testid={`button-view-${app.id}`}>
                        {t('view')} {t('status')}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {recommendedSchemes && recommendedSchemes.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-6">{t('recommendedSchemes')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedSchemes.slice(0, 6).map((scheme) => {
              const Icon = categoryIcons[scheme.category as keyof typeof categoryIcons] || Sprout;
              return (
                <Card key={scheme.id} className="hover-elevate" data-testid={`card-scheme-${scheme.id}`}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <Icon className="h-12 w-12 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{scheme.name}</CardTitle>
                        <Badge variant="secondary">{scheme.category}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-base line-clamp-3">
                      {scheme.description}
                    </CardDescription>
                    <Link href={`/scheme/${scheme.id}`}>
                      <Button className="w-full" data-testid={`button-view-scheme-${scheme.id}`}>
                        {t('view')}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="mt-6 text-center">
            <Link href="/schemes">
              <Button variant="outline" size="lg" data-testid="button-view-all-schemes">
                View All Schemes
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
