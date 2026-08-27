import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Sprout, Briefcase, Heart, GraduationCap, Home as HomeIcon } from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Scheme } from '@shared/schema';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const categoryIcons = {
  Agriculture: Sprout,
  Business: Briefcase,
  'Women Empowerment': Heart,
  'Education & Training': GraduationCap,
  Housing: HomeIcon,
  Healthcare: Heart,
};

export default function ManageSchemes() {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const { data: schemes, isLoading } = useQuery<Scheme[]>({
    queryKey: ['/api/schemes'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/admin/schemes/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: 'Scheme Deleted',
        description: 'The scheme has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/schemes'] });
    },
  });

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Manage Schemes</h1>
          <p className="text-lg text-muted-foreground">Add, edit, or remove government schemes</p>
        </div>
        <Link href="/admin/schemes/new">
          <Button size="lg" data-testid="button-add-scheme">
            <Plus className="mr-2 h-5 w-5" />
            Add New Scheme
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : schemes && schemes.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {schemes.map((scheme) => {
            const Icon = categoryIcons[scheme.category as keyof typeof categoryIcons] || Sprout;
            const schemeName = language === 'kn' && scheme.nameKannada ? scheme.nameKannada :
                               language === 'hi' && scheme.nameHindi ? scheme.nameHindi :
                               scheme.name;
            const schemeDesc = language === 'kn' && scheme.descriptionKannada ? scheme.descriptionKannada :
                               language === 'hi' && scheme.descriptionHindi ? scheme.descriptionHindi :
                               scheme.description;
            return (
              <Card key={scheme.id} data-testid={`card-scheme-${scheme.id}`}>
                <CardHeader>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <Badge variant="secondary">{t(scheme.category.toLowerCase().replace(/\s+/g, ''))}</Badge>
                  </div>
                  <CardTitle className="text-xl">{schemeName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-base text-muted-foreground line-clamp-3">{schemeDesc}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Link href={`/admin/schemes/edit/${scheme.id}`}>
                      <Button variant="outline" data-testid={`button-edit-${scheme.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" data-testid={`button-delete-${scheme.id}`}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this scheme and all associated applications.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(scheme.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-xl text-muted-foreground mb-4">No schemes found</p>
            <Link href="/admin/schemes/new">
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Add Your First Scheme
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
