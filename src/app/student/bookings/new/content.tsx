'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, isSameDay, startOfMonth, endOfMonth, addMonths, parseISO, startOfDay, isBefore } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  ChevronLeft,
  Video,
  ArrowLeft,
  CreditCard,
  HelpCircle,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import { Badge } from '../../../../components/ui/badge';
import { useMentor } from '../../../../lib/hooks/use-mentors';
import { useMentorAvailability, useAvailableTimeSlots } from '../../../../lib/hooks/use-availability';
import { useCreateBooking } from '../../../../lib/hooks/use-bookings';
import { paymentsApi } from '../../../../lib/api/payments';
import { useAuthStore } from '../../../../lib/stores/auth-store';
import { formatCurrency } from '../../../../lib/utils/format';
import { toast } from 'sonner';
import { IyzicoCheckoutForm } from '../../../../components/payment/IyzicoCheckoutForm';
import { offeringsApi, type OfferingDto as EnrichedOfferingDto } from '../../../../lib/api/offerings';

// Dynamically import FullCalendar to avoid SSR issues
const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false });
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

type BookingStep = 'select-date' | 'select-slot' | 'confirm';

export default function NewBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mentorId = searchParams.get('mentorId') || '';
  const offeringId = searchParams.get('offeringId') || '';

  const user = useAuthStore((state) => state.user);
  const { data: mentor, isLoading: isMentorLoading } = useMentor(mentorId);
  const createBooking = useCreateBooking();

  // Use ref to track view date without causing re-renders
  const viewDateRef = useRef(new Date());
  const [dateRange, setDateRange] = useState(() => ({
    from: startOfMonth(new Date()).toISOString(),
    to: endOfMonth(addMonths(new Date(), 1)).toISOString(),
  }));

  // Availability slots (big blocks) - for calendar date highlighting
  const { data: slots = [], isLoading: isSlotsLoading } = useMentorAvailability(
    mentorId,
    dateRange.from,
    dateRange.to
  );

  // State
  const [step, setStep] = useState<BookingStep>('select-date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ startAt: string; endAt: string; durationMin: number } | null>(null);
  const [selectedOffering, setSelectedOffering] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [calendarReady, setCalendarReady] = useState(false);

  // Enriched offering with questions
  const [enrichedOffering, setEnrichedOffering] = useState<EnrichedOfferingDto | null>(null);
  const [questionResponses, setQuestionResponses] = useState<Record<string, string>>({});

  // Checkout form state
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [checkoutFormHtml, setCheckoutFormHtml] = useState<string>('');

  // Computed time slots for selected date (fetched from backend with buffer/duration logic)
  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const { data: computedTimeSlots = [], isLoading: isTimeSlotsLoading } = useAvailableTimeSlots(
    mentorId,
    offeringId,
    selectedDateStr
  );

  // Mark calendar as ready after mount
  useEffect(() => {
    setCalendarReady(true);
  }, []);

  // Block past date selection - redirect back to calendar with warning
  useEffect(() => {
    if (selectedDate && step !== 'select-date') {
      if (isBefore(startOfDay(selectedDate), startOfDay(new Date()))) {
        toast.error('Gecmis tarihli bir slot secemezsiniz. Lutfen gecerli bir tarih secin.');
        setStep('select-date');
        setSelectedDate(null);
        setSelectedSlot(null);
      }
    }
  }, [selectedDate, step]);

  // Set offering from mentor data
  useEffect(() => {
    if (mentor?.offerings) {
      const found = mentor.offerings.find((o) => o.id === offeringId);
      if (!found && mentor.offerings.length > 0) {
        setSelectedOffering(mentor.offerings[0]);
      } else {
        setSelectedOffering(found);
      }
    }
  }, [mentor, offeringId]);

  // Fetch enriched offering with questions
  useEffect(() => {
    if (!offeringId) return;
    offeringsApi.getById(offeringId)
      .then(data => setEnrichedOffering(data))
      .catch(() => setEnrichedOffering(null));
  }, [offeringId]);

  // Calculate available dates from slots (only future slots)
  const availableDates = useMemo(() => {
    const now = new Date();
    const dateMap = new Map<string, number>();
    slots.forEach((slot) => {
      const slotStart = parseISO(slot.startAt);
      if (slotStart <= now) return;
      const dateKey = format(slotStart, 'yyyy-MM-dd');
      dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
    });
    return dateMap;
  }, [slots]);

  // FullCalendar events (availability indicators)
  const calendarEvents = useMemo(() => {
    const events: any[] = [];
    availableDates.forEach((count, dateStr) => {
      events.push({
        date: dateStr,
        display: 'background',
        backgroundColor: '#dcfce7',
      });
    });
    return events;
  }, [availableDates]);

  // Calculate pricing - use offering's fixed price
  const effectiveDuration = selectedOffering?.durationMin || 0;
  const basePrice = selectedOffering?.price || 0;
  const platformFee = basePrice * 0.07;
  const totalPrice = basePrice + platformFee;

  // Handlers
  const handleDateClick = useCallback((info: any) => {
    const clickedDate = new Date(info.dateStr);
    const dateKey = info.dateStr;
    if (isBefore(startOfDay(clickedDate), startOfDay(new Date()))) {
      toast.error('Gecmis tarihli bir gun secemezsiniz');
      return;
    }
    if (availableDates.has(dateKey)) {
      setSelectedDate(clickedDate);
      setSelectedSlot(null);
      setStep('select-slot');
    }
  }, [availableDates]);

  const handleSlotSelect = useCallback((slot: { startAt: string; endAt: string; durationMin: number }) => {
    setSelectedSlot(slot);
    setStep('confirm');
  }, []);

  const handleBack = useCallback(() => {
    if (step === 'confirm') {
      setStep('select-slot');
      setSelectedSlot(null);
    } else if (step === 'select-slot') {
      setStep('select-date');
      setSelectedDate(null);
      setSelectedSlot(null);
    }
  }, [step]);

  // Handle calendar date range change
  const handleDatesSet = useCallback((dateInfo: any) => {
    const newStart = dateInfo.start;
    const newFrom = startOfMonth(newStart).toISOString();
    const newTo = endOfMonth(addMonths(newStart, 1)).toISOString();

    if (newFrom !== viewDateRef.current.toISOString()) {
      viewDateRef.current = newStart;
      setDateRange((prev) => {
        if (prev.from === newFrom && prev.to === newTo) return prev;
        return { from: newFrom, to: newTo };
      });
    }
  }, []);

  const handleSubmit = async () => {
    if (!selectedOffering || !selectedSlot || !user) {
      toast.error('Eksik bilgi var');
      return;
    }

    // Validate required questions
    if (enrichedOffering?.questions) {
      const requiredUnanswered = enrichedOffering.questions
        .filter(q => q.isRequired && !questionResponses[q.id]?.trim());
      if (requiredUnanswered.length > 0) {
        toast.error('Lutfen zorunlu sorulari cevaplayin');
        return;
      }
    }

    // Final safety check: block past slot booking
    if (new Date(selectedSlot.startAt) <= new Date()) {
      toast.error('Bu slot artik gecmis bir zamanda. Lutfen baska bir saat secin.');
      setStep('select-date');
      setSelectedDate(null);
      setSelectedSlot(null);
      return;
    }

    try {
      setIsProcessing(true);

      // Build question responses
      const qResponses = enrichedOffering?.questions
        ?.filter(q => questionResponses[q.id]?.trim())
        .map(q => ({
          questionId: q.id,
          answerText: questionResponses[q.id].trim(),
        })) || [];

      const bookingResult = await createBooking.mutateAsync({
        mentorUserId: mentorId,
        offeringId: selectedOffering.id,
        startAt: selectedSlot.startAt,
        durationMin: selectedSlot.durationMin,
        notes: notes || undefined,
        questionResponses: qResponses.length > 0 ? qResponses : undefined,
      });

      const orderResult = await paymentsApi.createOrder({
        type: 'Booking',
        resourceId: bookingResult.bookingId,
        buyerName: user.displayName?.split(' ')[0] || user.email.split('@')[0],
        buyerSurname: user.displayName?.split(' ').slice(1).join(' ') || 'User',
        buyerPhone: user.phone || '5555555555',
      });

      if (orderResult.checkoutFormContent) {
        setCheckoutFormHtml(orderResult.checkoutFormContent);
        setShowCheckoutForm(true);
        setIsProcessing(false);
      } else if (orderResult.paymentPageUrl) {
        window.location.href = orderResult.paymentPageUrl;
      } else {
        toast.success('Rezervasyon olusturuldu!');
        router.push(`/student/bookings/${bookingResult.bookingId}`);
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error('Booking/Payment error:', error);
      setIsProcessing(false);
    }
  };

  const handleCloseCheckoutForm = () => {
    setShowCheckoutForm(false);
    setCheckoutFormHtml('');
    toast.info('Odeme iptal edildi');
  };

  if (isMentorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#227070]" />
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Mentor bulunamadi</h2>
          <Button onClick={() => router.back()}>Geri Don</Button>
        </div>
      </div>
    );
  }

  if (!selectedOffering) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Hizmet bulunamadi</h2>
          <p className="text-gray-600 mb-4">Bu mentor icin aktif bir hizmet bulunmuyor.</p>
          <Button onClick={() => router.back()}>Geri Don</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Top Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-gray-600"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Geri
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={mentor.avatarUrl} />
                  <AvatarFallback className="bg-[#227070] text-white text-sm">
                    {mentor.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-sm font-semibold text-gray-900">
                    {mentor.displayName}
                  </h1>
                  <p className="text-xs text-gray-500">{selectedOffering.title}</p>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Video className="w-3 h-3 mr-1" />
                  Online
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {selectedOffering.durationMin} dk
                </Badge>
                <Badge className="bg-[#227070] text-white text-xs hover:bg-[#1a5555]">
                  {formatCurrency(selectedOffering.price)}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Steps Progress */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-2">
              {[
                { key: 'select-date', label: 'Tarih Sec', num: 1 },
                { key: 'select-slot', label: 'Saat Sec', num: 2 },
                { key: 'confirm', label: 'Onayla', num: 3 },
              ].map((s, i) => {
                const isActive = s.key === step;
                const isDone =
                  (s.key === 'select-date' && (step === 'select-slot' || step === 'confirm')) ||
                  (s.key === 'select-slot' && step === 'confirm');

                return (
                  <div key={s.key} className="flex items-center gap-2">
                    {i > 0 && (
                      <div
                        className={`w-8 h-px ${isDone || isActive ? 'bg-[#227070]' : 'bg-gray-300'}`}
                      />
                    )}
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                          isDone
                            ? 'bg-[#227070] text-white'
                            : isActive
                            ? 'bg-[#227070] text-white ring-2 ring-[#227070]/30'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          s.num
                        )}
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          isActive || isDone ? 'text-[#227070]' : 'text-gray-400'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Calendar / Slots */}
            <div className="lg:col-span-2">
              {/* Step 1: Date Selection */}
              {step === 'select-date' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CalendarIcon className="w-5 h-5 text-[#227070]" />
                      Tarih Secin
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Yesil renkli gunler musait slotlari gosterir. Bir gune tiklayarak saatleri gorun.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <style>{`
                      .student-calendar .fc-daygrid-day {
                        cursor: pointer;
                        transition: background-color 0.15s;
                      }
                      .student-calendar .fc-daygrid-day:hover {
                        background-color: #f0fdf4 !important;
                      }
                      .student-calendar .fc-day-today {
                        background-color: #f0f9ff !important;
                      }
                      .student-calendar .fc-daygrid-day.fc-day-past {
                        opacity: 0.4;
                        cursor: not-allowed;
                      }
                      .student-calendar .fc-toolbar-title {
                        font-size: 1.1rem !important;
                        font-weight: 600 !important;
                        color: #1f2937;
                      }
                      .student-calendar .fc-button {
                        background-color: #227070 !important;
                        border-color: #227070 !important;
                        font-size: 0.85rem !important;
                      }
                      .student-calendar .fc-button:hover {
                        background-color: #1a5555 !important;
                      }
                      .student-calendar .fc-col-header-cell-cushion {
                        font-weight: 600;
                        color: #374151;
                        text-transform: capitalize;
                      }
                      .student-calendar .fc-bg-event {
                        opacity: 0.6 !important;
                      }
                    `}</style>
                    <div className="student-calendar">
                      {calendarReady && (
                        <FullCalendar
                          plugins={[dayGridPlugin, interactionPlugin]}
                          initialView="dayGridMonth"
                          locale="tr"
                          firstDay={1}
                          headerToolbar={{
                            left: 'prev',
                            center: 'title',
                            right: 'next',
                          }}
                          height="auto"
                          events={calendarEvents}
                          dateClick={handleDateClick}
                          validRange={{
                            start: new Date().toISOString().split('T')[0],
                          }}
                          datesSet={handleDatesSet}
                        />
                      )}
                    </div>

                    {/* Available dates summary under calendar */}
                    {availableDates.size > 0 && (
                      <div className="mt-4 pt-3 border-t">
                        <p className="text-xs text-gray-500 mb-2">
                          Musait gunler ({availableDates.size} gun):
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from(availableDates.entries())
                            .filter(([dateStr]) => !isBefore(startOfDay(new Date(dateStr)), startOfDay(new Date())))
                            .sort(([a], [b]) => a.localeCompare(b))
                            .slice(0, 10)
                            .map(([dateStr]) => (
                              <button
                                key={dateStr}
                                onClick={() => {
                                  setSelectedDate(new Date(dateStr));
                                  setSelectedSlot(null);
                                  setStep('select-slot');
                                }}
                                className="text-xs px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                              >
                                {format(new Date(dateStr), 'dd MMM', { locale: tr })}
                              </button>
                            ))}
                          {availableDates.size > 10 && (
                            <span className="text-xs text-gray-400 self-center">
                              +{availableDates.size - 10} gun daha
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {isSlotsLoading && (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#227070]" />
                        <span className="ml-2 text-sm text-gray-500">Slotlar yukleniyor...</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Time Slot Selection */}
              {step === 'select-slot' && selectedDate && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleBack}
                          className="mb-2 -ml-2 text-gray-600"
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Takvime Don
                        </Button>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Clock className="w-5 h-5 text-[#227070]" />
                          Saat Secin
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          {format(selectedDate, 'dd MMMM yyyy, EEEE', { locale: tr })}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[#227070] border-[#227070]"
                      >
                        {isTimeSlotsLoading ? '...' : `${computedTimeSlots.length} musait saat`}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isTimeSlotsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#227070]" />
                        <span className="ml-3 text-sm text-gray-500">Uygun saatler hesaplaniyor...</span>
                      </div>
                    ) : computedTimeSlots.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Bu tarihte musait saat bulunamadi</p>
                        <p className="text-sm mt-1">Baska bir tarih deneyin</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {computedTimeSlots.map((slot, idx) => {
                          const startTime = format(parseISO(slot.startAt), 'HH:mm');
                          const endTime = format(parseISO(slot.endAt), 'HH:mm');
                          const isSelected = selectedSlot?.startAt === slot.startAt;

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSlotSelect(slot)}
                              className={`group relative p-3 rounded-xl border-2 transition-all duration-200 text-center ${
                                isSelected
                                  ? 'border-[#227070] bg-[#227070]/5 shadow-md ring-2 ring-[#227070]/20'
                                  : 'border-gray-200 hover:border-[#227070]/50 hover:shadow-sm bg-white'
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-1 right-1">
                                  <CheckCircle2 className="w-4 h-4 text-[#227070]" />
                                </div>
                              )}
                              <div
                                className={`text-lg font-semibold ${
                                  isSelected ? 'text-[#227070]' : 'text-gray-900'
                                }`}
                              >
                                {startTime}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {startTime} - {endTime}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Info about duration and buffer */}
                    {computedTimeSlots.length > 0 && (
                      <div className="mt-4 pt-3 border-t">
                        <p className="text-xs text-gray-400">
                          Her ders {effectiveDuration} dakika surmektedir. Dersler arasi tampon suresi otomatik olarak uygulanmaktadir.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Confirmation */}
              {step === 'confirm' && selectedSlot && (
                <Card>
                  <CardHeader>
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBack}
                        className="mb-2 -ml-2 text-gray-600"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Saat Secimine Don
                      </Button>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CheckCircle2 className="w-5 h-5 text-[#227070]" />
                        Rezervasyonu Onaylayin
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Booking Summary */}
                    <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-14 h-14">
                          <AvatarImage src={mentor.avatarUrl} />
                          <AvatarFallback className="bg-[#227070] text-white text-lg">
                            {mentor.displayName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {mentor.displayName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {mentor.university} - {mentor.department}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                        <div className="flex items-start gap-2">
                          <CalendarIcon className="w-4 h-4 text-[#227070] mt-0.5" />
                          <div>
                            <div className="text-xs text-gray-500">Tarih</div>
                            <div className="font-medium text-sm">
                              {format(parseISO(selectedSlot.startAt), 'dd MMMM yyyy, EEEE', {
                                locale: tr,
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-[#227070] mt-0.5" />
                          <div>
                            <div className="text-xs text-gray-500">Saat</div>
                            <div className="font-medium text-sm">
                              {format(parseISO(selectedSlot.startAt), 'HH:mm')} -{' '}
                              {format(parseISO(selectedSlot.endAt), 'HH:mm')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Video className="w-4 h-4 text-[#227070] mt-0.5" />
                          <div>
                            <div className="text-xs text-gray-500">Tur</div>
                            <div className="font-medium text-sm">{selectedOffering.title}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-[#227070] mt-0.5" />
                          <div>
                            <div className="text-xs text-gray-500">Sure</div>
                            <div className="font-medium text-sm">{selectedSlot.durationMin} dakika</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Booking Questions */}
                    {enrichedOffering?.questions && enrichedOffering.questions.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-[#227070]" />
                          Mentor Sorulari
                        </h4>
                        {enrichedOffering.questions.map(q => (
                          <div key={q.id}>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                              {q.questionText}
                              {q.isRequired && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <textarea
                              rows={2}
                              value={questionResponses[q.id] || ''}
                              onChange={(e) => setQuestionResponses(prev => ({
                                ...prev,
                                [q.id]: e.target.value,
                              }))}
                              placeholder="Cevabinizi yazin..."
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#227070]/30 focus:border-[#227070] transition-all"
                              maxLength={500}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Not Ekle (Opsiyonel)
                      </label>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Konusmak istediginiz konular, hedefleriniz..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#227070]/30 focus:border-[#227070] transition-all"
                        maxLength={500}
                      />
                      <div className="text-xs text-gray-400 text-right mt-1">
                        {notes.length}/500
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="bg-white border rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Hizmet bedeli</span>
                        <span className="font-medium">{formatCurrency(basePrice)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Platform hizmet bedeli (%7)</span>
                        <span className="font-medium">{formatCurrency(platformFee)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="font-semibold text-gray-900">Toplam</span>
                        <span className="text-xl font-bold text-[#227070]">
                          {formatCurrency(totalPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      onClick={handleSubmit}
                      disabled={isProcessing}
                      className="w-full h-12 bg-[#227070] hover:bg-[#1a5555] text-white text-base font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                    >
                      {isProcessing ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          Isleniyor...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5" />
                          Odemeye Gec - {formatCurrency(totalPrice)}
                        </div>
                      )}
                    </Button>

                    {/* Cancellation Policy */}
                    <div className="text-xs text-gray-500 text-center space-y-1">
                      <p>Ders baslangicinda 24 saat once iptal ederseniz %100 iade alirsiniz.</p>
                      <p>Odemeniz guvenli bir sekilde saklanir ve ders tamamlandiktan sonra mentore aktarilir.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Sidebar: Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-4">
                {/* Mentor Info Card */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center mb-4">
                      <Avatar className="w-16 h-16 mx-auto mb-3">
                        <AvatarImage src={mentor.avatarUrl} />
                        <AvatarFallback className="bg-[#227070] text-white text-xl">
                          {mentor.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-gray-900">{mentor.displayName}</h3>
                      <p className="text-sm text-gray-500">{mentor.university}</p>
                      {mentor.ratingCount > 0 && (
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm font-medium">{mentor.ratingAvg.toFixed(1)}</span>
                          <span className="text-xs text-gray-400">({mentor.ratingCount})</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Hizmet</span>
                        <span className="font-medium text-right text-xs">{selectedOffering.title}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Sure</span>
                        <span className="font-medium">{selectedOffering.durationMin} dk</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Ucret</span>
                        <span className="font-semibold text-[#227070]">
                          {formatCurrency(selectedOffering.price)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Selection Summary Card */}
                <Card
                  className={`transition-all duration-300 ${
                    selectedSlot
                      ? 'ring-2 ring-[#227070]/20 shadow-lg'
                      : 'opacity-75'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-[#227070]" />
                      Seciminiz
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500">Tarih</div>
                      {selectedDate ? (
                        <div className="font-medium text-sm text-[#227070]">
                          {format(selectedDate, 'dd MMMM yyyy', { locale: tr })}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 italic">Secilmedi</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Saat</div>
                      {selectedSlot ? (
                        <div className="font-medium text-sm text-[#227070]">
                          {format(parseISO(selectedSlot.startAt), 'HH:mm')} -{' '}
                          {format(parseISO(selectedSlot.endAt), 'HH:mm')}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 italic">Secilmedi</div>
                      )}
                    </div>

                    {selectedSlot && (
                      <div className="pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Toplam</span>
                          <span className="text-lg font-bold text-[#227070]">
                            {formatCurrency(totalPrice)}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Info Box */}
                <div className="bg-[#227070]/5 border border-[#227070]/20 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-[#227070] mb-2">Bilgilendirme</h4>
                  <ul className="text-xs text-gray-600 space-y-1.5">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-[#227070] mt-0.5 flex-shrink-0" />
                      Odemeniz guvenli altyapida saklanir
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-[#227070] mt-0.5 flex-shrink-0" />
                      24 saat oncesine kadar ucretsiz iptal
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-[#227070] mt-0.5 flex-shrink-0" />
                      Ders sonrasi degerlendirme yapabilirsiniz
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Form Modal */}
      {showCheckoutForm && checkoutFormHtml && (
        <IyzicoCheckoutForm
          checkoutFormContent={checkoutFormHtml}
          onClose={handleCloseCheckoutForm}
        />
      )}
    </>
  );
}
