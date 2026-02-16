'use client';

import Link from 'next/link';
import { Shield, BadgeCheck, RotateCcw, Users, CalendarDays, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary-600" />
          Admin Panel
        </h1>
        <Link href="/public">
          <Button variant="ghost">Siteye Dön</Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#227070]" /> Takvim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Tüm randevuları takvim üzerinde görüntüle.</p>
            <Link href="/admin/calendar">
              <Button className="w-full bg-[#227070] hover:bg-[#1a5555]">Takvime Git</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeCheck className="w-5 h-5" /> Doğrulamalar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Bekleyen mentör doğrulamalarını incele.</p>
            <Link href="/admin/verifications">
              <Button className="w-full">Doğrulamalara Git</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" /> İadeler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Bekleyen iade taleplerini yönet.</p>
            <Link href="/admin/refunds">
              <Button className="w-full">İadelere Git</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" /> Kullanıcı Yönetimi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Kullanıcı askıya alma / açma işlemleri.</p>
            <Link href="/admin/users">
              <Button className="w-full">Kullanıcılara Git</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" /> Önerilen Avatarlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Kullanıcılara önerilecek avatarları yönet.</p>
            <Link href="/admin/avatars">
              <Button className="w-full">Avatarlara Git</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
