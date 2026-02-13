'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Upload, User, GraduationCap, ExternalLink, FileText, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { mentorsApi } from '@/lib/api/mentors';
import type { MentorVerification } from '@/lib/types/mentor';

const profileSchema = z.object({
  university: z.string().min(2, 'Üniversite adı gerekli'),
  department: z.string().min(2, 'Bölüm gerekli'),
  graduationYear: z.union([z.number(), z.string()]).optional().transform((v) => {
    if (v === undefined || v === null || v === '') return undefined;
    return typeof v === 'string' ? Number(v) : v;
  }),
  bio: z.string().min(50, 'En az 50 karakter yazın').max(2000),
  headline: z.string().max(300).optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

type StepKey = 'profile' | 'verification';

const steps = [
  { id: 1, key: 'profile' as const, name: 'Profil Bilgileri', icon: User },
  { id: 2, key: 'verification' as const, name: 'Doğrulama (Opsiyonel)', icon: GraduationCap },
];

function normalizeStep(v: string | null): StepKey {
  if (v === 'profile' || v === 'verification') return v;
  return 'profile';
}

function stepToId(step: StepKey): number {
  const found = steps.find((s) => s.key === step);
  return found?.id ?? 1;
}

function idToStep(id: number): StepKey {
  const found = steps.find((s) => s.id === id);
  return found?.key ?? 'profile';
}

export default function MentorOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const stepFromUrl = useMemo(() => normalizeStep(searchParams.get('step')), [searchParams]);
  const [currentStep, setCurrentStep] = useState<number>(stepToId(stepFromUrl));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [hasProfile, setHasProfile] = useState<boolean>(false);
  const [isPrefillLoading, setIsPrefillLoading] = useState<boolean>(true);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // ✅ File state
  const [studentCardFile, setStudentCardFile] = useState<File | null>(null);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  
  // ✅ Mevcut verifications
  const [existingVerifications, setExistingVerifications] = useState<MentorVerification[]>([]);
  
  // ✅ Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    verificationId: string | null;
    isDeleting: boolean;
  }>({
    open: false,
    verificationId: null,
    isDeleting: false,
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    setCurrentStep(stepToId(stepFromUrl));
  }, [stepFromUrl]);

  useEffect(() => {
    (async () => {
      const completed = new Set<number>();
      
      try {
        const p = await mentorsApi.getMyProfile();
        setHasProfile(true);
        profileForm.reset({
          university: p.university ?? '',
          department: p.department ?? '',
          graduationYear: p.graduationYear ?? undefined,
          headline: p.headline ?? '',
          bio: p.bio ?? '',
        });
        completed.add(1);
        
        // ✅ Mevcut verifications'ı set et
        if (p.verifications && p.verifications.length > 0) {
          setExistingVerifications(p.verifications);
        }
      } catch {
        setHasProfile(false);
      }

      setCompletedSteps(completed);
      setIsPrefillLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goStep = (step: StepKey) => {
    router.replace(`/auth/onboarding/mentor?step=${step}`);
  };

  const handleStepClick = (stepId: number) => {
    if (completedSteps.has(stepId) || stepId === 1) {
      const stepKey = idToStep(stepId);
      goStep(stepKey);
    }
  };

  const onProfileSubmit = async (data: ProfileForm) => {
    try {
      setIsSubmitting(true);

      const payload = {
        university: data.university,
        department: data.department,
        bio: data.bio,
        graduationYear: data.graduationYear,
        headline: data.headline,
      };

      if (hasProfile) {
        await mentorsApi.updateProfile(payload);
        toast.success('Profil bilgileri güncellendi');
      } else {
        await mentorsApi.createProfile(payload);
        setHasProfile(true);
        toast.success('Profil bilgileri kaydedildi');
      }

      setCompletedSteps(prev => new Set([...prev, 1]));
      goStep('verification');
    } catch (error: any) {
      toast.error(error?.response?.data?.errors?.[0] || 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);

      if (!studentCardFile && !transcriptFile) {
        toast.warning('Belge seçmediniz. Dashboard\'a yönlendiriliyorsunuz...');
        setTimeout(() => {
          router.push('/mentor/dashboard');
        }, 1000);
        return;
      }

      // ✅ Dosyaları SIRA İLE yükle (paralel değil)
      const results = [];
      
      if (studentCardFile) {
        try {
          const result = await mentorsApi.submitVerification('University', studentCardFile);
          results.push({ type: 'University', success: true, result });
        } catch (err) {
          results.push({ type: 'University', success: false, error: err });
        }
      }
      
      if (transcriptFile) {
        try {
          const result = await mentorsApi.submitVerification('Ranking', transcriptFile);
          results.push({ type: 'Ranking', success: true, result });
        } catch (err) {
          results.push({ type: 'Ranking', success: false, error: err });
        }
      }

      // ✅ Sonuçları kontrol et
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      if (successCount === 0) {
        toast.error('Hiçbir belge yüklenemedi. Lütfen tekrar deneyin.');
        return;
      }

      if (successCount < totalCount) {
        toast.warning(`${successCount}/${totalCount} belge yüklendi. Bazı belgeler yüklenemedi.`);
      } else {
        toast.success('Tüm belgeler başarıyla yüklendi! Admin onayı bekleniyor.');
      }

      setCompletedSteps(prev => new Set([...prev, 2]));
      
      // ✅ Tüm işlemler bittikten sonra yönlendir
      setTimeout(() => {
        router.push('/mentor/dashboard');
      }, 1500);
    } catch (error: any) {
      toast.error(error?.response?.data?.errors?.[0] || 'Belgeler yüklenirken hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const skipVerification = () => {
    toast.info('Doğrulama belgelerini istediğiniz zaman dashboard üzerinden yükleyebilirsiniz.');
    router.push('/mentor/dashboard');
  };

  // ✅ Belge silme modal'ını aç
  const openDeleteModal = (verificationId: string) => {
    setDeleteModal({
      open: true,
      verificationId,
      isDeleting: false,
    });
  };

  // ✅ Belge silme modal'ını kapat
  const closeDeleteModal = () => {
    if (deleteModal.isDeleting) return; // İşlem devam ediyorsa kapatma
    
    setDeleteModal({
      open: false,
      verificationId: null,
      isDeleting: false,
    });
  };

  // ✅ Belge silme onaylama
  const confirmDeleteVerification = async () => {
    if (!deleteModal.verificationId) return;

    try {
      setDeleteModal(prev => ({ ...prev, isDeleting: true }));

      await mentorsApi.deleteVerification(deleteModal.verificationId);
      
      // Local state'ten kaldır
      setExistingVerifications(prev => 
        prev.filter(v => v.id !== deleteModal.verificationId)
      );
      
      toast.success('Belge başarıyla silindi');
      closeDeleteModal();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error?.response?.data?.errors?.[0] || 'Belge silinirken hata oluştu');
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center relative">
                  <div
                    onClick={() => handleStepClick(step.id)}
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all',
                      completedSteps.has(step.id)
                        ? 'bg-primary-600 border-primary-600 text-white cursor-pointer hover:bg-primary-700'
                        : currentStep === step.id
                        ? 'bg-white border-primary-600 text-primary-600'
                        : 'bg-white border-gray-300 text-gray-400',
                      (completedSteps.has(step.id) || step.id === 1) && 'cursor-pointer'
                    )}
                  >
                    {completedSteps.has(step.id) ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <span className="text-xs mt-2 text-center">{step.name}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-4', 
                      completedSteps.has(step.id) ? 'bg-primary-600' : 'bg-gray-300'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && 'Profil Bilgileri'}
              {currentStep === 2 && 'Doğrulama Belgeleri (Opsiyonel)'}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Kendinizi ve eğitiminizi tanıtın'}
              {currentStep === 2 && 'İsteğe bağlı - Daha hızlı onay için belgelerinizi yükleyebilirsiniz'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isPrefillLoading && (
              <div className="py-8 text-center text-gray-500">
                Bilgileriniz yükleniyor...
              </div>
            )}

            {!isPrefillLoading && (
              <>
                {/* Step 1: Profile */}
                {currentStep === 1 && (
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    {/* ✅ Mevcut Doğrulama Belgeleri - Step 1'de göster */}
                    {existingVerifications.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm text-blue-900 mb-1">Yüklenmiş Doğrulama Belgeleri</h4>
                            <p className="text-xs text-blue-700 mb-3">
                              Belgelerinizi görüntüleyebilir veya 3. adımdan güncelleyebilirsiniz.
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {existingVerifications.map((v) => (
                            <div key={v.id} className="flex items-center justify-between p-3 bg-white rounded border border-blue-100">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  {v.type === 'University' ? '🎓' : '📊'}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {v.type === 'University' ? 'Öğrenci Belgesi' : 'Transkript/Sonuç Belgesi'}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    {v.status === 'Approved' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                        <Check className="w-3 h-3" />
                                        Onaylandı
                                      </span>
                                    )}
                                    {v.status === 'Pending' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                        <Clock className="w-3 h-3" />
                                        Onay Bekliyor
                                      </span>
                                    )}
                                    {v.status === 'Rejected' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                        ✕ Reddedildi
                                      </span>
                                    )}
                                    {v.reviewedAt && (
                                      <span className="text-xs text-gray-500">
                                        {new Date(v.reviewedAt).toLocaleDateString('tr-TR')}
                                      </span>
                                    )}
                                  </div>
                                  {v.notes && (
                                    <p className="text-xs text-gray-600 mt-1 italic">Not: {v.notes}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {v.documentUrl && (
                                  <a 
                                    href={v.documentUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                                  >
                                    Görüntüle <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between pt-3 border-t border-blue-200">
                          <p className="text-xs text-blue-700">
                            💡 Belgelerinizi güncellemek için 3. adıma gidebilirsiniz
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => goStep('verification')}
                            className="text-xs"
                          >
                            Belgeleri Güncelle
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Üniversite *</label>
                        <Input placeholder="Boğaziçi Üniversitesi" {...profileForm.register('university')} />
                        {profileForm.formState.errors.university && (
                          <p className="text-sm text-red-600 mt-1">{profileForm.formState.errors.university.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Bölüm *</label>
                        <Input placeholder="Bilgisayar Mühendisliği" {...profileForm.register('department')} />
                        {profileForm.formState.errors.department && (
                          <p className="text-sm text-red-600 mt-1">{profileForm.formState.errors.department.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Mezuniyet Yılı</label>
                      <Input
                        type="number"
                        placeholder="2024"
                        {...profileForm.register('graduationYear')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Başlık</label>
                      <Input placeholder="İlk 500 - TYT/AYT Matematik Koçluğu" {...profileForm.register('headline')} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Hakkımda *</label>
                      <textarea
                        className="w-full min-h-[160px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                        placeholder="Kendinizi tanıtın, deneyimlerinizi paylaşın, danışanlara nasıl yardımcı olabileceğinizi anlatın..."
                        {...profileForm.register('bio')}
                      />
                      {profileForm.formState.errors.bio && (
                        <p className="text-sm text-red-600 mt-1">{profileForm.formState.errors.bio.message}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Kaydediliyor...' : 'Kaydet ve Devam Et'}
                    </Button>
                  </form>
                )}

                {/* Step 2: Verification */}
                {currentStep === 2 && (
                  <form onSubmit={onVerificationSubmit} className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-blue-800">
                        <strong>Bilgi:</strong> Bu adım tamamen opsiyoneldir. Doğrulama belgelerini yüklemek, 
                        admin onayını hızlandırır ve öğrenci kabul edebilmeniz için gereklidir.
                      </p>
                    </div>

                    {/* ✅ Mevcut belgeler - Type'a göre göster */}
                    {existingVerifications.length > 0 && (
                      <div className="bg-gray-50 border rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-sm mb-3">Mevcut Belgeleriniz:</h4>
                        <div className="space-y-2">
                          {existingVerifications.map((v) => (
                            <div key={v.id} className="flex items-center justify-between p-3 bg-white rounded border">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-xl">
                                  {v.type === 'University' ? '🎓' : '📊'}
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium">
                                    {v.type === 'University' ? 'Öğrenci Belgesi' : 'Transkript/Sonuç'}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    {v.status === 'Approved' && (
                                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                                        ✓ Onaylandı
                                      </span>
                                    )}
                                    {v.status === 'Pending' && (
                                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
                                        ⏳ Onay Bekliyor
                                      </span>
                                    )}
                                    {v.status === 'Rejected' && (
                                      <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-medium">
                                        ✕ Reddedildi
                                      </span>
                                    )}
                                    {v.reviewedAt && (
                                      <span className="text-xs text-gray-500">
                                        {new Date(v.reviewedAt).toLocaleDateString('tr-TR')}
                                      </span>
                                    )}
                                  </div>
                                  {v.notes && (
                                    <p className="text-xs text-gray-600 mt-1 italic">
                                      <strong>Admin Notu:</strong> {v.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-3">
                                {v.documentUrl && (
                                  <a 
                                    href={v.documentUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    Görüntüle <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                                {/* ✅ Silme butonu - Sadece Pending/Rejected için */}
                                {(v.status === 'Pending' || v.status === 'Rejected') && (
                                  <button
                                    type="button"
                                    onClick={() => openDeleteModal(v.id)}
                                    className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1 px-2 py-1 hover:bg-red-50 rounded transition-colors"
                                    title="Belgeyi Sil"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Sil
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 mt-3 bg-yellow-50 p-2 rounded border border-yellow-200">
                          💡 <strong>Önemli:</strong> Aşağıdan yeni belge yüklerseniz, eski belgeler silinmez. 
                          Her ikisi de sisteme kaydedilir ve admin tarafından incelenebilir.
                          {existingVerifications.some(v => v.status === 'Pending' || v.status === 'Rejected') && (
                            <span className="block mt-1">
                              🗑️ Onaylanmamış belgeleri "Sil" butonu ile kaldırabilirsiniz.
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* ✅ University belgesini göster */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium">
                            Öğrenci Belgesi 
                            {existingVerifications.some(v => v.type === 'University') ? (
                              <span className="text-green-600 text-xs ml-2 font-semibold">✓ Yüklü</span>
                            ) : (
                              <span className="text-gray-500 text-xs ml-2">(opsiyonel)</span>
                            )}
                          </label>
                        </div>
                        <Input 
                          type="file" 
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setStudentCardFile(file || null);
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {existingVerifications.some(v => v.type === 'University') 
                            ? '📤 Yeni belge yükleyerek mevcut belgeyi güncelleyebilirsiniz'
                            : 'PDF veya resim formatında öğrenci belgenizi yükleyin'
                          }
                        </p>
                        {studentCardFile && (
                          <p className="text-xs text-green-600 mt-1 font-medium">✓ Seçildi: {studentCardFile.name}</p>
                        )}
                      </div>

                      {/* ✅ Ranking belgesini göster */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium">
                            Transkript / Sonuç Belgesi 
                            {existingVerifications.some(v => v.type === 'Ranking') ? (
                              <span className="text-green-600 text-xs ml-2 font-semibold">✓ Yüklü</span>
                            ) : (
                              <span className="text-gray-500 text-xs ml-2">(opsiyonel)</span>
                            )}
                          </label>
                        </div>
                        <Input 
                          type="file" 
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setTranscriptFile(file || null);
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {existingVerifications.some(v => v.type === 'Ranking') 
                            ? '📤 Yeni belge yükleyerek mevcut belgeyi güncelleyebilirsiniz'
                            : 'PDF veya resim formatında transkript/sonuç belgenizi yükleyin'
                          }
                        </p>
                        {transcriptFile && (
                          <p className="text-xs text-green-600 mt-1 font-medium">✓ Seçildi: {transcriptFile.name}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full" 
                        onClick={skipVerification} 
                        disabled={isSubmitting}
                      >
                        {existingVerifications.length > 0 ? 'Dashboard\'a Dön' : 'Atla - Dashboard\'a Git'}
                      </Button>
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Yükleniyor...' : existingVerifications.length > 0 ? 'Belgeleri Güncelle' : 'Belgeleri Yükle'}
                      </Button>
                    </div>
                  </form>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ✅ Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteModal.open}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteVerification}
        title="Belgeyi Sil"
        description="Bu belgeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Evet, Sil"
        cancelText="İptal"
        variant="danger"
        isLoading={deleteModal.isDeleting}
      />
    </div>
  );
}