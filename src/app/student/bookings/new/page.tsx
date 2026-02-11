'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { useMentor } from '../../../../lib/hooks/use-mentors';
import { useCreateBooking } from '../../../../lib/hooks/use-bookings';
import { paymentsApi } from '../../../../lib/api/payments';
import { useAuthStore } from '../../../../lib/stores/auth-store';
import { formatCurrency } from '../../../../lib/utils/format';
import { toast } from 'sonner';
import { IyzicoCheckoutForm } from '../../../../components/payment/IyzicoCheckoutForm';

const bookingSchema = z.object({
  startAt: z.string().min(1, 'Tarih ve saat seçin'),
  notes: z.string().max(500).optional(),
});

type BookingForm = z.infer<typeof bookingSchema>;

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mentorId = searchParams.get('mentorId') || '';
  const offeringId = searchParams.get('offeringId') || '';

  const user = useAuthStore((state) => state.user);
  const { data: mentor, isLoading: isMentorLoading } = useMentor(mentorId);
  const createBooking = useCreateBooking();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedOffering, setSelectedOffering] = useState<any>(null);
  
  // ✅ Checkout Form State
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [checkoutFormHtml, setCheckoutFormHtml] = useState<string>('');

  useEffect(() => {
    if (mentor?.offerings) {
      console.log('🔍 Debug - All offerings:', mentor.offerings);
      console.log('🔍 Debug - Looking for offeringId:', offeringId);
      
      const found = mentor.offerings.find((o) => o.id === offeringId);
      console.log('🔍 Debug - Found offering:', found);
      
      if (!found && mentor.offerings.length > 0) {
        console.warn('⚠️ offeringId ile eşleşme yok, ilk offering kullanılıyor');
        setSelectedOffering(mentor.offerings[0]);
      } else {
        setSelectedOffering(found);
      }
    }
  }, [mentor, offeringId]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
  });

  const selectedTime = watch('startAt');

  const onSubmit = async (data: BookingForm) => {
    if (!selectedOffering) {
      toast.error('Hizmet bilgisi bulunamadı');
      return;
    }

    if (!selectedOffering.durationMin || selectedOffering.durationMin === 0) {
      toast.error('Süre bilgisi eksik');
      return;
    }

    if (!user) {
      toast.error('Kullanıcı bilgisi bulunamadı');
      return;
    }

    try {
      setIsProcessing(true);

      console.log('✅ Creating booking...');

      // 1. Create booking
      const bookingResult = await createBooking.mutateAsync({
        mentorUserId: mentorId,
        offeringId: selectedOffering.id,
        startAt: data.startAt,
        durationMin: selectedOffering.durationMin,
        notes: data.notes,
      });

      console.log('✅ Booking created:', bookingResult);

      // 2. Create order and initialize payment
      const orderResult = await paymentsApi.createOrder({
        type: 'Booking',
        resourceId: bookingResult.bookingId,
        buyerName: user.displayName?.split(' ')[0] || user.email.split('@')[0],
        buyerSurname: user.displayName?.split(' ').slice(1).join(' ') || 'User',
        buyerPhone: user.phone || '5555555555',
      });

      console.log('✅ Order created:', orderResult);

      // 3. Show checkout form or redirect
      if (orderResult.checkoutFormContent) {
        // ✅ Checkout form modal'ı aç
        setCheckoutFormHtml(orderResult.checkoutFormContent);
        setShowCheckoutForm(true);
        setIsProcessing(false);
      } else if (orderResult.paymentPageUrl) {
        // ✅ Fallback: External redirect
        console.log('📤 Redirecting to payment page...');
        window.location.href = orderResult.paymentPageUrl;
      } else {
        // Ödeme gerektirmeyen durum (örn: ücretsiz)
        toast.success('Rezervasyon oluşturuldu!');
        router.push(`/student/bookings/${bookingResult.bookingId}`);
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error('❌ Booking/Payment error:', error);
      toast.error(error.response?.data?.errors?.[0] || 'Bir hata oluştu');
      setIsProcessing(false);
    }
  };

  const handleCloseCheckoutForm = () => {
    setShowCheckoutForm(false);
    setCheckoutFormHtml('');
    toast.info('Ödeme iptal edildi');
  };

  if (isMentorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Mentor bulunamadı</h2>
          <Button onClick={() => router.back()}>Geri Dön</Button>
        </div>
      </div>
    );
  }

  if (!selectedOffering) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Hizmet bulunamadı</h2>
          <p className="text-gray-600 mb-4">Bu mentor için aktif bir hizmet bulunmuyor.</p>
          <Button onClick={() => router.back()}>Geri Dön</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Rezervasyon Oluştur</h1>
            <p className="text-gray-600">
              {mentor.displayName} ile {selectedOffering.title}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Randevu Detayları</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Time Slot Selection */}
                    <div>
                      <label className="text-sm font-medium mb-3 block">
                        Uygun Saatlerden Seçin
                      </label>
                      
                      {mentor.availableSlots && mentor.availableSlots.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {mentor.availableSlots.map((slot) => (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => setValue('startAt', slot.startAt)}
                              className={`p-3 text-sm border rounded-lg hover:bg-primary-50 hover:border-primary-600 transition ${
                                selectedTime === slot.startAt
                                  ? 'bg-primary-600 text-white border-primary-600'
                                  : 'bg-white'
                              }`}
                            >
                              <div className="font-medium">
                                {format(new Date(slot.startAt), 'dd MMM', { locale: tr })}
                              </div>
                              <div className="text-xs">
                                {format(new Date(slot.startAt), 'HH:mm', { locale: tr })}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>Şu anda uygun saat bulunmuyor</p>
                        </div>
                      )}
                      
                      {errors.startAt && (
                        <p className="text-sm text-red-600 mt-2">{errors.startAt.message}</p>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <label htmlFor="notes" className="text-sm font-medium mb-2 block">
                        Notlar (Opsiyonel)
                      </label>
                      <textarea
                        id="notes"
                        rows={4}
                        placeholder="Konuşmak istediğiniz konular, netleriniz, hedefleriniz..."
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        {...register('notes')}
                      />
                      {errors.notes && (
                        <p className="text-sm text-red-600 mt-1">{errors.notes.message}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg" 
                      disabled={isProcessing || !selectedTime}
                    >
                      {isProcessing ? 'İşleniyor...' : 'Ödemeye Geç'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Özet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600">Hizmet</div>
                    <div className="font-medium">{selectedOffering.title}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600">Süre</div>
                    <div className="font-medium">{selectedOffering.durationMin} dakika</div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Hizmet bedeli</span>
                      <span className="font-medium">{formatCurrency(selectedOffering.price)}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Platform hizmet bedeli</span>
                      <span className="font-medium">
                        {formatCurrency(selectedOffering.price * 0.07)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="font-semibold">Toplam</span>
                      <span className="text-xl font-bold text-primary-600">
                        {formatCurrency(selectedOffering.price * 1.07)}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 pt-4 border-t">
                    <p className="mb-2">
                      📅 Ders başlangıcından 24 saat önce iptal ederseniz %100 iade alırsınız.
                    </p>
                    <p>
                      🔒 Ödemeniz güvenli bir şekilde saklanır ve ders tamamlandıktan sonra mentöre aktarılır.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Checkout Form Modal */}
      {showCheckoutForm && checkoutFormHtml && (
        <IyzicoCheckoutForm
          checkoutFormContent={checkoutFormHtml}
          onClose={handleCloseCheckoutForm}
        />
      )}
    </>
  );
}