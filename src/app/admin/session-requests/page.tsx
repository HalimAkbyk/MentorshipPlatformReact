'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Check, X, Loader2, Search, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

interface SessionRequestDto {
  id: string;
  studentUserId: string;
  studentName: string;
  mentorUserId: string;
  mentorName: string;
  offeringTitle?: string;
  requestedStartAt: string;
  durationMin: number;
  studentNote?: string;
  status: string;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  Pending: { label: 'Bekliyor', color: 'bg-amber-100 text-amber-700' },
  ApprovedByMentor: { label: 'Mentor Onayladi', color: 'bg-blue-100 text-blue-700' },
  ApprovedByAdmin: { label: 'Admin Onayladi', color: 'bg-green-100 text-green-700' },
  Rejected: { label: 'Reddedildi', color: 'bg-red-100 text-red-700' },
  Expired: { label: 'Suresi Doldu', color: 'bg-gray-100 text-gray-500' },
  Converted: { label: 'Seansa Donusturuldu', color: 'bg-teal-100 text-teal-700' },
};

export default function AdminSessionRequestsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('Pending');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin', 'session-requests', statusFilter],
    queryFn: () => apiClient.get<SessionRequestDto[]>(`/session-requests/admin${statusFilter ? `?status=${statusFilter}` : ''}`),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/session-requests/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'session-requests'] });
      toast.success('Talep onaylandi');
    },
    onError: () => toast.error('Onaylama basarisiz'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/session-requests/${id}/reject`, { reason: 'Admin tarafindan reddedildi' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'session-requests'] });
      toast.success('Talep reddedildi');
    },
    onError: () => toast.error('Reddetme basarisiz'),
  });

  const filtered = (requests || []).filter((r: SessionRequestDto) =>
    !searchQuery ||
    r.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.mentorName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seans Talepleri</h1>
        <p className="text-sm text-gray-500 mt-1">Ogrencilerin gonderdiği seans taleplerini yonetin</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {['Pending', 'ApprovedByMentor', 'ApprovedByAdmin', 'Rejected', 'Expired', 'Converted', ''].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              statusFilter === status
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {status ? (STATUS_MAP[status]?.label || status) : 'Tumu'}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Isim ara..."
            className="pl-10 w-48"
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Seans talebi bulunamadi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req: SessionRequestDto) => {
            const statusInfo = STATUS_MAP[req.status] || { label: req.status, color: 'bg-gray-100 text-gray-500' };
            return (
              <Card key={req.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{req.studentName}</span>
                          <span className="text-xs text-gray-400">→</span>
                          <span className="text-sm font-medium text-teal-700">{req.mentorName}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(req.requestedStartAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>{req.durationMin} dk</span>
                          {req.offeringTitle && <span className="text-teal-600">{req.offeringTitle}</span>}
                        </div>
                        {req.studentNote && (
                          <p className="text-xs text-gray-500 mt-1 italic">&quot;{req.studentNote}&quot;</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                      {req.status === 'Pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(req.id)}
                            disabled={approveMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-xs"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" /> Onayla
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectMutation.mutate(req.id)}
                            disabled={rejectMutation.isPending}
                            className="text-red-600 border-red-200 text-xs"
                          >
                            <X className="w-3.5 h-3.5 mr-1" /> Reddet
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
