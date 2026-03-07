'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStudentAssignments } from '@/lib/hooks/use-assignments';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { cn } from '@/lib/utils/cn';
import {
  FileCheck,
  CalendarDays,
  Star,
  User,
  Search,
} from 'lucide-react';

const STATUS_TABS = [
  { label: 'Tumu', value: '' },
  { label: 'Bekleyen', value: 'Pending' },
  { label: 'Teslim Edildi', value: 'Submitted' },
  { label: 'Degerlendirildi', value: 'Reviewed' },
];

const TYPE_LABELS: Record<string, string> = {
  Homework: 'Odev', Project: 'Proje', Practice: 'Pratik',
  Quiz: 'Quiz', Reading: 'Okuma', Research: 'Arastirma',
};

const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  Pending: 'Bekliyor',
  Submitted: 'Teslim Edildi',
  Approved: 'Onaylandi',
  RevisionRequired: 'Revizyon Gerekli',
  Rejected: 'Reddedildi',
};

function submissionStatusColor(status?: string) {
  switch (status) {
    case 'Submitted': return 'bg-blue-100 text-blue-700';
    case 'Approved': return 'bg-green-100 text-green-700';
    case 'RevisionRequired': return 'bg-orange-100 text-orange-700';
    case 'Rejected': return 'bg-red-100 text-red-700';
    case 'Pending': return 'bg-amber-100 text-amber-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function getDueDateUrgency(dueDate?: string): string {
  if (!dueDate) return '';
  const diff = new Date(dueDate).getTime() - Date.now();
  const hours = diff / (1000 * 60 * 60);
  if (hours < 0) return 'text-red-600'; // overdue
  if (hours < 24) return 'text-red-500'; // less than 24h
  if (hours < 72) return 'text-amber-600'; // less than 3 days
  return 'text-gray-500';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function StudentAssignmentsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useStudentAssignments({
    status: statusFilter || undefined,
    page,
    pageSize: 12,
  });

  const allItems = data?.items ?? [];
  const items = searchTerm
    ? allItems.filter((a) => a.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : allItems;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
          <FileCheck className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Odevlerim</h1>
          <p className="text-xs text-gray-500">Atanan odevlerinizi takip edin</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center mb-5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={cn(
              'px-4 py-2 rounded-lg text-sm transition-all',
              statusFilter === tab.value
                ? 'bg-teal-100 text-teal-700'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {tab.label}
          </button>
        ))}
        <div className="flex-1" />
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 w-44"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <Card className="p-8 text-center border border-gray-200">
          <div className="animate-pulse text-gray-400">Yukleniyor...</div>
        </Card>
      ) : items.length === 0 ? (
        <Card className="border border-dashed border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <FileCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {searchTerm || statusFilter ? 'Aramanizla eslesen odev bulunamadi' : 'Henuz odev yok'}
            </h3>
            <p className="text-xs text-gray-500">
              {searchTerm || statusFilter ? 'Farkli filtreler deneyin' : 'Egitmeniniz odev atadigi zaman burada gorunecek'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <Link key={item.id} href={`/student/assignments/${item.id}`}>
                <Card className="border border-gray-200 hover:border-teal-200 transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h3 className="text-sm font-medium text-gray-900">{item.title}</h3>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {TYPE_LABELS[item.assignmentType] ?? item.assignmentType}
                          </Badge>
                          {item.mySubmissionStatus && (
                            <Badge className={cn('text-[10px] px-1.5 py-0', submissionStatusColor(item.mySubmissionStatus))}>
                              {SUBMISSION_STATUS_LABELS[item.mySubmissionStatus] ?? item.mySubmissionStatus}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {item.mentorName}
                          </span>
                          {item.dueDate && (
                            <span className={cn('flex items-center gap-1', getDueDateUrgency(item.dueDate))}>
                              <CalendarDays className="w-3 h-3" />
                              Son: {formatDate(item.dueDate)}
                            </span>
                          )}
                          {item.maxScore != null && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {item.maxScore} puan
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score */}
                      {item.myScore != null && (
                        <div className="flex-shrink-0 text-right">
                          <div className="text-lg font-bold text-teal-700">{item.myScore}</div>
                          {item.maxScore != null && (
                            <div className="text-[10px] text-gray-400">/ {item.maxScore}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={data?.totalPages ?? 1}
            totalCount={data?.totalCount ?? 0}
            onPageChange={setPage}
            itemLabel="odev"
          />
        </>
      )}
    </div>
  );
}
