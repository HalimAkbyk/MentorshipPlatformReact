'use client';

import { useState } from 'react';
import { useMySessionRequests } from '@/lib/hooks/use-session-requests';
import { SessionRequestCard } from '@/components/features/session-requests/session-request-card';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Inbox } from 'lucide-react';

const STATUS_TABS = [
  { label: 'Beklemede', value: 'Pending' },
  { label: 'Onaylanan', value: 'Approved' },
  { label: 'Reddedilen', value: 'Rejected' },
  { label: 'Suresi Dolan', value: 'Expired' },
  { label: 'Tumunu Gor', value: 'all' },
];

export default function StudentSessionRequestsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: requests, isLoading, isError } = useMySessionRequests();

  const filteredRequests =
    statusFilter === 'all'
      ? requests
      : requests?.filter((r) => r.status === statusFilter);

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
          <FileText className="w-4 h-4 text-purple-600" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Seans Taleplerim</h1>
          <p className="text-xs text-gray-500">Gondermis oldugunuz seans taleplerini takip edin</p>
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
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
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
              role="student"
            />
          ))}
        </div>
      ) : (
        <Card className="border border-dashed border-purple-200 bg-purple-50/30">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {statusFilter === 'all'
                ? 'Henuz seans talebiniz yok'
                : 'Bu durumda seans talebi bulunamadi'}
            </h3>
            <p className="text-xs text-gray-500">
              Bir egitmenden seans talep ettiginde burada gorunecektir.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
