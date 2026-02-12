'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Trash2, AlertCircle, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useMyAvailability, useCreateSlot, useDeleteSlot } from '@/lib/hooks/use-availability';
import { useAuthStore } from '@/lib/stores/auth-store';
import { formatDate, formatRelativeTime} from '@/lib/utils/format';
import { toast } from 'sonner';
import { mentorsApi } from '@/lib/api/mentors';

export default function AvailabilityPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // ✅ Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    slotId: string | null;
    isDeleting: boolean;
  }>({
    open: false,
    slotId: null,
    isDeleting: false,
  });
  
  // ✅ Verification-based approval kontrolü
  const [isApproved, setIsApproved] = useState(false);
  const [isCheckingApproval, setIsCheckingApproval] = useState(true);

  const { data: slots, isLoading, refetch } = useMyAvailability();
  const createSlot = useCreateSlot();
  const deleteSlot = useDeleteSlot();

  // ✅ Sayfa açılışında verification durumunu kontrol et
  useEffect(() => {
    (async () => {
      try {
        const profile = await mentorsApi.getMyProfile();
        setIsApproved(profile.isApprovedForBookings);
      } catch {
        setIsApproved(false);
      } finally {
        setIsCheckingApproval(false);
      }
    })();
  }, []);

  const handleCreateSlot = async () => {
    if (!startDate || !startTime || !endTime) {
      toast.error('Tüm alanları doldurun');
      return;
    }

    // Kullanıcının girdiği yerel saati, tarayıcı timezone offset'iyle ISO formatına çevir
    const localStart = new Date(`${startDate}T${startTime}:00`);
    const localEnd = new Date(`${startDate}T${endTime}:00`);
    const startAt = localStart.toISOString();
    const endAt = localEnd.toISOString();

    try {
      await createSlot.mutateAsync({ startAt, endAt });
      toast.success('Uygunluk eklendi');
      setStartDate('');
      setStartTime('');
      setEndTime('');
      
      // ✅ Liste'yi yenile
      await refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0] || 'Bir hata oluştu');
    }
  };

  // ✅ Delete modal'ını aç
  const openDeleteModal = (slotId: string) => {
    setDeleteModal({
      open: true,
      slotId,
      isDeleting: false,
    });
  };

  // ✅ Delete modal'ını kapat
  const closeDeleteModal = () => {
    if (deleteModal.isDeleting) return; // İşlem devam ediyorsa kapatma
    
    setDeleteModal({
      open: false,
      slotId: null,
      isDeleting: false,
    });
  };

  // ✅ Silme onaylama
  const confirmDeleteSlot = async () => {
    if (!deleteModal.slotId) return;

    try {
      setDeleteModal(prev => ({ ...prev, isDeleting: true }));

      await deleteSlot.mutateAsync(deleteModal.slotId);
      toast.success('Uygunluk silindi');
      
      // ✅ Liste'yi yenile
      await refetch();
      
      closeDeleteModal();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Silinemedi');
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // ✅ Loading state
  if (isCheckingApproval) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  // ✅ Onaysız mentor için erişim engelli ekran
  if (!isApproved) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <Lock className="w-6 h-6 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <CardTitle className="text-yellow-900 mb-2">Uygunluk Ayarları Kilitli</CardTitle>
                <CardDescription className="text-yellow-800">
                  Uygunluk saatleri ekleyebilmek için doğrulama belgelerinizin admin tarafından onaylanması gerekmektedir.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-yellow-200">
              <h4 className="font-semibold text-sm mb-2">Onay için yapmanız gerekenler:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>Profil bilgilerinizi tamamlayın</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>Doğrulama belgelerinizi yükleyin (öğrenci belgesi, transkript)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>Admin doğrulama onayını bekleyin</span>
                </li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={() => router.push('/mentor/dashboard')}>
                Dashboard'a Dön
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/auth/onboarding/mentor?step=verification')}
              >
                Belgeleri Yükle
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Onaylı mentor için normal sayfa
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Uygunluk Ayarları</h1>
        <p className="text-gray-600">Danışanlarınızın rezervasyon yapabileceği saatleri yönetin</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Add Slot Form */}
        <Card>
          <CardHeader>
            <CardTitle>Yeni Uygunluk Ekle</CardTitle>
            <CardDescription>
              Danışanların rezervasyon yapabileceği saatleri ekleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tarih</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Başlangıç</label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bitiş</label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleCreateSlot}
              className="w-full"
              disabled={createSlot.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              {createSlot.isPending ? 'Ekleniyor...' : 'Uygunluk Ekle'}
            </Button>
          </CardContent>
        </Card>

        {/* Slots List */}
        <Card>
          <CardHeader>
            <CardTitle>Mevcut Uygunluklar</CardTitle>
            <CardDescription>
              Eklediğiniz uygunluk saatleri
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            ) : slots && slots.length > 0 ? (
              <div className="space-y-2">
               {slots?.map((s) => (
  <div key={s.id} className="flex items-center justify-between border rounded p-3">
    <div>
      <div className="font-medium">
        {new Date(s.startAt).toLocaleString('tr-TR')} - {new Date(s.endAt).toLocaleTimeString('tr-TR')}
      </div>
      {s.isBooked ? (
        <span className="text-xs text-red-600">Dolu</span>
      ) : (
        <span className="text-xs text-green-600">Müsait</span>
      )}
    </div>
 <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      disabled={s.isBooked}
      onClick={() => openDeleteModal(s.id)}
      title={s.isBooked ? 'Dolu olan slot silinemez' : 'Sil'}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
  </div>
))}

              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Henüz uygunluk eklenmemiş</p>
                <p className="text-sm mt-1">Sol taraftan yeni uygunluk ekleyebilirsiniz</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ✅ Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteModal.open}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteSlot}
        title="Uygunluğu Sil"
        description="Bu uygunluk saatini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Evet, Sil"
        cancelText="İptal"
        variant="danger"
        isLoading={deleteModal.isDeleting}
      />
    </div>
  );
}