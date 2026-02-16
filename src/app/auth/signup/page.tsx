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
import { UserRole } from '@/lib/types/enums';

const signupSchema = z.object({
  displayName: z.string().min(2, 'İsim en az 2 karakter olmalı'),
  email: z.string().email('Geçerli bir email adresi girin'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı'),
  role: z.enum(['Student', 'Mentor']),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const signup = useAuthStore((s) => s.signup);
  const externalLogin = useAuthStore((s) => s.externalLogin);
  const defaultRole = searchParams.get('role') === 'mentor' ? 'Mentor' : 'Student';

  // Pending social login data (waiting for role selection)
  const [pendingSocial, setPendingSocial] = useState<{
    provider: string;
    token: string;
    displayName?: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: defaultRole,
    },
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

  const onSubmit = async (values: { email: string; password: string; displayName: string; role: string }) => {
    try {
      setIsLoading(true);
      await signup(values.email, values.password, values.displayName, values.role);
      navigateAfterAuth();
    } catch (e) {
      // Interceptor handles toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string, token: string, displayName?: string) => {
    try {
      setIsLoading(true);
      // Signup page → always send initialRole from the form
      const selectedRole = watch('role') || defaultRole;
      const result = await externalLogin({
        provider,
        token,
        displayName,
        initialRole: selectedRole,
      });

      // Shouldn't normally get pendingToken on signup (we always send role),
      // but handle gracefully
      if (result.pendingToken) {
        setPendingSocial({ provider, token: result.pendingToken, displayName });
        toast.info('Lütfen rol seçiniz ve tekrar deneyin');
        return;
      }

      if (result.isNewUser) {
        toast.success('Hesabınız oluşturuldu!');
      }

      navigateAfterAuth();
    } catch {
      // Error handled by global interceptor
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelectAndRetry = async (role: 'Student' | 'Mentor') => {
    if (!pendingSocial) return;
    try {
      setIsLoading(true);
      const result = await externalLogin({
        ...pendingSocial,
        initialRole: role,
      });
      setPendingSocial(null);
      toast.success('Hesabınız oluşturuldu!');
      navigateAfterAuth();
    } catch (e) {
      // Error already handled by interceptor
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-primary-50/30 to-gray-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold font-heading text-center">Kayıt Ol</CardTitle>
          <CardDescription className="text-center">
            Değişim Mentorluk&apos;a katılmak için bilgilerini gir
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Role Selection — shown first for social login context */}
          <div className="space-y-2 mb-4">
            <label className="text-sm font-medium">Rol Seçimi</label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value={UserRole.Student}
                  {...register('role')}
                  className="text-primary-600"
                />
                <span>Danışan</span>
              </label>
              <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value={UserRole.Mentor}
                  {...register('role')}
                  className="text-primary-600"
                />
                <span>Mentor</span>
              </label>
            </div>
            {errors.role && (
              <p className="text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          {/* Social Login Buttons */}
          <SocialLoginButtons
            mode="signup"
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
              <label htmlFor="displayName" className="text-sm font-medium">
                İsim Soyisim
              </label>
              <Input
                id="displayName"
                placeholder="Ahmet Yılmaz"
                {...register('displayName')}
              />
              {errors.displayName && (
                <p className="text-sm text-red-600">{errors.displayName.message}</p>
              )}
            </div>

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
                Şifre
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
              {isLoading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Zaten hesabin var mi? </span>
            <Link href="/auth/login" className="text-primary-600 hover:underline font-medium">
              Giriş Yap
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Role Selection Modal (for pending social login) */}
      {pendingSocial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-lg text-center">Rol Seçin</CardTitle>
              <CardDescription className="text-center">
                Devam etmek için bir rol seçin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={() => handleRoleSelectAndRetry('Student')}
                disabled={isLoading}
              >
                Danışan olarak devam et
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleRoleSelectAndRetry('Mentor')}
                disabled={isLoading}
              >
                Mentor olarak devam et
              </Button>
              <Button
                variant="ghost"
                className="w-full text-gray-500"
                onClick={() => setPendingSocial(null)}
                disabled={isLoading}
              >
                İptal
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
