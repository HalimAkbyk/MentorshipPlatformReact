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
import { useFeatureFlag } from '@/lib/hooks/use-feature-flags';
import { AlertTriangle, Mail, Lock, Eye, EyeOff, User, Shield, GraduationCap, Briefcase, UserPlus } from 'lucide-react';

const signupSchema = z.object({
  displayName: z.string().min(2, 'İsim en az 2 karakter olmalı'),
  email: z.string().email('Geçerli bir email adresi girin'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı'),
  role: z.enum(['Student', 'Mentor']),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const signup = useAuthStore((s) => s.signup);
  const externalLogin = useAuthStore((s) => s.externalLogin);
  const defaultRole = searchParams.get('role') === 'mentor' ? 'Mentor' : 'Student';
  const registrationEnabled = useFeatureFlag('registration_enabled');

  const [pendingSocial, setPendingSocial] = useState<{
    provider: string;
    token: string;
    displayName?: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: defaultRole,
    },
  });

  const selectedRole = watch('role');

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
      const currentRole = watch('role') || defaultRole;
      const result = await externalLogin({
        provider,
        token,
        displayName,
        initialRole: currentRole,
      });

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
      await externalLogin({
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
          {/* Role Selection */}
          <div className="space-y-2 mb-5">
            <label className="text-sm font-medium text-gray-700">Rol Seçimi</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('role', 'Student')}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  selectedRole === 'Student'
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <GraduationCap className="w-5 h-5" />
                <span className="font-medium text-sm">Danışan</span>
              </button>
              <button
                type="button"
                onClick={() => setValue('role', 'Mentor')}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  selectedRole === 'Mentor'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Briefcase className="w-5 h-5" />
                <span className="font-medium text-sm">Mentor</span>
              </button>
            </div>
            {/* Hidden input for react-hook-form */}
            <input type="hidden" {...register('role')} />
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

      {/* Role Selection Modal (for pending social login) */}
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
