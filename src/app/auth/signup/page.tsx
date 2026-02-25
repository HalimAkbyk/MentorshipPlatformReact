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
import { safeRedirectPath } from '@/lib/utils/auth-redirect';
import { SocialLoginButtons } from '@/components/auth/social-login-buttons';
import { toast } from 'sonner';
import { useFeatureFlag } from '@/lib/hooks/use-feature-flags';
import { AlertTriangle, Mail, Lock, Eye, EyeOff, User, Shield, UserPlus } from 'lucide-react';

const signupSchema = z.object({
  displayName: z.string().min(2, 'İsim en az 2 karakter olmalı'),
  email: z.string().email('Geçerli bir email adresi girin'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı'),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const signup = useAuthStore((s) => s.signup);
  const externalLogin = useAuthStore((s) => s.externalLogin);
  const registrationEnabled = useFeatureFlag('registration_enabled');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const navigateAfterAuth = () => {
    const redirect = safeRedirectPath(searchParams.get('redirect'));
    if (redirect) {
      router.replace(redirect);
      return;
    }
    // Herkes öğrenci olarak kaydolduğu için student onboarding'e yönlendir
    router.replace('/auth/onboarding/student');
  };

  const onSubmit = async (values: SignupForm) => {
    try {
      setIsLoading(true);
      await signup(values.email, values.password, values.displayName, 'Student');
      navigateAfterAuth();
    } catch {
      // Interceptor handles toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string, token: string, displayName?: string) => {
    try {
      setIsLoading(true);
      const result = await externalLogin({
        provider,
        token,
        displayName,
        initialRole: 'Student',
      });

      // Eğer pendingToken dönerse, Student rolüyle tekrar dene
      if (result.pendingToken) {
        await externalLogin({
          provider,
          token: result.pendingToken,
          displayName,
          initialRole: 'Student',
        });
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

  // Registration disabled state
  if (!registrationEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-green-50 to-emerald-50 px-4 py-8">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="h-7 w-7 text-amber-500" />
            </div>
            <CardTitle className="text-2xl font-bold">Kayıtlar Kapatıldı</CardTitle>
            <CardDescription className="text-base">
              Yeni kullanıcı kayıtları geçici olarak durdurulmuştur. Lütfen daha sonra tekrar deneyin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-3">
              <Link href="/auth/login">
                <Button variant="outline" className="w-full border-teal-300 text-teal-700 hover:bg-teal-50">
                  Mevcut Hesabınla Giriş Yap
                </Button>
              </Link>
              <Link href="/public" className="block text-sm text-teal-600 hover:underline">
                Ana Sayfaya Dön
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-green-50 to-emerald-50 px-4 py-8">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Kayıt Ol</CardTitle>
          <CardDescription>
            Değişim Mentorluk&apos;a katılmak için bilgilerini gir
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              <label htmlFor="displayName" className="text-sm font-medium text-gray-700">
                İsim Soyisim
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="displayName"
                  placeholder="Ahmet Yılmaz"
                  className="pl-10 focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                  {...register('displayName')}
                />
              </div>
              {errors.displayName && (
                <p className="text-sm text-red-600">{errors.displayName.message}</p>
              )}
            </div>

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
              <p className="text-xs text-gray-400">En az 8 karakter, büyük/küçük harf ve rakam içermeli</p>
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
                'Kayıt yapılıyor...'
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Kayıt Ol
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Zaten hesabın var mı? </span>
            <Link href="/auth/login" className="text-teal-600 hover:underline font-medium">
              Giriş Yap
            </Link>
          </div>

          {/* Security badges */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> 256-bit SSL</span>
            <span>KVKK Uyumlu</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
