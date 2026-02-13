'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  Filter,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  RefreshCcw,
  Activity,
  TrendingUp,
} from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { adminApi, type AdminBookingDto, type SystemHealthDto } from '../../../lib/api/admin';
import { formatCurrency } from '../../../lib/utils/format';

// Status color mapping
const statusColors: Record<string, { bg: string; border: string; text: string; label: string }> = {
  PendingPayment: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', label: 'Ödeme Bekliyor' },
  Confirmed: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af', label: 'Onaylandı' },
  Completed: { bg: '#dcfce7', border: '#22c55e', text: '#166534', label: 'Tamamlandı' },
  Cancelled: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', label: 'İptal' },
  NoShow: { bg: '#fce7f3', border: '#ec4899', text: '#9d174d', label: 'Katılmadı' },
  Disputed: { bg: '#fef9c3', border: '#eab308', text: '#854d0e', label: 'İtiraz' },
  Expired: { bg: '#e5e7eb', border: '#6b7280', text: '#374151', label: 'Süresi Doldu' },
};

function getStatusInfo(status: string) {
  return statusColors[status] || { bg: '#f3f4f6', border: '#9ca3af', text: '#4b5563', label: status };
}

export default function AdminCalendarPage() {
  const [viewDate, setViewDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [mentorFilter, setMentorFilter] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<AdminBookingDto | null>(null);

  // Date range for fetching
  const fromDate = useMemo(() => startOfMonth(subMonths(viewDate, 1)).toISOString(), [viewDate]);
  const toDate = useMemo(() => endOfMonth(addMonths(viewDate, 1)).toISOString(), [viewDate]);

  // Fetch all bookings
  const {
    data: bookings = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin-bookings', fromDate, toDate, statusFilter, mentorFilter],
    queryFn: () =>
      adminApi.getAllBookings({
        from: fromDate,
        to: toDate,
        status: statusFilter || undefined,
        mentorUserId: mentorFilter || undefined,
      }),
  });

  // Fetch system health
  const { data: health } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: () => adminApi.getSystemHealth(),
    refetchInterval: 60000, // Every minute
  });

  // Convert bookings to FullCalendar events
  const calendarEvents = useMemo(() => {
    return bookings.map((b) => {
      const statusInfo = getStatusInfo(b.status);
      return {
        id: b.id,
        title: `${b.mentorName || 'Mentor'} ↔ ${b.studentName || 'Öğrenci'}`,
        start: b.startAt,
        end: b.endAt,
        backgroundColor: statusInfo.bg,
        borderColor: statusInfo.border,
        textColor: statusInfo.text,
        extendedProps: { booking: b },
      };
    });
  }, [bookings]);

  // Unique mentors for filter
  const mentors = useMemo(() => {
    const mentorMap = new Map<string, string>();
    bookings.forEach((b) => {
      if (b.mentorUserId && b.mentorName) {
        mentorMap.set(b.mentorUserId, b.mentorName);
      }
    });
    return Array.from(mentorMap.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [bookings]);

  // Stats
  const stats = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter((b) => b.status === 'Confirmed').length;
    const completed = bookings.filter((b) => b.status === 'Completed').length;
    const cancelled = bookings.filter((b) => b.status === 'Cancelled').length;
    const disputed = bookings.filter((b) => b.status === 'Disputed').length;
    const totalRevenue = bookings
      .filter((b) => b.status === 'Completed' || b.status === 'Confirmed')
      .reduce((sum, b) => sum + b.price, 0);

    return { total, confirmed, completed, cancelled, disputed, totalRevenue };
  }, [bookings]);

  const handleEventClick = (info: any) => {
    const booking = info.event.extendedProps.booking as AdminBookingDto;
    setSelectedBooking(booking);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-[#227070]" />
            Admin Takvim
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tüm mentor ve öğrenci randevularını takip edin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-gray-600"
          >
            <RefreshCcw className="w-4 h-4 mr-1" />
            Yenile
          </Button>
        </div>
      </div>

      {/* System Health Cards */}
      {health && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <HealthCard
            icon={<Clock className="w-4 h-4" />}
            label="Bekleyen Ödemeler"
            value={health.pendingOrdersCount}
            color="amber"
          />
          <HealthCard
            icon={<AlertTriangle className="w-4 h-4" />}
            label="Takılan Bookings"
            value={health.stuckBookingsCount}
            color="red"
          />
          <HealthCard
            icon={<Activity className="w-4 h-4" />}
            label="Aktif Oturumlar"
            value={health.activeSessionsCount}
            color="blue"
          />
          <HealthCard
            icon={<XCircle className="w-4 h-4" />}
            label="İtirazlar"
            value={health.disputedBookingsCount}
            color="yellow"
          />
          <HealthCard
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="Tamamlanan (24s)"
            value={health.completedBookingsLast24h}
            color="green"
          />
          <HealthCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="İptal (24s)"
            value={health.cancelledBookingsLast24h}
            color="gray"
          />
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <StatCard label="Toplam" value={stats.total} />
        <StatCard label="Onaylı" value={stats.confirmed} color="text-blue-600" />
        <StatCard label="Tamamlanan" value={stats.completed} color="text-green-600" />
        <StatCard label="İptal" value={stats.cancelled} color="text-red-600" />
        <StatCard label="İtiraz" value={stats.disputed} color="text-yellow-600" />
        <StatCard
          label="Gelir"
          value={formatCurrency(stats.totalRevenue)}
          color="text-[#227070]"
          isText
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtrele:</span>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#227070]/30 focus:border-[#227070]"
            >
              <option value="">Tüm Durumlar</option>
              {Object.entries(statusColors).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>

            {/* Mentor Filter */}
            <select
              value={mentorFilter}
              onChange={(e) => setMentorFilter(e.target.value)}
              className="text-sm border rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#227070]/30 focus:border-[#227070]"
            >
              <option value="">Tüm Mentörler</option>
              {mentors.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>

            {(statusFilter || mentorFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('');
                  setMentorFilter('');
                }}
                className="text-xs text-gray-500"
              >
                Temizle
              </Button>
            )}

            {/* Legend */}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {Object.entries(statusColors).map(([key, val]) => (
                <div key={key} className="flex items-center gap-1">
                  <div
                    className="w-3 h-3 rounded-sm border"
                    style={{ backgroundColor: val.bg, borderColor: val.border }}
                  />
                  <span className="text-[11px] text-gray-500">{val.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar + Detail Panel */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="pt-4">
              <style>{`
                .admin-calendar .fc-toolbar-title {
                  font-size: 1.1rem !important;
                  font-weight: 600 !important;
                  color: #1f2937;
                }
                .admin-calendar .fc-button {
                  background-color: #227070 !important;
                  border-color: #227070 !important;
                  font-size: 0.8rem !important;
                  padding: 4px 10px !important;
                }
                .admin-calendar .fc-button:hover {
                  background-color: #1a5555 !important;
                }
                .admin-calendar .fc-button-active {
                  background-color: #1a5555 !important;
                  box-shadow: inset 0 2px 4px rgba(0,0,0,0.15) !important;
                }
                .admin-calendar .fc-event {
                  cursor: pointer;
                  font-size: 0.75rem !important;
                  border-radius: 4px !important;
                  padding: 1px 4px !important;
                  border-left-width: 3px !important;
                }
                .admin-calendar .fc-event:hover {
                  opacity: 0.85;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .admin-calendar .fc-col-header-cell-cushion {
                  font-weight: 600;
                  color: #374151;
                  text-transform: capitalize;
                  font-size: 0.85rem;
                }
                .admin-calendar .fc-timegrid-slot-label-cushion {
                  font-size: 0.75rem;
                  color: #6b7280;
                }
                .admin-calendar .fc-day-today {
                  background-color: #f0f9ff !important;
                }
                .admin-calendar .fc-list-event:hover td {
                  background-color: #f0fdf4 !important;
                }
              `}</style>
              <div className="admin-calendar">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                  initialView="timeGridWeek"
                  locale="tr"
                  firstDay={1}
                  headerToolbar={{
                    left: 'prev,today,next',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
                  }}
                  buttonText={{
                    today: 'Bugün',
                    month: 'Ay',
                    week: 'Hafta',
                    day: 'Gün',
                    list: 'Liste',
                  }}
                  height="auto"
                  events={calendarEvents}
                  eventClick={handleEventClick}
                  slotMinTime="06:00:00"
                  slotMaxTime="23:00:00"
                  slotDuration="00:30:00"
                  nowIndicator
                  allDaySlot={false}
                  datesSet={(dateInfo) => {
                    setViewDate(dateInfo.start);
                  }}
                  eventContent={(eventInfo) => {
                    const booking = eventInfo.event.extendedProps.booking as AdminBookingDto;
                    const statusInfo = getStatusInfo(booking.status);
                    return (
                      <div className="overflow-hidden px-1 py-0.5">
                        <div className="font-medium truncate text-[11px]">
                          {booking.mentorName}
                        </div>
                        <div className="text-[10px] opacity-75 truncate">
                          {booking.studentName}
                        </div>
                      </div>
                    );
                  }}
                  loading={(isLoading) => {}}
                />
              </div>

              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#227070]" />
                  <span className="ml-3 text-gray-500">Yükleniyor...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            {selectedBooking ? (
              <Card className="ring-2 ring-[#227070]/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Eye className="w-4 h-4 text-[#227070]" />
                      Randevu Detayı
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedBooking(null)}
                      className="text-xs h-6 w-6 p-0"
                    >
                      ✕
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Status Badge */}
                  <div className="flex justify-center">
                    <Badge
                      style={{
                        backgroundColor: getStatusInfo(selectedBooking.status).bg,
                        color: getStatusInfo(selectedBooking.status).text,
                        borderColor: getStatusInfo(selectedBooking.status).border,
                        borderWidth: '1px',
                      }}
                      className="text-xs px-3 py-1"
                    >
                      {getStatusInfo(selectedBooking.status).label}
                    </Badge>
                  </div>

                  {/* Mentor */}
                  <div>
                    <div className="text-xs text-gray-500">Mentör</div>
                    <div className="font-medium text-sm flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#227070]" />
                      {selectedBooking.mentorName || 'Bilinmiyor'}
                    </div>
                  </div>

                  {/* Student */}
                  <div>
                    <div className="text-xs text-gray-500">Öğrenci</div>
                    <div className="font-medium text-sm flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      {selectedBooking.studentName || 'Bilinmiyor'}
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div>
                    <div className="text-xs text-gray-500">Tarih</div>
                    <div className="font-medium text-sm">
                      {format(parseISO(selectedBooking.startAt), 'dd MMM yyyy, EEEE', {
                        locale: tr,
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Saat</div>
                    <div className="font-medium text-sm">
                      {format(parseISO(selectedBooking.startAt), 'HH:mm')} -{' '}
                      {format(parseISO(selectedBooking.endAt), 'HH:mm')}
                      <span className="text-xs text-gray-400 ml-1">
                        ({selectedBooking.durationMin} dk)
                      </span>
                    </div>
                  </div>

                  {/* Offering */}
                  {selectedBooking.offeringTitle && (
                    <div>
                      <div className="text-xs text-gray-500">Hizmet</div>
                      <div className="font-medium text-sm">{selectedBooking.offeringTitle}</div>
                    </div>
                  )}

                  {/* Price */}
                  <div className="pt-2 border-t">
                    <div className="text-xs text-gray-500">Ücret</div>
                    <div className="font-semibold text-[#227070]">
                      {formatCurrency(selectedBooking.price, selectedBooking.currency)}
                    </div>
                  </div>

                  {/* Booking ID */}
                  <div className="pt-2 border-t">
                    <div className="text-xs text-gray-500">Booking ID</div>
                    <div className="text-[11px] text-gray-400 font-mono break-all">
                      {selectedBooking.id}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="opacity-75">
                <CardContent className="pt-6">
                  <div className="text-center text-gray-400 py-8">
                    <Eye className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Detay görmek için bir randevuya tıklayın</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-gray-500">Bu Dönem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Toplam Randevu</span>
                    <span className="font-semibold">{stats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Onaylı</span>
                    <span className="font-semibold text-blue-600">{stats.confirmed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tamamlanan</span>
                    <span className="font-semibold text-green-600">{stats.completed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">İptal</span>
                    <span className="font-semibold text-red-600">{stats.cancelled}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600 font-medium">Toplam Gelir</span>
                    <span className="font-bold text-[#227070]">
                      {formatCurrency(stats.totalRevenue)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function HealthCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    <div className={`rounded-lg border p-3 ${colorClasses[color] || colorClasses.gray}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[11px] font-medium truncate">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  isText,
}: {
  label: string;
  value: number | string;
  color?: string;
  isText?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border p-3 text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-lg font-bold ${color || 'text-gray-900'}`}>
        {isText ? value : value}
      </div>
    </div>
  );
}
