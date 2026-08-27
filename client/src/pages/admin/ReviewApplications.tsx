import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import type { Application, Scheme } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const statusColors = {
  draft: 'bg-gray-500',
  submitted: 'bg-blue-500',
  'under review': 'bg-yellow-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
};

export default function ReviewApplications() {
  const { toast } = useToast();
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  const { data: applications } = useQuery<(Application & { scheme: Scheme })[]>({
    queryKey: ['/api/admin/applications'],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      return await apiRequest('PATCH', `/api/admin/applications/${id}`, { status, reviewNotes: notes });
    },
    onSuccess: () => {
      toast({
        title: 'Status Updated',
        description: 'Application status has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/applications'] });
      setSelectedApp(null);
      setNewStatus('');
      setReviewNotes('');
    },
  });

  const handleUpdateStatus = () => {
    if (selectedApp && newStatus) {
      updateStatusMutation.mutate({ id: selectedApp, status: newStatus, notes: reviewNotes });
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold mb-2">Review Applications</h1>
        <p className="text-lg text-muted-foreground">Review and update application statuses</p>
      </div>

      {applications && applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id} data-testid={`card-application-${app.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="text-xl mb-2">{app.scheme.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">Application ID: {app.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      Submitted: {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'Draft'}
                    </p>
                  </div>
                  <Badge className={statusColors[app.status as keyof typeof statusColors]}>
                    {app.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Applicant: </span>
                    <span>{app.formData.applicantName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Annual Income: </span>
                    <span>₹{app.formData.annualIncome?.toLocaleString() || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Link href={`/admin/application/${app.id}`}>
                    <Button variant="outline" data-testid={`button-view-${app.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="secondary"
                        onClick={() => setSelectedApp(app.id)}
                        data-testid={`button-update-status-${app.id}`}
                      >
                        Update Status
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Application Status</DialogTitle>
                        <DialogDescription>
                          Change the status and add review notes
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="status">New Status</Label>
                          <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger className="mt-2" data-testid="select-new-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="under review">Under Review</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="notes">Review Notes</Label>
                          <Textarea
                            id="notes"
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            className="mt-2"
                            rows={4}
                            placeholder="Add any notes about this review..."
                            data-testid="input-review-notes"
                          />
                        </div>
                        <Button
                          onClick={handleUpdateStatus}
                          className="w-full"
                          disabled={!newStatus || updateStatusMutation.isPending}
                          data-testid="button-confirm-update"
                        >
                          {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  {app.status === 'submitted' && (
                    <>
                      <Button
                        variant="default"
                        onClick={() => {
                          updateStatusMutation.mutate({ id: app.id, status: 'approved', notes: 'Approved' });
                        }}
                        data-testid={`button-approve-${app.id}`}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          updateStatusMutation.mutate({ id: app.id, status: 'rejected', notes: 'Rejected' });
                        }}
                        data-testid={`button-reject-${app.id}`}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-xl text-muted-foreground">No applications to review</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
