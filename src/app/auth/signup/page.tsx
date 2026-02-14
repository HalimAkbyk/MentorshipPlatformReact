'use client';

import { use, useState } from 'react';
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
  const defaultRole = searchParams.get('role') === 'mentor' ? 'Mentor' : 'Student';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: defaultRole,
    },
  });

  const onSubmit = async (values: { email: string; password: string; displayName: string; role: string }) => {
  try {
    setIsLoading(true);

    await signup(values.email, values.password, values.displayName, values.role);

    const stateUser = useAuthStore.getState().user;

    const redirect = safeRedirectPath(searchParams.get('redirect'));
    if (redirect) {
      router.replace(redirect);
      return;
    }

    router.replace(pickDefaultDashboard(stateUser?.roles));
  } catch (e) {
    // Interceptor toast basıyor
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Kayıt Ol</CardTitle>
          <CardDescription className="text-center">
            MentorHub'a katılmak için bilgilerini gir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
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
                  <span>Mentör</span>
                </label>
              </div>
              {errors.role && (
                <p className="text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

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
            <span className="text-gray-600">Zaten hesabın var mı? </span>
            <Link href="/auth/login" className="text-primary-600 hover:underline font-medium">
              Giriş Yap
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}