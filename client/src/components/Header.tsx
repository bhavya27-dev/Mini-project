import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sprout, LogOut, LayoutDashboard, FileText, User, Shield } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Header() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const { data: user } = useQuery({
    queryKey: ['/api/user/profile'],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/auth/logout', {});
    },
    onSuccess: () => {
      setLocation('/login');
    },
  });

  return (
    <header className="border-b bg-card sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <Link href={user?.isAdmin ? '/admin' : '/dashboard'}>
          <div className="flex items-center gap-3 cursor-pointer hover-elevate rounded-lg p-2 -ml-2" data-testid="link-home">
            <div className="bg-primary rounded-full p-2">
              <Sprout className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">{t('appName')}</h1>
              <p className="text-xs text-muted-foreground">Government Schemes Portal</p>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-4 flex-wrap">
          <LanguageSwitcher />
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default" data-testid="button-user-menu">
                  <User className="h-4 w-4 mr-2" />
                  {user.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {!user.isAdmin ? (
                  <>
                    <Link href="/dashboard">
                      <DropdownMenuItem className="cursor-pointer" data-testid="menu-dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        {t('dashboard')}
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/schemes">
                      <DropdownMenuItem className="cursor-pointer" data-testid="menu-schemes">
                        <FileText className="mr-2 h-4 w-4" />
                        {t('schemes')}
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/profile">
                      <DropdownMenuItem className="cursor-pointer" data-testid="menu-profile">
                        <User className="mr-2 h-4 w-4" />
                        {t('profile')}
                      </DropdownMenuItem>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/admin">
                      <DropdownMenuItem className="cursor-pointer" data-testid="menu-admin-dashboard">
                        <Shield className="mr-2 h-4 w-4" />
                        {t('admin')}
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/admin/schemes">
                      <DropdownMenuItem className="cursor-pointer" data-testid="menu-manage-schemes">
                        <FileText className="mr-2 h-4 w-4" />
                        Manage Schemes
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/admin/applications">
                      <DropdownMenuItem className="cursor-pointer" data-testid="menu-review-applications">
                        <FileText className="mr-2 h-4 w-4" />
                        Review Applications
                      </DropdownMenuItem>
                    </Link>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logoutMutation.mutate()}
                  className="cursor-pointer text-destructive"
                  data-testid="menu-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
