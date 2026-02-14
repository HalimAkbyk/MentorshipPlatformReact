'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/stores/auth-store';
import { pickDefaultDashboard, safeRedirectPath } from '@/lib/utils/auth-redirect';
import { SocialLoginButtons } from '@/components/auth/social-login-buttons';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Gecerli bir email adresi girin'),
  password: z.string().min(8, 'Sifre en az 8 karakter olmali'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const externalLogin = useAuthStore((s) => s.externalLogin);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const navigateAfterAuth = () => {
    const stateUser = useAuthStore.getState().user;
    const redirect = safeRedirectPath(searchParams.get('redirect'));
    if (redirect) {
      router.replace(redirect);
      return;
    }
    router.replace(pickDefaultDashboard(stateUser?.roles));
  };

  const onSubmit = async (values: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      await login(values.email, values.password);
      navigateAfterAuth();
    } catch (e) {
      // Global interceptor handles toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string, token: string, displayName?: string) => {
    try {
      setIsLoading(true);
      const result = await externalLogin({ provider, token, displayName });

      // New user — needs role selection → redirect to signup
      if (result.pendingToken) {
        toast.info('Lutfen kayit sayfasindan rol seciniz');
        router.push('/auth/signup');
        return;
      }

      if (result.isNewUser) {
        toast.success('Hesabiniz olusturuldu!');
      }

      navigateAfterAuth();
    } catch {
      // Error handled by global interceptor
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Giris Yap</CardTitle>
          <CardDescription className="text-center">
            Hesabina giris yapmak icin email ve sifreni gir
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Social Login Buttons */}
          <SocialLoginButtons
            mode="login"
            onSuccess={handleSocialLogin}
            onError={(msg) => toast.error(msg)}
            disabled={isLoading}
          />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">veya</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Sifre
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Giris yapiliyor...' : 'Giris Yap'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Hesabin yok mu? </span>
            <Link href="/auth/signup" className="text-primary-600 hover:underline font-medium">
              Kayit Ol
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
