'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Search,
  Calendar,
  Eye,
  Pencil,
  X,
  Save,
  Loader2,
  Check,
  XCircle,
  Clock,
  User,
  Filter,
} from 'lucide-react';

import {
  adminApi,
  type AdminOfferingListDto,
  type PagedResult,
} from '@/lib/api/admin';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils/cn';
import { useCategoryNames } from '@/lib/hooks/use-categories';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(value: number, currency?: string): string {
  const symbol = currency === 'USD' ? '$' : '\u20BA';
  return `${symbol}${value.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const SESSION_TYPE_OPTIONS = [
  { value: '', label: 'Belirtilmemis' },
  { value: 'Online', label: 'Online' },
  { value: 'Yuz yuze', label: 'Yuz yuze' },
  { value: 'Hibrit', label: 'Hibrit' },
];

// ---------------------------------------------------------------------------
// Edit Modal
// ---------------------------------------------------------------------------

interface EditOfferingModalProps {
  offering: AdminOfferingListDto | null;
  open: boolean;
  onClose: () => void;
  categoryNames: string[];
}

function EditOfferingModal({ offering, open, onClose, categoryNames }: EditOfferingModalProps) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [category, setCategory] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [durationMin, setDurationMin] = useState(60);
  const [price, setPrice] = useState(0);
  const [maxBookingDaysAhead, setMaxBookingDaysAhead] = useState(60);
  const [minNoticeHours, setMinNoticeHours] = useState(2);
  const [isActive, setIsActive] = useState(true);
  const [reason, setReason] = useState('');

  // Populate form when offering changes
  useEffect(() => {
    if (offering) {
      setTitle(offering.title);
      setSubtitle(offering.subtitle || '');
      setDescription(offering.description || '');
      setDetailedDescription(offering.detailedDescription || '');
      setCategory(offering.category || '');
      setSessionType(offering.sessionType || '');
      setDurationMin(offering.durationMin);
      setPrice(offering.price);
      setMaxBookingDaysAhead(offering.maxBookingDaysAhead);
      setMinNoticeHours(offering.minNoticeHours);
      setIsActive(offering.isActive);
      setReason('');
    }
  }, [offering]);

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof adminApi.updateEducationOffering>[1]) =>
      adminApi.updateEducationOffering(offering!.id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'education', 'offerings'] });
      toast.success(`Paket guncellendi: ${result.changes.join(', ')}`);
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.errors?.[0] || 'Guncelleme basarisiz oldu.');
    },
  });

  const handleSubmit = () => {
    if (!offering) return;

    const data: Record<string, any> = {};

    if (title !== offering.title) data.title = title;
    if (subtitle !== (offering.subtitle || '')) data.subtitle = subtitle;
    if (description !== (offering.description || '')) data.description = description;
    if (detailedDescription !== (offering.detailedDescription || '')) data.detailedDescription = detailedDescription;
    if (category !== (offering.category || '')) data.category = category;
    if (sessionType !== (offering.sessionType || '')) data.sessionType = sessionType;
    if (durationMin !== offering.durationMin) data.durationMin = durationMin;
    if (price !== offering.price) data.price = price;
    if (maxBookingDaysAhead !== offering.maxBookingDaysAhead) data.maxBookingDaysAhead = maxBookingDaysAhead;
    if (minNoticeHours !== offering.minNoticeHours) data.minNoticeHours = minNoticeHours;
    if (isActive !== offering.isActive) data.isActive = isActive;
    if (reason.trim()) data.reason = reason.trim();

    if (Object.keys(data).filter(k => k !== 'reason').length === 0) {
      toast.error('Degisiklik bulunamadi.');
      return;
    }

    mutation.mutate(data);
  };

  if (!offering) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Paket Duzenle"
      description={`${offering.mentorName} - ${offering.title}`}
      className="max-w-2xl"
    >
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {/* Mentor Info */}
        <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-3">
          <User className="w-4 h-4 text-slate-400" />
          <div>
            <span className="text-sm font-medium text-slate-700">{offering.mentorName}</span>
            <span className="text-xs text-slate-400 ml-2">ID: {offering.mentorUserId.slice(0, 8)}...</span>
          </div>
          <Badge className="ml-auto text-[10px]" variant="outline">{offering.type}</Badge>
        </div>

        {/* Title & Subtitle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paket Adi *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Paket adi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alt Baslik</label>
            <Input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Kisa aciklama"
            />
          </div>
        </div>

        {/* Category & Session Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Kategori Secin</option>
              {categoryNames.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seans Tipi</label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {SESSION_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Duration & Price */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sure (dk) *</label>
            <Input
              type="number"
              min={15}
              max={180}
              value={durationMin}
              onChange={(e) => setDurationMin(parseInt(e.target.value) || 60)}
            />
            <p className="text-[10px] text-gray-400 mt-0.5">15-180 dakika</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (TRY) *</label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aktiflik</label>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={cn(
                'w-full h-10 rounded-md border text-sm font-medium transition-colors flex items-center justify-center gap-2',
                isActive
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              )}
            >
              {isActive ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {isActive ? 'Aktif' : 'Pasif'}
            </button>
          </div>
        </div>

        {/* Booking Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Rezervasyon Gunu</label>
            <Input
              type="number"
              min={1}
              max={365}
              value={maxBookingDaysAhead}
              onChange={(e) => setMaxBookingDaysAhead(parseInt(e.target.value) || 60)}
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Kac gun ilerisine kadar rezervasyon yapilabilir</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Bildirim Saati</label>
            <Input
              type="number"
              min={0}
              max={72}
              value={minNoticeHours}
              onChange={(e) => setMinNoticeHours(parseInt(e.target.value) || 0)}
            />
            <p className="text-[10px] text-gray-400 mt-0.5">En az kac saat onceden rezervasyon yapilmali</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kisa Aciklama</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paket hakkinda kisa aciklama..."
            className="min-h-[60px] resize-none"
          />
          <p className="text-[10px] text-gray-400 mt-0.5">{description.length}/500</p>
        </div>

        {/* Detailed Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Detayli Aciklama</label>
          <Textarea
            value={detailedDescription}
            onChange={(e) => setDetailedDescription(e.target.value)}
            placeholder="Detayli aciklama, kapsam, hedefler..."
            className="min-h-[100px] resize-none"
          />
          <p className="text-[10px] text-gray-400 mt-0.5">{detailedDescription.length}/2000</p>
        </div>

        {/* Reason (Audit) */}
        <div className="bg-amber-50 rounded-lg p-3">
          <label className="block text-sm font-medium text-amber-800 mb-1">Degisiklik Sebebi</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Neden bu degisiklik yapiliyor? (opsiyonel, kayda gecer)"
            className="min-h-[50px] resize-none bg-white"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4 mr-1" />
            Vazgec
          </Button>
          <Button
            size="sm"
            className="bg-teal-600 hover:bg-teal-700"
            disabled={mutation.isPending || !title.trim()}
            onClick={handleSubmit}
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            Kaydet
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Filter Button
// ---------------------------------------------------------------------------

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
        active
          ? 'bg-primary-600 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      )}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminOfferingsPage() {
  const queryClient = useQueryClient();
  const categoryNames = useCategoryNames('Offering');

  // --- State ---
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Edit modal
  const [editTarget, setEditTarget] = useState<AdminOfferingListDto | null>(null);

  // --- Debounce search ---
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimer) clearTimeout(searchTimer);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
    setSearchTimer(timer);
  };

  // --- Query ---
  const { data: offeringsResult, isLoading } = useQuery({
    queryKey: [
      'admin', 'education', 'offerings',
      { page, pageSize, search: debouncedSearch, category: categoryFilter, isActive: activeFilter },
    ],
    queryFn: () =>
      adminApi.getEducationOfferings({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        category: categoryFilter || undefined,
        isActive: activeFilter === '' ? undefined : activeFilter === 'true',
      }),
  });

  const offerings = offeringsResult?.items ?? [];
  const totalCount = offeringsResult?.totalCount ?? 0;
  const totalPages = offeringsResult?.totalPages ?? 0;

  // --- Columns ---
  const columns: Column<AdminOfferingListDto>[] = [
    {
      key: 'title',
      label: 'Paket',
      render: (item) => (
        <div className="min-w-0 max-w-[220px]">
          <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
          {item.subtitle && (
            <p className="text-[11px] text-gray-400 truncate">{item.subtitle}</p>
          )}
        </div>
      ),
    },
    {
      key: 'mentorName',
      label: 'Egitmen',
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-sm text-gray-900">{item.mentorName}</span>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Kategori',
      render: (item) => (
        item.category
          ? <Badge variant="outline" className="text-xs">{item.category}</Badge>
          : <span className="text-xs text-gray-400">-</span>
      ),
    },
    {
      key: 'durationMin',
      label: 'Sure',
      className: 'whitespace-nowrap',
      render: (item) => (
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-sm text-gray-700">{item.durationMin} dk</span>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Fiyat',
      className: 'whitespace-nowrap',
      render: (item) => (
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(item.price, item.currency)}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Durum',
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <span className={cn(
            'inline-block w-2 h-2 rounded-full',
            item.isActive ? 'bg-green-500' : 'bg-red-400'
          )} />
          <span className={cn('text-xs font-medium', item.isActive ? 'text-green-700' : 'text-red-600')}>
            {item.isActive ? 'Aktif' : 'Pasif'}
          </span>
        </div>
      ),
    },
    {
      key: 'approvalStatus',
      label: 'Onay',
      render: (item) => {
        const statusColors: Record<string, string> = {
          Approved: 'bg-green-100 text-green-700',
          PendingApproval: 'bg-amber-100 text-amber-700',
          Rejected: 'bg-red-100 text-red-700',
          Draft: 'bg-gray-100 text-gray-600',
        };
        const statusLabels: Record<string, string> = {
          Approved: 'Onayli',
          PendingApproval: 'Bekliyor',
          Rejected: 'Reddedildi',
          Draft: 'Taslak',
        };
        return (
          <Badge className={cn('text-[10px] px-1.5 py-0', statusColors[item.approvalStatus] || 'bg-gray-100 text-gray-600')}>
            {statusLabels[item.approvalStatus] || item.approvalStatus}
          </Badge>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Olusturma',
      className: 'whitespace-nowrap',
      render: (item) => (
        <span className="text-xs text-gray-500">{formatDateTime(item.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Islemler',
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setEditTarget(item);
          }}
        >
          <Pencil className="h-3.5 w-3.5 mr-1" />
          Duzenle
        </Button>
      ),
    },
  ];

  // Category filters
  const categoryFilters = [
    { label: 'Tumu', value: '' },
    ...categoryNames.map((name) => ({ label: name, value: name })),
  ];

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Package className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">1:1 Paketler</h1>
        </div>
        <p className="text-sm text-gray-500">
          Tum egitmenlerin bire bir seans paketlerini goruntule ve duzenle
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Paket adi ile ara..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Active filter */}
          <div className="flex items-center gap-2">
            <FilterButton label="Tumu" active={activeFilter === ''} onClick={() => { setActiveFilter(''); setPage(1); }} />
            <FilterButton label="Aktif" active={activeFilter === 'true'} onClick={() => { setActiveFilter('true'); setPage(1); }} />
            <FilterButton label="Pasif" active={activeFilter === 'false'} onClick={() => { setActiveFilter('false'); setPage(1); }} />
          </div>
        </div>

        {/* Category filter */}
        {categoryNames.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-medium mr-1">Kategori:</span>
            {categoryFilters.map((cf) => (
              <FilterButton
                key={cf.value}
                label={cf.label}
                active={categoryFilter === cf.value}
                onClick={() => {
                  setCategoryFilter(cf.value);
                  setPage(1);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="mb-4 text-xs text-gray-500">
          Toplam {totalCount} paket bulundu
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={offerings}
        isLoading={isLoading}
        getRowId={(item) => item.id}
        emptyMessage="Paket bulunamadi."
        emptyIcon={<Package className="h-12 w-12" />}
        pagination={{
          page,
          pageSize,
          totalCount,
          totalPages,
          onPageChange: setPage,
        }}
      />

      {/* Edit Modal */}
      <EditOfferingModal
        offering={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        categoryNames={categoryNames}
      />
    </div>
  );
}
