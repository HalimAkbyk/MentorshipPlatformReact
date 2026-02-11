'use client';

import { useState } from 'react';
import { useRouter,useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { useAuthStore } from '../../../lib/stores/auth-store';
import { pickDefaultDashboard, safeRedirectPath } from '../../../lib/utils/auth-redirect';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Geçerli bir email adresi girin'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
const searchParams = useSearchParams();
const login = useAuthStore((s) => s.login);
const user = useAuthStore((s) => s.user);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: { email: string; password: string }) => {
  try {
    setIsLoading(true);

    await login(values.email, values.password);

    const stateUser = useAuthStore.getState().user;

    const redirect = safeRedirectPath(searchParams.get('redirect'));
    if (redirect) {
      router.replace(redirect);
      return;
    }

    router.replace(pickDefaultDashboard(stateUser?.roles));
  } catch (e) {
    // Global interceptor zaten toast basacak.
    // İstersen burada ekstra özel mesaj basma, double toast olur.
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Giriş Yap</CardTitle>
          <CardDescription className="text-center">
            Hesabına giriş yapmak için email ve şifreni gir
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Hesabın yok mu? </span>
            <Link href="/auth/signup" className="text-primary-600 hover:underline font-medium">
              Kayıt Ol
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
