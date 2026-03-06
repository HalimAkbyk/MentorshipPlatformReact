'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Package,
  BookOpen,
  Users,
  PlayCircle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/format';
import { packagesApi, type PackageDto } from '@/lib/api/packages';
import { FeatureGate } from '@/components/feature-gate';

function PackagesContent() {
  const { data: packages, isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: () => packagesApi.getAll(),
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
          <Package className="w-6 h-6 text-teal-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Egitim Paketleri</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Ihtiyaciniza uygun paketi secin, kredi kazanin ve egitimlerinize hemen baslayin.
        </p>
      </div>

      {/* Package Cards */}
      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-5 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-8 bg-gray-200 rounded w-1/3" />
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded" />
                    <div className="h-3 bg-gray-100 rounded" />
                    <div className="h-3 bg-gray-100 rounded" />
                  </div>
                  <div className="h-10 bg-gray-200 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : packages && packages.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-6">
          {packages.map((pkg: PackageDto, idx: number) => (
            <Card
              key={pkg.id}
              className={`border-0 shadow-sm hover:shadow-md transition-shadow relative ${
                idx === 1 ? 'ring-2 ring-teal-500' : ''
              }`}
            >
              {idx === 1 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-teal-500 text-white text-[10px] px-3">Populer</Badge>
                </div>
              )}
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{pkg.name}</h3>
                {pkg.description && (
                  <p className="text-xs text-gray-500 mb-4">{pkg.description}</p>
                )}

                <div className="mb-5">
                  <span className="text-3xl font-bold text-gray-900">{formatCurrency(pkg.price)}</span>
                  {pkg.validityDays && (
                    <span className="text-xs text-gray-400 ml-1">/ {pkg.validityDays} gun</span>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  {pkg.privateLessonCredits > 0 && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                      <BookOpen className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700">
                        <strong>{pkg.privateLessonCredits}</strong> Bire Bir Ders kredisi
                      </span>
                    </div>
                  )}
                  {pkg.groupLessonCredits > 0 && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                      <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700">
                        <strong>{pkg.groupLessonCredits}</strong> Grup Dersi kredisi
                      </span>
                    </div>
                  )}
                  {pkg.videoAccessCredits > 0 && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                      <PlayCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700">
                        <strong>{pkg.videoAccessCredits}</strong> Video Erisim kredisi
                      </span>
                    </div>
                  )}
                </div>

                <Button className="w-full gap-2" variant={idx === 1 ? 'default' : 'outline'}>
                  Satin Al
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Henuz paket bulunmuyor</h3>
          <p className="text-sm text-gray-500">Paketler yakin zamanda eklenecektir.</p>
        </div>
      )}
    </div>
  );
}

export default function PackagesPage() {
  return (
    <FeatureGate flag="PACKAGE_SYSTEM_ENABLED" fallbackMessage="Paket sistemi gecici olarak devre disi birakilmistir.">
      <PackagesContent />
    </FeatureGate>
  );
}
