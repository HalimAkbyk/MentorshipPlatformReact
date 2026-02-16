'use client';

import { DollarSign, TrendingUp, Clock, Download } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { formatCurrency } from '../../../lib/utils/format';

export default function EarningsPage() {
  // TODO: Fetch earnings data from API
  const totalEarnings = 0;
  const availableBalance = 0;
  const pendingBalance = 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold font-heading">Kazançlarım</h1>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Rapor İndir
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kazanç</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEarnings)}</div>
            <p className="text-xs text-gray-600">Tüm zamanlar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kullanılabilir Bakiye</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(availableBalance)}</div>
            <p className="text-xs text-gray-600">Çekilebilir</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingBalance)}</div>
            <p className="text-xs text-gray-600">24 saat içinde</p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Section */}
      <Card>
        <CardHeader>
          <CardTitle>Ödeme Çekme</CardTitle>
          <CardDescription>
            Kazancınızı IBAN numaranıza çekin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p className="mb-4">Henüz çekilebilir bakiye yok</p>
            <Button disabled>Ödeme Çek</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}