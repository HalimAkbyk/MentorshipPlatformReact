'use client';

import { Cog, Clock, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

interface JobInfo {
  name: string;
  description: string;
  schedule: string;
  status: 'active' | 'idle';
}

const backgroundJobs: JobInfo[] = [
  {
    name: 'BookingReminderJob',
    description: 'Yaklasan dersler icin hatirlatma bildirimi gonderir (1 saat oncesinden).',
    schedule: 'Her 10 dakika',
    status: 'active',
  },
  {
    name: 'ExpirePendingBookingsJob',
    description: 'Suresi dolmus PendingPayment durumdaki rezervasyonlari iptal eder.',
    schedule: 'Her 5 dakika',
    status: 'active',
  },
  {
    name: 'ExpirePendingOrdersJob',
    description: 'Suresi dolmus bekleyen siparisleri otomatik iptal eder.',
    schedule: 'Her 5 dakika',
    status: 'active',
  },
  {
    name: 'DetectNoShowJob',
    description: 'Baslamis ama baglanti kurulmamis dersleri NoShow olarak isaretler.',
    schedule: 'Her 15 dakika',
    status: 'active',
  },
  {
    name: 'CoursePayoutProcessJob',
    description: 'Kurs satislarindan mentor paylarini hesaplar ve ledger kayitlarini olusturur.',
    schedule: 'Gunluk',
    status: 'active',
  },
  {
    name: 'MentorPayoutProcessJob',
    description: 'Tamamlanan derslerden mentor paylarini hesaplar.',
    schedule: 'Gunluk',
    status: 'active',
  },
  {
    name: 'PaymentReconciliationJob',
    description: 'Odeme saglayicisi ile tutarliligi kontrol eder.',
    schedule: 'Gunluk',
    status: 'idle',
  },
  {
    name: 'CleanupStaleSessionsJob',
    description: 'Eski/bitik video oturumlarini temizler.',
    schedule: 'Her 30 dakika',
    status: 'active',
  },
  {
    name: 'SendUnreadMessageNotificationJob',
    description: '10 dakikadir okunmamis mesajlar icin e-posta bildirimi gonderir.',
    schedule: 'Her 2 dakika',
    status: 'active',
  },
];

function JobCard({ job }: { job: JobInfo }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-mono text-sm font-bold text-gray-800">{job.name}</p>
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
                  job.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                )}
              >
                {job.status === 'active' ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <AlertCircle className="h-3 w-3" />
                )}
                {job.status === 'active' ? 'Aktif' : 'Pasif'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{job.description}</p>
            <div className="flex items-center gap-1 mt-2">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs text-gray-400">{job.schedule}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function JobsPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Cog className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Arka Plan Isleri</h1>
        </div>
        <p className="text-sm text-gray-500">
          Hangfire tarafindan yonetilen periyodik arka plan gorevleri.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {backgroundJobs.map((job) => (
          <JobCard key={job.name} job={job} />
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-500">
          Manuel tetikleme ve detayli is durumu goruntuleme ozelligi yakin zamanda eklenecektir.
          Hangfire Dashboard&apos;a /hangfire yolu ile erisebilirsiniz.
        </p>
      </div>
    </div>
  );
}
