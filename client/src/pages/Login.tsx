import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@shared/schema';
import type { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LogIn, Sprout } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [phone, setPhone] = useState('');

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof loginSchema>) => {
      const response = await apiRequest('POST', '/api/auth/login', data);
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('Login successful:', { name: data.user.name, isAdmin: data.user.isAdmin });
      setPhone(data.user.phone);
      
      // Clear all cached queries to ensure fresh data for this user
      queryClient.clear();
      
      // Redirect based on user role
      if (data.user.isAdmin === true) {
        console.log('Redirecting to admin dashboard');
        setLocation('/admin');
      } else {
        console.log('Redirecting to user dashboard');
        setLocation('/dashboard');
      }
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message,
      });
    },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="bg-primary rounded-full p-4">
              <Sprout className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center">{t('appName')}</CardTitle>
          <CardDescription className="text-center text-lg">{t('login')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">{t('phone')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="9876543210"
                        className="text-lg h-12"
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">{t('password')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        className="text-lg h-12"
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-12 text-lg"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                <LogIn className="mr-2 h-5 w-5" />
                {loginMutation.isPending ? 'Loading...' : t('login')}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center">
            <p className="text-base text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline font-medium" data-testid="link-signup">
                {t('signup')}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
