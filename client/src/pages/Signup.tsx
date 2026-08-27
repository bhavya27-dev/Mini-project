import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertUserSchema } from '@shared/schema';
import type { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Sprout } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const indianStates = ['Karnataka', 'Maharashtra', 'Tamil Nadu', 'Kerala', 'Andhra Pradesh', 'Telangana'];
const occupations = ['Farmer', 'Small Business Owner', 'Artisan', 'Trader', 'Daily Wage Worker'];

export default function Signup() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof insertUserSchema>>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      password: '',
      state: '',
      district: '',
      occupation: '',
      monthlyIncome: 0,
      hasLand: false,
      landArea: 0,
      gender: '',
      dateOfBirth: '',
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertUserSchema>) => {
      const response = await apiRequest('POST', '/api/auth/signup', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Account Created',
        description: 'Your account has been created successfully. Please login.',
      });
      setLocation('/login');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: error.message,
      });
    },
  });

  const onSubmit = (data: z.infer<typeof insertUserSchema>) => {
    signupMutation.mutate(data);
  };

  const hasLand = form.watch('hasLand');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="bg-primary rounded-full p-4">
                <Sprout className="h-12 w-12 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-center">{t('appName')}</CardTitle>
            <CardDescription className="text-center text-lg">{t('signup')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">{t('name')}</FormLabel>
                      <FormControl>
                        <Input {...field} className="text-lg h-12" data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">{t('phone')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="9876543210" className="text-lg h-12" data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">{t('email')} (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" className="text-lg h-12" data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">{t('password')}</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" className="text-lg h-12" data-testid="input-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">{t('state')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base" data-testid="select-state">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {indianStates.map((state) => (
                              <SelectItem key={state} value={state} className="text-base">
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">{t('district')}</FormLabel>
                        <FormControl>
                          <Input {...field} className="text-lg h-12" data-testid="input-district" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">{t('occupation')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base" data-testid="select-occupation">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {occupations.map((occ) => (
                              <SelectItem key={occ} value={occ} className="text-base">
                                {occ}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="monthlyIncome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">{t('monthlyIncome')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="text-lg h-12"
                            data-testid="input-monthly-income"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="hasLand"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-1"
                          data-testid="checkbox-has-land"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-base">{t('hasLand')}</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                {hasLand && (
                  <FormField
                    control={form.control}
                    name="landArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">{t('landArea')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="text-lg h-12"
                            data-testid="input-land-area"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">{t('gender')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base" data-testid="select-gender">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male" className="text-base">{t('male')}</SelectItem>
                            <SelectItem value="Female" className="text-base">{t('female')}</SelectItem>
                            <SelectItem value="Other" className="text-base">{t('other')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">{t('dateOfBirth')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" className="text-lg h-12" data-testid="input-date-of-birth" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-lg"
                  disabled={signupMutation.isPending}
                  data-testid="button-signup"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  {signupMutation.isPending ? 'Creating Account...' : t('signup')}
                </Button>
              </form>
            </Form>
            <div className="mt-6 text-center">
              <p className="text-base text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium" data-testid="link-login">
                  {t('login')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
