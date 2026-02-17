'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Flag,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';

import {
  adminApi,
  type MessageReportDto,
} from '@/lib/api/admin';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { StatCard } from '@/components/admin/stat-card';
import { DetailDrawer } from '@/components/admin/detail-drawer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const truncate = (text: string | null, max: number) => {
  if (!text) return '-';
  return text.length > max ? text.slice(0, max) + '...' : text;
};

// ---------------------------------------------------------------------------
// Filter tabs
// ---------------------------------------------------------------------------

const statusFilters = [
  { label: 'Tumu', value: '' },
  { label: 'Bekleyen', value: 'Pending' },
  { label: 'Incelendi', value: 'Reviewed' },
  { label: 'Reddedildi', value: 'Dismissed' },
];

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
// Report Detail Drawer content
// ---------------------------------------------------------------------------

function ReportDetailContent({
  report,
  onReview,
  isReviewing,
}: {
  report: MessageReportDto;
  onReview: (status: string, notes?: string) => void;
  isReviewing: boolean;
}) {
  const [adminNotes, setAdminNotes] = useState('');

  return (
    <div className="space-y-6">
      {/* Report Info */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Rapor Bilgileri</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Rapor ID</span>
            <p className="font-mono text-gray-900">{report.id.slice(0, 8)}...</p>
          </div>
          <div>
            <span className="text-gray-500">Durum</span>
            <p><StatusBadge status={report.status} size="sm" /></p>
          </div>
          <div>
            <span className="text-gray-500">Raporlayan</span>
            <p className="font-medium text-gray-900">{report.reporterName}</p>
          </div>
          <div>
            <span className="text-gray-500">Raporlanan</span>
            <p className="font-medium text-gray-900">{report.reportedName}</p>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Tarih</span>
            <p className="text-gray-900">{formatDate(report.createdAt)}</p>
          </div>
        </div>
      </section>

      {/* Reason */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Rapor Sebebi</h3>
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
          {report.reason}
        </div>
      </section>

      {/* Message Content */}
      {report.messageContent && (
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Mesaj Icerigi</h3>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-gray-700">
            {report.messageContent}
          </div>
        </section>
      )}

      {/* Admin Review */}
      {report.status === 'Pending' ? (
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Inceleme</h3>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Admin notlari (istege bagli)..."
            rows={3}
            className={cn(
              'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700',
              'placeholder:text-gray-400 resize-none',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'disabled:opacity-50 disabled:bg-gray-50'
            )}
            disabled={isReviewing}
          />
          <div className="flex items-center gap-3 mt-3">
            <Button
              onClick={() => onReview('Reviewed', adminNotes.trim() || undefined)}
              disabled={isReviewing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Onayla
            </Button>
            <Button
              variant="outline"
              onClick={() => onReview('Dismissed', adminNotes.trim() || undefined)}
              disabled={isReviewing}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              Reddet
            </Button>
          </div>
        </section>
      ) : (
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Inceleme Sonucu</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Karar</span>
              <p><StatusBadge status={report.status} size="sm" /></p>
            </div>
            {report.reviewedAt && (
              <div>
                <span className="text-gray-500">Inceleme Tarihi</span>
                <p className="text-gray-900">{formatDate(report.reviewedAt)}</p>
              </div>
            )}
          </div>
          {report.adminNotes && (
            <div className="mt-3">
              <span className="text-gray-500 text-sm">Admin Notlari</span>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 mt-1">
                {report.adminNotes}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminMessageReportsPage() {
  const queryClient = useQueryClient();

  // State
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MessageReportDto | null>(null);

  // Query: Reports list
  const { data: reportsResult, isLoading } = useQuery({
    queryKey: ['admin', 'message-reports', statusFilter, page],
    queryFn: () =>
      adminApi.getMessageReports({
        status: statusFilter || undefined,
        page,
        pageSize,
      }),
  });

  const reports = reportsResult?.items ?? [];
  const totalCount = reportsResult?.totalCount ?? 0;
  const totalPages = reportsResult?.totalPages ?? 0;

  // Computed stats
  const pendingCount = reports.filter((r) => r.status === 'Pending').length;
  const reviewedCount = reports.filter((r) => r.status === 'Reviewed').length;
  const dismissedCount = reports.filter((r) => r.status === 'Dismissed').length;

  // Mutation: Review report
  const reviewMutation = useMutation({
    mutationFn: ({ reportId, status, adminNotes }: { reportId: string; status: string; adminNotes?: string }) =>
      adminApi.reviewMessageReport(reportId, { status, adminNotes }),
    onSuccess: () => {
      toast.success('Rapor basariyla incelendi.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'message-reports'] });
      setDrawerOpen(false);
      setSelectedReport(null);
    },
    onError: () => {
      toast.error('Inceleme sirasinda bir hata olustu.');
    },
  });

  const handleReview = (status: string, notes?: string) => {
    if (!selectedReport) return;
    reviewMutation.mutate({
      reportId: selectedReport.id,
      status,
      adminNotes: notes,
    });
  };

  const handleOpenDetail = (report: MessageReportDto) => {
    setSelectedReport(report);
    setDrawerOpen(true);
  };

  // Columns
  const columns: Column<MessageReportDto>[] = [
    {
      key: 'reporterName',
      label: 'Raporlayan',
      render: (item) => (
        <span className="text-sm font-medium text-gray-900">{item.reporterName}</span>
      ),
    },
    {
      key: 'reportedName',
      label: 'Raporlanan',
      render: (item) => (
        <span className="text-sm font-medium text-gray-900">{item.reportedName}</span>
      ),
    },
    {
      key: 'reason',
      label: 'Sebep',
      render: (item) => (
        <span className="text-sm text-gray-600">{truncate(item.reason, 100)}</span>
      ),
    },
    {
      key: 'messageContent',
      label: 'Mesaj',
      render: (item) => (
        <span className="text-sm text-gray-500 italic">{truncate(item.messageContent, 60)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Durum',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'createdAt',
      label: 'Tarih',
      className: 'whitespace-nowrap',
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs text-gray-600">{formatDate(item.createdAt)}</span>
        </div>
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
            handleOpenDetail(item);
          }}
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          Incele
        </Button>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Flag className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Mesaj Raporlari</h1>
        </div>
        <p className="text-sm text-gray-500">
          Kullanicilar tarafindan raporlanan mesajlari inceleyin ve yonetin
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Toplam Rapor"
          value={totalCount}
          icon={<Flag className="h-5 w-5" />}
          variant="default"
        />
        <StatCard
          title="Bekleyen"
          value={pendingCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="warning"
        />
        <StatCard
          title="Incelendi"
          value={reviewedCount}
          icon={<CheckCircle className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Reddedildi"
          value={dismissedCount}
          icon={<XCircle className="h-5 w-5" />}
          variant="danger"
        />
      </div>

      {/* Status filter tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 font-medium mr-1">Durum:</span>
          {statusFilters.map((sf) => (
            <FilterButton
              key={sf.value}
              label={sf.label}
              active={statusFilter === sf.value}
              onClick={() => { setStatusFilter(sf.value); setPage(1); }}
            />
          ))}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={reports}
        isLoading={isLoading}
        getRowId={(item) => item.id}
        onRowClick={handleOpenDetail}
        emptyMessage="Mesaj raporu bulunamadi."
        emptyIcon={<MessageSquare className="h-12 w-12" />}
        pagination={{
          page,
          pageSize,
          totalCount,
          totalPages,
          onPageChange: setPage,
        }}
      />

      {/* Detail Drawer */}
      <DetailDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedReport(null); }}
        title="Rapor Detayi"
        width="lg"
      >
        {selectedReport ? (
          <ReportDetailContent
            report={selectedReport}
            onReview={handleReview}
            isReviewing={reviewMutation.isPending}
          />
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">Rapor bilgisi bulunamadi.</p>
        )}
      </DetailDrawer>
    </div>
  );
}
