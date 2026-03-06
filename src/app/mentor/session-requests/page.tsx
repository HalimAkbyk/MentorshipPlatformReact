'use client';

import { useState } from 'react';
import {
  useMentorSessionRequests,
  useApproveSessionRequest,
  useRejectSessionRequest,
} from '@/lib/hooks/use-session-requests';
import { SessionRequestCard } from '@/components/features/session-requests/session-request-card';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { FileText, Inbox } from 'lucide-react';

const STATUS_TABS = [
  { label: 'Beklemede', value: 'Pending' },
  { label: 'Onaylanan', value: 'Approved' },
  { label: 'Reddedilen', value: 'Rejected' },
  { label: 'Tumunu Gor', value: 'all' },
];

export default function MentorSessionRequestsPage() {
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [actioningId, setActioningId] = useState<string | null>(null);

  const { data: requests, isLoading, isError } = useMentorSessionRequests();
  const approveMutation = useApproveSessionRequest();
  const rejectMutation = useRejectSessionRequest();

  const filteredRequests =
    statusFilter === 'all'
      ? requests
      : requests?.filter((r) => r.status === statusFilter);

  const handleApprove = async (id: string) => {
    setActioningId(id);
    try {
      await approveMutation.mutateAsync(id);
      toast.success('Seans talebi onaylandi. Rezervasyon olusturuldu.');
    } catch (err: any) {
      toast.error(
        err?.response?.data?.errors?.[0] || 'Onaylama islemi basarisiz oldu.'
      );
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    setActioningId(id);
    try {
      await rejectMutation.mutateAsync({ id, reason });
      toast.success('Seans talebi reddedildi.');
    } catch (err: any) {
      toast.error(
        err?.response?.data?.errors?.[0] || 'Reddetme islemi basarisiz oldu.'
      );
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
          <FileText className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Gelen Seans Talepleri</h1>
          <p className="text-xs text-gray-500">Ogrencilerden gelen seans taleplerini yonetin</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              statusFilter === tab.value
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
            {tab.value === 'Pending' && requests && (
              <span className="ml-1">
                ({requests.filter((r) => r.status === 'Pending').length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-sm animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-red-600">Talepler yuklenirken bir hata olustu.</p>
          </CardContent>
        </Card>
      ) : filteredRequests && filteredRequests.length > 0 ? (
        <div className="space-y-3">
          {filteredRequests.map((request) => (
            <SessionRequestCard
              key={request.id}
              request={request}
              role="mentor"
              onApprove={handleApprove}
              onReject={handleReject}
              isApproving={approveMutation.isPending && actioningId === request.id}
              isRejecting={rejectMutation.isPending && actioningId === request.id}
            />
          ))}
        </div>
      ) : (
        <Card className="border border-dashed border-indigo-200 bg-indigo-50/30">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {statusFilter === 'Pending'
                ? 'Bekleyen seans talebi yok'
                : 'Bu durumda seans talebi bulunamadi'}
            </h3>
            <p className="text-xs text-gray-500">
              Ogrenciler seans talep ettiginde burada gorunecektir.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
