import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Users, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'wouter';
import type { Application } from '@shared/schema';

export default function AdminDashboard() {
  const { data: applications } = useQuery<Application[]>({
    queryKey: ['/api/admin/applications'],
  });

  const { data: schemes } = useQuery({
    queryKey: ['/api/schemes'],
  });

  const pendingCount = applications?.filter(app => app.status === 'submitted' || app.status === 'under review').length || 0;
  const approvedCount = applications?.filter(app => app.status === 'approved').length || 0;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-lg text-muted-foreground">Manage schemes and review applications</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Total Schemes</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-schemes">{schemes?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Total Applications</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-applications">{applications?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Pending Review</CardTitle>
            <Clock className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600" data-testid="text-pending-count">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Approved</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600" data-testid="text-approved-count">{approvedCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/admin/schemes">
              <Button className="w-full justify-start h-auto py-4" size="lg" data-testid="button-manage-schemes">
                <FileText className="mr-3 h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold text-base">Manage Schemes</div>
                  <div className="text-sm text-muted-foreground">Add, edit, or remove schemes</div>
                </div>
              </Button>
            </Link>
            <Link href="/admin/applications">
              <Button className="w-full justify-start h-auto py-4" size="lg" variant="secondary" data-testid="button-review-applications">
                <Users className="mr-3 h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold text-base">Review Applications</div>
                  <div className="text-sm text-muted-foreground">Approve or reject pending applications</div>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {applications && applications.length > 0 ? (
              <div className="space-y-3">
                {applications.slice(0, 5).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg" data-testid={`recent-app-${app.id}`}>
                    <div>
                      <p className="font-medium text-sm">{app.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{app.status}</p>
                    </div>
                    <Link href={`/admin/application/${app.id}`}>
                      <Button size="sm" variant="ghost">View</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No applications yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
