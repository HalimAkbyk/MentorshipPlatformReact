'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCreateCourse } from '@/lib/hooks/use-courses';
import { CourseLevel } from '@/lib/types/enums';
import { ROUTES } from '@/lib/constants/routes';
import { useCategoryNames } from '@/lib/hooks/use-categories';

// ==================== SCHEMA ====================

const createCourseSchema = z.object({
  title: z
    .string()
    .min(3, 'Kurs adı en az 3 karakter olmalı')
    .max(150, 'Kurs adı en fazla 150 karakter olmalı'),
  shortDescription: z
    .string()
    .max(300, 'Kısa açıklama en fazla 300 karakter')
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .max(5000, 'Açıklama en fazla 5000 karakter')
    .optional()
    .or(z.literal('')),
  price: z.coerce
    .number()
    .min(0, 'Fiyat 0 veya daha fazla olmalı'),
  category: z.string().optional().or(z.literal('')),
  language: z.string().default('tr'),
  level: z.string().default(CourseLevel.AllLevels),
});

type CreateCourseFormData = z.infer<typeof createCourseSchema>;

// ==================== CONSTANTS ====================

const LEVELS = [
  { value: CourseLevel.AllLevels, label: 'Tüm Seviyeler' },
  { value: CourseLevel.Beginner, label: 'Başlangıç' },
  { value: CourseLevel.Intermediate, label: 'Orta' },
  { value: CourseLevel.Advanced, label: 'İleri' },
];

// ==================== MAIN PAGE ====================

export default function NewCoursePage() {
  const router = useRouter();
  const createMutation = useCreateCourse();
  const categoryNames = useCategoryNames('Course');
  const CATEGORIES = [
    { value: '', label: 'Kategori seçin...' },
    ...categoryNames.map((name) => ({ value: name, label: name })),
  ];

  const form = useForm<CreateCourseFormData>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      title: '',
      shortDescription: '',
      description: '',
      price: 0,
      category: '',
      language: 'tr',
      level: CourseLevel.AllLevels,
    },
  });

  const onSubmit = async (data: CreateCourseFormData) => {
    try {
      const result = await createMutation.mutateAsync({
        title: data.title,
        shortDescription: data.shortDescription || undefined,
        description: data.description || undefined,
        price: data.price,
        category: data.category || undefined,
        language: data.language || 'tr',
        level: data.level || undefined,
      });
      toast.success('Kurs başarıyla oluşturuldu!');
      router.push(ROUTES.MENTOR_COURSE_EDIT(result.id));
    } catch {
      toast.error('Kurs oluşturulurken hata oluştu');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push(ROUTES.MENTOR_COURSES)}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Yeni Kurs Oluştur</h1>
            <p className="text-sm text-gray-500">Kursunuzun temel bilgilerini girin</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Kurs Adı <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="örn: React ile Modern Web Geliştirme"
                  {...form.register('title')}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Kısa Açıklama</label>
                <Input
                  placeholder="Kursunuzu kısa bir cümleyle tanıtın"
                  {...form.register('shortDescription')}
                />
                {form.formState.errors.shortDescription && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.shortDescription.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Detaylı Açıklama</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[120px]"
                  placeholder="Kursunuzun içeriğini, hedeflerini ve kazanımlarını detaylı anlatın"
                  {...form.register('description')}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Fiyat (TRY) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    {...form.register('price')}
                  />
                  {form.formState.errors.price && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.price.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Kategori</label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 h-10 bg-white"
                    {...form.register('category')}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Level & Language */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Seviye</label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 h-10 bg-white"
                    {...form.register('level')}
                  >
                    {LEVELS.map((lvl) => (
                      <option key={lvl.value} value={lvl.value}>
                        {lvl.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Dil</label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 h-10 bg-white"
                    {...form.register('language')}
                  >
                    <option value="tr">Türkçe</option>
                    <option value="en">İngilizce</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(ROUTES.MENTOR_COURSES)}
                >
                  Geri
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Oluştur
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
