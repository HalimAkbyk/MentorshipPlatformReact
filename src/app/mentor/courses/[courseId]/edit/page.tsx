'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Save, Send, Plus, Trash2, Pencil,
  ChevronDown, ChevronRight, Video, FileText, Eye, X,
  Upload, CheckCircle, Image, BookOpen, GripVertical, Move,
} from 'lucide-react';
import { toast } from 'sonner';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useConfirm } from '@/lib/hooks/useConfirm';
import {
  useCourseForEdit,
  useUpdateCourse,
  usePublishCourse,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
  useCreateLecture,
  useUpdateLecture,
  useDeleteLecture,
} from '@/lib/hooks/use-courses';
import { coursesApi } from '@/lib/api/courses';
import { CourseLevel, CourseStatus, LectureType } from '@/lib/types/enums';
import { ROUTES } from '@/lib/constants/routes';
import type { CourseEditDto, CourseSectionEditDto, CourseLectureEditDto } from '@/lib/types/models';

// ==================== SCHEMA ====================

const courseSettingsSchema = z.object({
  title: z.string().min(3, 'Kurs adı en az 3 karakter').max(150),
  shortDescription: z.string().max(300).optional().or(z.literal('')),
  description: z.string().max(5000).optional().or(z.literal('')),
  price: z.coerce.number().min(0, 'Fiyat 0 veya daha fazla olmalı'),
  level: z.string(),
  category: z.string().optional().or(z.literal('')),
  language: z.string().default('tr'),
  coverImageUrl: z.string().optional().or(z.literal('')),
  coverImagePosition: z.string().optional().or(z.literal('')),
  whatYouWillLearn: z.array(z.object({ value: z.string() })).max(10),
  requirements: z.array(z.object({ value: z.string() })).max(10),
  targetAudience: z.array(z.object({ value: z.string() })).max(5),
});

type CourseSettingsFormData = z.infer<typeof courseSettingsSchema>;

// ==================== CONSTANTS ====================

const CATEGORIES = [
  { value: '', label: 'Kategori seçin...' },
  { value: 'Yazılım', label: 'Yazılım' },
  { value: 'Tasarım', label: 'Tasarım' },
  { value: 'Pazarlama', label: 'Pazarlama' },
  { value: 'Kişisel Gelişim', label: 'Kişisel Gelişim' },
  { value: 'Dil', label: 'Dil' },
  { value: 'Müzik', label: 'Müzik' },
  { value: 'Diğer', label: 'Diğer' },
];

const LEVELS = [
  { value: CourseLevel.AllLevels, label: 'Tüm Seviyeler' },
  { value: CourseLevel.Beginner, label: 'Başlangıç' },
  { value: CourseLevel.Intermediate, label: 'Orta' },
  { value: CourseLevel.Advanced, label: 'İleri' },
];

function formatDuration(totalSec: number): string {
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) return `${hours}s ${minutes.toString().padStart(2, '0')}dk`;
  return `${minutes}dk`;
}

// ==================== MAIN PAGE ====================

export default function CourseEditPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const router = useRouter();

  const { data: course, isLoading } = useCourseForEdit(courseId);
  const publishMutation = usePublishCourse();

  // ===== Publish =====

  const handlePublish = async () => {
    if (!course) return;

    const totalLectures = course.sections.reduce((sum, s) => sum + s.lectures.length, 0);
    if (course.sections.length === 0 || totalLectures === 0) {
      toast.error('Yayınlamak için en az 1 bölüm ve 1 ders gerekli');
      return;
    }

    try {
      await publishMutation.mutateAsync(courseId);
      toast.success('Kurs başarıyla yayınlandı!');
    } catch {
      toast.error('Kurs yayınlanırken hata oluştu');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Kurs bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(ROUTES.MENTOR_COURSES)}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold truncate max-w-md">{course.title}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{course.sections.length} bölüm</span>
                <span>-</span>
                <span>{course.totalLectures} ders</span>
                <span>-</span>
                <span>{formatDuration(course.totalDurationSec)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {course.status === CourseStatus.Draft && (
              <Button onClick={handlePublish} disabled={publishMutation.isPending} className="gap-2">
                {publishMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Yayınla
              </Button>
            )}
            {course.status === CourseStatus.Published && (
              <Badge variant="success">Yayında</Badge>
            )}
            {course.status === CourseStatus.Archived && (
              <Badge variant="secondary">Arşiv</Badge>
            )}
          </div>
        </div>
      </header>

      {/* Two Column Layout */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT: Settings */}
          <div className="w-full lg:w-[40%]">
            <CourseSettingsForm course={course} courseId={courseId} />
          </div>

          {/* RIGHT: Curriculum */}
          <div className="w-full lg:w-[60%]">
            <CurriculumBuilder course={course} courseId={courseId} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== COURSE SETTINGS FORM ====================

function CourseSettingsForm({
  course,
  courseId,
}: {
  course: CourseEditDto;
  courseId: string;
}) {
  const updateMutation = useUpdateCourse();

  const form = useForm<CourseSettingsFormData>({
    resolver: zodResolver(courseSettingsSchema),
    defaultValues: {
      title: course.title,
      shortDescription: course.shortDescription || '',
      description: course.description || '',
      price: course.price,
      level: course.level,
      category: course.category || '',
      language: course.language || 'tr',
      coverImageUrl: course.coverImageUrl || '',
      coverImagePosition: course.coverImagePosition || 'center center',
      whatYouWillLearn: (course.whatYouWillLearn || []).map((v) => ({ value: v })),
      requirements: (course.requirements || []).map((v) => ({ value: v })),
      targetAudience: (course.targetAudience || []).map((v) => ({ value: v })),
    },
  });

  const watchCoverImage = form.watch('coverImageUrl');

  const {
    fields: learnFields,
    append: appendLearn,
    remove: removeLearn,
  } = useFieldArray({ control: form.control, name: 'whatYouWillLearn' });

  const {
    fields: reqFields,
    append: appendReq,
    remove: removeReq,
  } = useFieldArray({ control: form.control, name: 'requirements' });

  const {
    fields: audienceFields,
    append: appendAudience,
    remove: removeAudience,
  } = useFieldArray({ control: form.control, name: 'targetAudience' });

  const onSubmit = async (data: CourseSettingsFormData) => {
    try {
      await updateMutation.mutateAsync({
        id: courseId,
        data: {
          title: data.title,
          shortDescription: data.shortDescription || undefined,
          description: data.description || undefined,
          price: data.price,
          level: data.level || undefined,
          category: data.category || undefined,
          language: data.language || 'tr',
          coverImageUrl: data.coverImageUrl || undefined,
          coverImagePosition: data.coverImagePosition || undefined,
          whatYouWillLearn: data.whatYouWillLearn.map((i) => i.value).filter(Boolean),
          requirements: data.requirements.map((i) => i.value).filter(Boolean),
          targetAudience: data.targetAudience.map((i) => i.value).filter(Boolean),
        },
      });
      toast.success('Kurs bilgileri kaydedildi');
    } catch {
      toast.error('Kaydetme sırasında hata oluştu');
    }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-lg font-semibold mb-4">Kurs Ayarları</h2>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Kurs Adı <span className="text-red-500">*</span>
            </label>
            <Input {...form.register('title')} />
            {form.formState.errors.title && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Kısa Açıklama</label>
            <Input {...form.register('shortDescription')} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Detaylı Açıklama</label>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
              {...form.register('description')}
            />
          </div>

          {/* Price & Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Fiyat (TRY)</label>
              <Input type="number" min={0} step="0.01" {...form.register('price')} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Seviye</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 h-10 bg-white"
                {...form.register('level')}
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category & Language */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Kategori</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 h-10 bg-white"
                {...form.register('category')}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dil</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 h-10 bg-white"
                {...form.register('language')}
              >
                <option value="tr">Türkçe</option>
                <option value="en">İngilizce</option>
              </select>
            </div>
          </div>

          {/* Cover Image Upload */}
          <CoverImageUploader
            courseId={courseId}
            currentUrl={watchCoverImage || ''}
            currentPosition={form.watch('coverImagePosition') || 'center center'}
            onUploaded={(url) => form.setValue('coverImageUrl', url)}
            onPositionChange={(pos) => form.setValue('coverImagePosition', pos)}
          />

          {/* WhatYouWillLearn */}
          <DynamicStringList
            label="Neler Öğreneceksiniz"
            fields={learnFields}
            register={(index) => form.register(`whatYouWillLearn.${index}.value`)}
            onAppend={() => appendLearn({ value: '' })}
            onRemove={removeLearn}
            maxItems={10}
            placeholder="örn: React Hook kullanımı"
          />

          {/* Requirements */}
          <DynamicStringList
            label="Gereksinimler"
            fields={reqFields}
            register={(index) => form.register(`requirements.${index}.value`)}
            onAppend={() => appendReq({ value: '' })}
            onRemove={removeReq}
            maxItems={10}
            placeholder="örn: Temel JavaScript bilgisi"
          />

          {/* Target Audience */}
          <DynamicStringList
            label="Hedef Kitle"
            fields={audienceFields}
            register={(index) => form.register(`targetAudience.${index}.value`)}
            onAppend={() => appendAudience({ value: '' })}
            onRemove={removeAudience}
            maxItems={5}
            placeholder="örn: Web geliştirmeye yeni başlayanlar"
          />

          {/* Save Button */}
          <Button type="submit" className="w-full gap-2" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Kaydet
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ==================== DYNAMIC STRING LIST ====================

function DynamicStringList({
  label,
  fields,
  register,
  onAppend,
  onRemove,
  maxItems,
  placeholder,
}: {
  label: string;
  fields: { id: string }[];
  register: (index: number) => ReturnType<ReturnType<typeof useForm>['register']>;
  onAppend: () => void;
  onRemove: (index: number) => void;
  maxItems: number;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <Input placeholder={placeholder} {...register(index)} className="flex-1" />
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-red-400 hover:text-red-600 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      {fields.length < maxItems && (
        <button
          type="button"
          onClick={onAppend}
          className="mt-2 text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Ekle
        </button>
      )}
      <p className="text-xs text-gray-400 mt-1">
        {fields.length}/{maxItems}
      </p>
    </div>
  );
}

// ==================== COVER IMAGE UPLOADER ====================

function CoverImageUploader({
  courseId,
  currentUrl,
  currentPosition,
  onUploaded,
  onPositionChange,
}: {
  courseId: string;
  currentUrl: string;
  currentPosition: string;
  onUploaded: (url: string) => void;
  onPositionChange: (position: string) => void;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(currentUrl || '');
  const [objectPosition, setObjectPosition] = useState(currentPosition || 'center center');
  const [isDragging, setIsDragging] = useState(false);
  const [isPositioning, setIsPositioning] = useState(false);

  // Sync with form value
  useEffect(() => {
    if (currentUrl && currentUrl !== previewUrl && !uploading) {
      setPreviewUrl(currentUrl);
    }
  }, [currentUrl]);

  // Sync position with form
  useEffect(() => {
    if (currentPosition && currentPosition !== objectPosition) {
      setObjectPosition(currentPosition);
    }
  }, [currentPosition]);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir görsel dosyası seçin');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dosya boyutu en fazla 10 MB olabilir');
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploading(true);
    setProgress(0);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5072/api';
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      const formData = new FormData();
      formData.append('file', file);

      const result = await new Promise<{ coverImageUrl: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        });
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error('Yanıt işlenemedi'));
            }
          } else {
            reject(new Error(`Yükleme başarısız: ${xhr.status}`));
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Yükleme başarısız')));
        xhr.open('POST', `${API_URL}/courses/${courseId}/upload-cover`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      setPreviewUrl(result.coverImageUrl);
      onUploaded(result.coverImageUrl);
      queryClient.invalidateQueries({ queryKey: ['course', 'edit', courseId] });
      toast.success('Kapak görseli yüklendi!');
    } catch (error) {
      console.error('Cover upload error:', error);
      toast.error('Kapak görseli yüklenirken hata oluştu');
      // Revert to original
      setPreviewUrl(currentUrl || '');
    } finally {
      setUploading(false);
      setProgress(0);
      URL.revokeObjectURL(localPreview);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  // Position control: Click on image to set object-position
  const handlePositionClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPositioning || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    const newPos = `${x}% ${y}%`;
    setObjectPosition(newPos);
    onPositionChange(newPos);
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">Kapak Görseli</label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Preview / Upload area */}
      {previewUrl && !uploading ? (
        <div className="space-y-2">
          {/* Image preview with object-position */}
          <div
            ref={containerRef}
            onClick={handlePositionClick}
            className={`relative rounded-lg overflow-hidden border-2 h-44 group ${
              isPositioning
                ? 'cursor-crosshair border-blue-400 ring-2 ring-blue-200'
                : 'border-gray-200'
            }`}
          >
            <img
              src={previewUrl}
              alt="Kapak önizleme"
              className="w-full h-full object-cover transition-all duration-200"
              style={{ objectPosition }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '';
                setPreviewUrl('');
              }}
            />

            {/* Overlay actions */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              {!isPositioning && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 shadow-sm flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Değiştir
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPositioning(true);
                    }}
                    className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 shadow-sm flex items-center gap-1.5"
                  >
                    <Move className="w-3.5 h-3.5" />
                    Konumla
                  </button>
                </>
              )}
            </div>

            {/* Positioning mode indicator */}
            {isPositioning && (
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-md font-medium">
                  Odak noktasını seçmek için tıklayın
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPositioning(false);
                  }}
                  className="px-2 py-1 bg-white text-gray-700 text-xs rounded-md font-medium hover:bg-gray-100 shadow-sm"
                >
                  Tamam
                </button>
              </div>
            )}

            {/* Position indicator dot */}
            {isPositioning && (
              <div
                className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-500 shadow-lg pointer-events-none"
                style={{
                  left: objectPosition.split(' ')[0],
                  top: objectPosition.split(' ')[1],
                }}
              />
            )}
          </div>

          {/* Position presets */}
          {isPositioning && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-gray-500 mr-1">Hızlı:</span>
              {[
                { label: 'Üst', pos: 'center top' },
                { label: 'Orta', pos: 'center center' },
                { label: 'Alt', pos: 'center bottom' },
                { label: 'Sol', pos: 'left center' },
                { label: 'Sağ', pos: 'right center' },
              ].map((preset) => (
                <button
                  key={preset.pos}
                  type="button"
                  onClick={() => { setObjectPosition(preset.pos); onPositionChange(preset.pos); }}
                  className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                    objectPosition === preset.pos
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : uploading ? (
        /* Upload progress */
        <div className="rounded-lg border-2 border-gray-200 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
            <span className="text-gray-700">Yükleniyor...</span>
            <span className="text-gray-400 ml-auto">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        /* Empty state - upload trigger */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
        >
          <Image className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">
            Kapak görseli yükleyin
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Sürükle-bırak veya tıklayarak seçin · Max 10 MB · JPG, PNG, WebP
          </p>
        </div>
      )}
    </div>
  );
}

// ==================== CURRICULUM BUILDER ====================

function CurriculumBuilder({
  course,
  courseId,
}: {
  course: CourseEditDto;
  courseId: string;
}) {
  const confirm = useConfirm();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(course.sections.map((s) => s.id))
  );
  const [addingSectionTitle, setAddingSectionTitle] = useState('');
  const [showAddSection, setShowAddSection] = useState(false);

  // Lecture modals
  const [addLectureModal, setAddLectureModal] = useState<{ sectionId: string } | null>(null);
  const [editLectureModal, setEditLectureModal] = useState<{
    sectionId: string;
    lecture: CourseLectureEditDto;
  } | null>(null);

  // Section mutations
  const createSectionMut = useCreateSection();
  const updateSectionMut = useUpdateSection();
  const deleteSectionMut = useDeleteSection();

  // Lecture mutations
  const createLectureMut = useCreateLecture();
  const updateLectureMut = useUpdateLecture();
  const deleteLectureMut = useDeleteLecture();

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  // ===== Section Actions =====

  const handleCreateSection = async () => {
    if (!addingSectionTitle.trim()) return;
    try {
      await createSectionMut.mutateAsync({ courseId, title: addingSectionTitle.trim() });
      toast.success('Bölüm eklendi');
      setAddingSectionTitle('');
      setShowAddSection(false);
    } catch {
      toast.error('Bölüm eklenirken hata oluştu');
    }
  };

  const handleUpdateSectionTitle = async (sectionId: string, newTitle: string) => {
    try {
      await updateSectionMut.mutateAsync({ courseId, sectionId, title: newTitle });
      toast.success('Bölüm adı güncellendi');
    } catch {
      toast.error('Bölüm adı güncellenemedi');
    }
  };

  const handleDeleteSection = (section: CourseSectionEditDto) => {
    confirm({
      title: 'Bölümü Sil',
      description: `"${section.title}" bölümü ve içindeki tüm dersler silinecek. Bu işlem geri alınamaz.`,
      variant: 'danger',
      confirmText: 'Sil',
      onConfirm: async () => {
        try {
          await deleteSectionMut.mutateAsync({ courseId, sectionId: section.id });
          toast.success('Bölüm silindi');
        } catch {
          toast.error('Bölüm silinirken hata oluştu');
        }
      },
    });
  };

  // ===== Lecture Actions =====

  const handleDeleteLecture = (sectionId: string, lecture: CourseLectureEditDto) => {
    confirm({
      title: 'Dersi Sil',
      description: `"${lecture.title}" dersini silmek istediğinize emin misiniz?`,
      variant: 'danger',
      confirmText: 'Sil',
      onConfirm: async () => {
        try {
          await deleteLectureMut.mutateAsync({ courseId, sectionId, lectureId: lecture.id });
          toast.success('Ders silindi');
        } catch {
          toast.error('Ders silinirken hata oluştu');
        }
      },
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Müfredat</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddSection(true)}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          Yeni Bölüm Ekle
        </Button>
      </div>

      {/* Add Section Input */}
      {showAddSection && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Bölüm adı girin..."
                value={addingSectionTitle}
                onChange={(e) => setAddingSectionTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateSection();
                  }
                }}
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleCreateSection}
                disabled={!addingSectionTitle.trim() || createSectionMut.isPending}
              >
                {createSectionMut.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Ekle'
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAddSection(false);
                  setAddingSectionTitle('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sections */}
      {course.sections.length === 0 && !showAddSection ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">Henüz bölüm eklenmedi</p>
            <p className="text-sm text-gray-400 mb-4">
              Müfredat oluşturmak için bölüm ekleyin
            </p>
            <Button variant="outline" onClick={() => setShowAddSection(true)} className="gap-1">
              <Plus className="w-4 h-4" />
              İlk Bölümü Ekle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {course.sections
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                isExpanded={expandedSections.has(section.id)}
                onToggle={() => toggleSection(section.id)}
                onUpdateTitle={(title) => handleUpdateSectionTitle(section.id, title)}
                onDelete={() => handleDeleteSection(section)}
                onAddLecture={() => setAddLectureModal({ sectionId: section.id })}
                onEditLecture={(lecture) =>
                  setEditLectureModal({ sectionId: section.id, lecture })
                }
                onDeleteLecture={(lecture) => handleDeleteLecture(section.id, lecture)}
                courseId={courseId}
                isUpdating={updateSectionMut.isPending}
              />
            ))}
        </div>
      )}

      {/* Add Lecture Modal */}
      {addLectureModal && (
        <AddLectureModal
          courseId={courseId}
          sectionId={addLectureModal.sectionId}
          onClose={() => setAddLectureModal(null)}
        />
      )}

      {/* Edit Lecture Modal */}
      {editLectureModal && (
        <EditLectureModal
          courseId={courseId}
          sectionId={editLectureModal.sectionId}
          lecture={editLectureModal.lecture}
          onClose={() => setEditLectureModal(null)}
        />
      )}
    </div>
  );
}

// ==================== SECTION CARD ====================

function SectionCard({
  section,
  isExpanded,
  onToggle,
  onUpdateTitle,
  onDelete,
  onAddLecture,
  onEditLecture,
  onDeleteLecture,
  courseId,
  isUpdating,
}: {
  section: CourseSectionEditDto;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateTitle: (title: string) => void;
  onDelete: () => void;
  onAddLecture: () => void;
  onEditLecture: (lecture: CourseLectureEditDto) => void;
  onDeleteLecture: (lecture: CourseLectureEditDto) => void;
  courseId: string;
  isUpdating: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle.trim() !== section.title) {
      onUpdateTitle(editTitle.trim());
    }
    setIsEditing(false);
  };

  const sectionDuration = section.lectures.reduce((sum, l) => sum + l.durationSec, 0);

  return (
    <Card>
      {/* Section Header */}
      <div className="flex items-center gap-2 p-4 bg-gray-50 border-b">
        <div className="text-gray-400">
          <GripVertical className="w-4 h-4" />
        </div>
        <button onClick={onToggle} className="text-gray-600 hover:text-gray-800">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>

        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setEditTitle(section.title);
                }
              }}
              className="flex-1 h-8"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={handleSaveTitle} disabled={isUpdating}>
              <Save className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsEditing(false);
                setEditTitle(section.title);
              }}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-2">
            <h3 className="font-semibold text-sm">{section.title}</h3>
            <span className="text-xs text-gray-400">
              {section.lectures.length} ders - {formatDuration(sectionDuration)}
            </span>
          </div>
        )}

        {!isEditing && (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-7 w-7"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onDelete}
              className="h-7 w-7 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Lectures */}
      {isExpanded && (
        <CardContent className="p-0">
          {section.lectures.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">
              Bu bölümde henüz ders yok
            </div>
          ) : (
            <div className="divide-y">
              {section.lectures
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((lecture) => (
                  <LectureRow
                    key={lecture.id}
                    lecture={lecture}
                    sectionId={section.id}
                    courseId={courseId}
                    onEdit={() => onEditLecture(lecture)}
                    onDelete={() => onDeleteLecture(lecture)}
                  />
                ))}
            </div>
          )}

          {/* Add Lecture Button */}
          <div className="p-3 border-t">
            <button
              onClick={onAddLecture}
              className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Ders Ekle
            </button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ==================== LECTURE ROW ====================

function LectureRow({
  lecture,
  sectionId,
  courseId,
  onEdit,
  onDelete,
}: {
  lecture: CourseLectureEditDto;
  sectionId: string;
  courseId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        {/* Type Icon */}
        <div className="flex-shrink-0">
          {lecture.type === LectureType.Video ? (
            <Video className="w-4 h-4 text-blue-500" />
          ) : (
            <FileText className="w-4 h-4 text-green-500" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{lecture.title}</span>
            {lecture.isPreview && (
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">
                <Eye className="w-3 h-3 mr-0.5" />
                Önizleme
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400">
              {lecture.type === LectureType.Video ? 'Video' : 'Metin'}
            </span>
            {lecture.durationSec > 0 && (
              <span className="text-xs text-gray-400">
                - {formatDuration(lecture.durationSec)}
              </span>
            )}
            {lecture.type === LectureType.Video && lecture.videoKey && (
              <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">
                <CheckCircle className="w-3 h-3 mr-0.5" />
                Yüklendi
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {lecture.type === LectureType.Video && !lecture.videoKey && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowUpload(!showUpload)}
              className="gap-1 h-7 text-xs"
            >
              <Upload className="w-3 h-3" />
              Video Yükle
            </Button>
          )}
          {lecture.type === LectureType.Video && lecture.videoKey && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowUpload(!showUpload)}
              className="gap-1 h-7 text-xs"
            >
              <Upload className="w-3 h-3" />
              Değiştir
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={onEdit} className="h-7 w-7">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDelete}
            className="h-7 w-7 text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Video Upload Widget */}
      {showUpload && lecture.type === LectureType.Video && (
        <div className="mt-3 ml-7">
          <VideoUploadWidget
            lectureId={lecture.id}
            courseId={courseId}
            onComplete={() => setShowUpload(false)}
          />
        </div>
      )}
    </div>
  );
}

// ==================== VIDEO UPLOAD WIDGET ====================

function VideoUploadWidget({
  lectureId,
  courseId,
  onComplete,
}: {
  lectureId: string;
  courseId: string;
  onComplete: () => void;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');

  const getVideoDuration = useCallback((file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.round(video.duration));
      };
      video.onerror = () => {
        resolve(0);
      };
      video.src = URL.createObjectURL(file);
    });
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploading(true);
    setProgress(0);

    try {
      // Step 1: Extract video duration first (while uploading)
      const durationPromise = getVideoDuration(file);

      // Step 2: Upload via backend proxy (avoids R2 CORS issues)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5072/api';
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      const formData = new FormData();
      formData.append('file', file);

      const videoKey = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            setProgress(pct);
          }
        });
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const resp = JSON.parse(xhr.responseText);
              resolve(resp.videoKey || resp.fileKey);
            } catch {
              reject(new Error('Yanıt işlenemedi'));
            }
          } else {
            reject(new Error(`Yükleme başarısız: ${xhr.status}`));
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Yükleme başarısız')));
        xhr.open('POST', `${API_URL}/lectures/${lectureId}/upload-video`);
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.send(formData);
      });

      // Step 3: Get duration
      const durationSec = await durationPromise;

      // Step 4: Confirm upload with video key + duration
      await coursesApi.confirmVideoUpload(lectureId, videoKey, durationSec);

      // Step 5: Invalidate query
      queryClient.invalidateQueries({ queryKey: ['course', 'edit', courseId] });

      toast.success('Video başarıyla yüklendi!');
      onComplete();
    } catch (error) {
      console.error('Video upload error:', error);
      toast.error('Video yüklenirken hata oluştu');
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border rounded-lg p-3 bg-white">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {uploading ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
            <span className="truncate text-gray-700">{fileName}</span>
            <span className="text-gray-400 flex-shrink-0">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors text-sm text-gray-600"
        >
          <Upload className="w-4 h-4" />
          Video dosyası seçin
        </button>
      )}
    </div>
  );
}

// ==================== ADD LECTURE MODAL ====================

const addLectureSchema = z.object({
  title: z.string().min(2, 'Ders adı en az 2 karakter').max(200),
  type: z.string().default(LectureType.Video),
  isPreview: z.boolean().default(false),
});

type AddLectureFormData = z.infer<typeof addLectureSchema>;

function AddLectureModal({
  courseId,
  sectionId,
  onClose,
}: {
  courseId: string;
  sectionId: string;
  onClose: () => void;
}) {
  const createLectureMut = useCreateLecture();

  const form = useForm<AddLectureFormData>({
    resolver: zodResolver(addLectureSchema),
    defaultValues: {
      title: '',
      type: LectureType.Video,
      isPreview: false,
    },
  });

  const onSubmit = async (data: AddLectureFormData) => {
    try {
      await createLectureMut.mutateAsync({
        courseId,
        sectionId,
        data: {
          title: data.title,
          type: data.type,
          isPreview: data.isPreview,
        },
      });
      toast.success('Ders eklendi');
      onClose();
    } catch {
      toast.error('Ders eklenirken hata oluştu');
    }
  };

  return (
    <Modal open onClose={onClose} title="Yeni Ders Ekle" description="Derse ait temel bilgileri girin.">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Ders Adı <span className="text-red-500">*</span>
          </label>
          <Input placeholder="örn: React Giriş" {...form.register('title')} autoFocus />
          {form.formState.errors.title && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
          )}
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Ders Tipi</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={LectureType.Video}
                {...form.register('type')}
                className="text-primary-600"
              />
              <Video className="w-4 h-4 text-blue-500" />
              <span className="text-sm">Video</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={LectureType.Text}
                {...form.register('type')}
                className="text-primary-600"
              />
              <FileText className="w-4 h-4 text-green-500" />
              <span className="text-sm">Metin</span>
            </label>
          </div>
        </div>

        {/* isPreview */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...form.register('isPreview')}
              className="rounded border-gray-300"
            />
            <Eye className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Ücretsiz önizleme olarak yayınla</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" disabled={createLectureMut.isPending}>
            {createLectureMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Ekle
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ==================== EDIT LECTURE MODAL ====================

const editLectureSchema = z.object({
  title: z.string().min(2, 'Ders adı en az 2 karakter').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  isPreview: z.boolean().default(false),
  textContent: z.string().max(50000).optional().or(z.literal('')),
});

type EditLectureFormData = z.infer<typeof editLectureSchema>;

function EditLectureModal({
  courseId,
  sectionId,
  lecture,
  onClose,
}: {
  courseId: string;
  sectionId: string;
  lecture: CourseLectureEditDto;
  onClose: () => void;
}) {
  const updateLectureMut = useUpdateLecture();

  const form = useForm<EditLectureFormData>({
    resolver: zodResolver(editLectureSchema),
    defaultValues: {
      title: lecture.title,
      description: lecture.description || '',
      isPreview: lecture.isPreview,
      textContent: lecture.textContent || '',
    },
  });

  const onSubmit = async (data: EditLectureFormData) => {
    try {
      await updateLectureMut.mutateAsync({
        courseId,
        sectionId,
        lectureId: lecture.id,
        data: {
          title: data.title,
          description: data.description || undefined,
          isPreview: data.isPreview,
          textContent: data.textContent || undefined,
        },
      });
      toast.success('Ders güncellendi');
      onClose();
    } catch {
      toast.error('Ders güncellenirken hata oluştu');
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Dersi Düzenle"
      description={`"${lecture.title}" dersini düzenleyin`}
      className="max-h-[70vh] overflow-y-auto"
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Ders Adı <span className="text-red-500">*</span>
          </label>
          <Input {...form.register('title')} />
          {form.formState.errors.title && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Açıklama</label>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
            placeholder="Ders hakkında kısa bir açıklama"
            {...form.register('description')}
          />
        </div>

        {/* Text Content (for Text type lectures) */}
        {lecture.type === LectureType.Text && (
          <div>
            <label className="block text-sm font-medium mb-1">Metin İçeriği</label>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[200px] font-mono"
              placeholder="Ders metin içeriğini buraya yazın..."
              {...form.register('textContent')}
            />
          </div>
        )}

        {/* isPreview */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...form.register('isPreview')}
              className="rounded border-gray-300"
            />
            <Eye className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Ücretsiz önizleme olarak yayınla</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" disabled={updateLectureMut.isPending}>
            {updateLectureMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Kaydet
          </Button>
        </div>
      </form>
    </Modal>
  );
}
