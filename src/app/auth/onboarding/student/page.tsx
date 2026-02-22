'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Phone, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/stores/auth-store';
import { UserRole } from '@/lib/types/enums';
import { userApi } from '@/lib/api/user';

const schema = z.object({
  displayName: z.string().min(2, 'En az 2 karakter'),
  phone: z.string().optional(),
  birthYear: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === undefined || v === '' ? undefined : Number(v)))
    .refine((v) => v === undefined || (v >= 1950 && v <= new Date().getFullYear()), {
      message: 'Geçerli bir doğum yılı girin',
    }),
});

type FormValues = z.infer<typeof schema>;

export default function StudentOnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, initialize } = useAuthStore();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // store initialize (senin projende provider da çağırıyor olabilir; double-call sorun değil)
    initialize?.();
  }, [initialize]);

  // guard
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // student değilse
    if (user && !user.roles.includes(UserRole.Student)) {
      router.push('/public');
    }
  }, [isLoading, isAuthenticated, user, router]);

  const defaultValues = useMemo<FormValues>(
    () => ({
      displayName: user?.displayName || '',
      phone: user?.phone || '',
      birthYear: user?.birthYear,
    }),
    [user]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    values: defaultValues,
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setSaving(true);

      const updated = await userApi.updateProfile({
  displayName: data.displayName,
  phone: data.phone || undefined,
  birthYear: data.birthYear,
});
useAuthStore.setState((s) => ({
  ...s,
  user: { ...(s.user as any), ...updated },
}));
      toast.success('Profil bilgileriniz kaydedildi');
      router.push('/student/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.errors?.[0] || 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-teal-600" />
              Öğrenci Onboarding
            </CardTitle>
            <CardDescription>
              Hızlıca profilini tamamla, ardından mentorları keşfetmeye başlayabilirsin.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* displayName */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Görünen Ad
                </label>
                <Input
                  placeholder="Örn: Halim"
                  {...form.register('displayName')}
                />
                {form.formState.errors.displayName && (
                  <p className="text-sm text-red-600">{form.formState.errors.displayName.message}</p>
                )}
              </div>

              {/* phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefon (opsiyonel)
                </label>
                <Input
                  placeholder="05xx xxx xx xx"
                  {...form.register('phone')}
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
                )}
              </div>

              {/* birthYear */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Doğum Yılı (opsiyonel)
                </label>
                <Input
                  type="number"
                  placeholder="2007"
                  {...form.register('birthYear')}
                />
                {form.formState.errors.birthYear && (
                  <p className="text-sm text-red-600">{form.formState.errors.birthYear.message as any}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push('/student/dashboard')}
                >
                  Şimdilik Geç
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Kaydediliyor...' : 'Kaydet ve Devam Et'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-gray-500 mt-4">
          Not: İleride öğrenciye özel hedef/alan bilgileri ekleyeceksen backend’de `/students/me/profile`
          gibi bir endpoint açıp bu ekranı genişletebiliriz.
        </p>
      </div>
    </div>
  );
}
