import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Clock, AlertCircle, XCircle, ArrowLeft } from 'lucide-react';
import type { Application, Scheme, ApplicationStatusHistory } from '@shared/schema';

const statusIcons = {
  draft: Clock,
  submitted: CheckCircle2,
  'under review': AlertCircle,
  approved: CheckCircle2,
  rejected: XCircle,
};

const statusColors = {
  draft: 'bg-gray-500',
  submitted: 'bg-blue-500',
  'under review': 'bg-yellow-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
};

export default function ApplicationStatus() {
  const { t } = useLanguage();
  const { id } = useParams();

  const { data: application, isLoading } = useQuery<Application & { scheme: Scheme; statusHistory: ApplicationStatusHistory[] }>({
    queryKey: ['/api/applications', id],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-8">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-6 text-center">
        <p className="text-xl text-muted-foreground">Application not found</p>
      </div>
    );
  }

  const StatusIcon = statusIcons[application.status as keyof typeof statusIcons] || Clock;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/dashboard">
          <Button variant="ghost" data-testid="button-back">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Dashboard
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-3xl mb-2">{application.scheme.name}</CardTitle>
                <p className="text-lg text-muted-foreground">Application ID: {application.id.slice(0, 8)}</p>
              </div>
              <Badge className={`${statusColors[application.status as keyof typeof statusColors]} text-lg px-4 py-2`}>
                {t(application.status.replace(' ', ''))}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Submitted On</p>
                <p className="text-lg font-medium">
                  {application.submittedAt 
                    ? new Date(application.submittedAt).toLocaleDateString('en-IN', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : 'Not submitted yet'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Category</p>
                <p className="text-lg font-medium">{application.scheme.category}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Application Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {application.statusHistory && application.statusHistory.length > 0 ? (
                application.statusHistory.map((history, index) => {
                  const Icon = statusIcons[history.status as keyof typeof statusIcons] || Clock;
                  const isLast = index === application.statusHistory.length - 1;
                  return (
                    <div key={history.id} className="flex gap-4" data-testid={`status-history-${index}`}>
                      <div className="flex flex-col items-center">
                        <div className={`rounded-full p-2 ${statusColors[history.status as keyof typeof statusColors]}`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        {!isLast && <div className="w-0.5 h-full bg-border mt-2"></div>}
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="font-semibold text-lg capitalize">{history.status}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(history.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {history.notes && (
                          <p className="mt-2 text-base">{history.notes}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`rounded-full p-2 ${statusColors[application.status as keyof typeof statusColors]}`}>
                      <StatusIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg capitalize">{application.status}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(application.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {application.reviewNotes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Review Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{application.reviewNotes}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Application Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-base">
              {application.formData.applicantName && (
                <div>
                  <span className="font-semibold">Applicant Name: </span>
                  <span>{application.formData.applicantName}</span>
                </div>
              )}
              {application.formData.annualIncome && (
                <div>
                  <span className="font-semibold">Annual Income: </span>
                  <span>₹{application.formData.annualIncome.toLocaleString()}</span>
                </div>
              )}
              {application.formData.address && (
                <div>
                  <span className="font-semibold">Address: </span>
                  <span>{application.formData.address}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
