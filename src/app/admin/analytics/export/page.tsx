'use client';

import { useState } from 'react';
import {
  Download,
  Users,
  ShoppingCart,
  CalendarCheck,
  Loader2,
} from 'lucide-react';

import { adminApi } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Export config
// ---------------------------------------------------------------------------

interface ExportItem {
  type: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  filename: string;
}

const exportItems: ExportItem[] = [
  {
    type: 'users',
    title: 'Kullanicilar',
    description: 'Tum kullanici bilgilerini CSV olarak indirir. Isim, e-posta, rol, kayit tarihi vb. alanlar icerir.',
    icon: <Users className="h-8 w-8" />,
    filename: 'kullanicilar.csv',
  },
  {
    type: 'orders',
    title: 'Siparisler',
    description: 'Tum siparis bilgilerini CSV olarak indirir. Tutar, durum, tarih, odeme saglayici vb. alanlar icerir.',
    icon: <ShoppingCart className="h-8 w-8" />,
    filename: 'siparisler.csv',
  },
  {
    type: 'bookings',
    title: 'Rezervasyonlar',
    description: 'Tum rezervasyon bilgilerini CSV olarak indirir. Mentor, ogrenci, tarih, sure, durum vb. alanlar icerir.',
    icon: <CalendarCheck className="h-8 w-8" />,
    filename: 'rezervasyonlar.csv',
  },
];

// ---------------------------------------------------------------------------
// Export Card
// ---------------------------------------------------------------------------

function ExportCard({ item }: { item: ExportItem }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const blob = await adminApi.exportData(item.type);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${item.title} basariyla indirildi.`);
    } catch {
      toast.error(`${item.title} indirilirken hata olustu.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="rounded-xl bg-primary-50 text-primary-600 p-4">
            {item.icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
          </div>
          <Button
            onClick={handleDownload}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Indiriliyor...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-1.5" />
                CSV Indir
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ExportDataPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Download className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Veri Disa Aktarma</h1>
        </div>
        <p className="text-sm text-gray-500">
          Platform verilerini CSV formatinda indirebilirsiniz.
        </p>
      </div>

      {/* Export Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {exportItems.map((item) => (
          <ExportCard key={item.type} item={item} />
        ))}
      </div>
    </div>
  );
}
