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
import { Mail, Lock, Eye, EyeOff, LogIn, Shield, GraduationCap, Briefcase } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Geçerli bir email adresi girin'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const externalLogin = useAuthStore((s) => s.externalLogin);

  const [pendingSocial, setPendingSocial] = useState<{
    provider: string;
    token: string;
    displayName?: string;
  } | null>(null);

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

      if (result.pendingToken) {
        setPendingSocial({ provider, token: result.pendingToken, displayName });
        toast.info('Devam etmek için bir rol seçin');
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
      await externalLogin({
        ...pendingSocial,
        initialRole: role,
      });
      setPendingSocial(null);
      toast.success('Giriş başarılı!');
      navigateAfterAuth();
    } catch {
      // Error already handled by interceptor
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-green-50 to-emerald-50 px-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center mx-auto mb-3">
            <LogIn className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Giriş Yap</CardTitle>
          <CardDescription>
            Hesabına giriş yapmak için email ve şifreni gir
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
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  className="pl-10 focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10 focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white py-5 shadow-lg shadow-teal-500/25"
              disabled={isLoading}
            >
              {isLoading ? (
                'Giriş yapılıyor...'
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Giriş Yap
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Hesabın yok mu? </span>
            <Link href="/auth/signup" className="text-teal-600 hover:underline font-medium">
              Kayıt Ol
            </Link>
          </div>

          {/* Security badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Shield className="w-3.5 h-3.5" />
            <span>256-bit SSL ile güvenli bağlantı</span>
          </div>
        </CardContent>
      </Card>

      {/* Role Selection Modal */}
      {pendingSocial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <Card className="w-full max-w-sm border-0 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg text-center">Rol Seçin</CardTitle>
              <CardDescription className="text-center">
                Devam etmek için bir rol seçin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white py-5"
                onClick={() => handleRoleSelectAndRetry('Student')}
                disabled={isLoading}
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Danışan olarak devam et
              </Button>
              <Button
                variant="outline"
                className="w-full border-2 border-teal-300 hover:bg-teal-50 py-5"
                onClick={() => handleRoleSelectAndRetry('Mentor')}
                disabled={isLoading}
              >
                <Briefcase className="w-4 h-4 mr-2" />
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
