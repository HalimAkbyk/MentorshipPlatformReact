'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserX, UserCheck } from 'lucide-react';

import { adminApi } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function AdminUsersPage() {
  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');

  const suspendMutation = useMutation({
    mutationFn: () => adminApi.suspendUser(userId.trim(), reason.trim()),
    onSuccess: () => toast.success('Kullanıcı askıya alındı'),
    onError: (e: any) => toast.error(e?.response?.data?.errors?.[0] || 'Hata oluştu'),
  });

  const unsuspendMutation = useMutation({
    mutationFn: () => adminApi.unsuspendUser(userId.trim()),
    onSuccess: () => toast.success('Kullanıcı askıdan alındı'),
    onError: (e: any) => toast.error(e?.response?.data?.errors?.[0] || 'Hata oluştu'),
  });

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Kullanıcı Yönetimi</h1>

      <Card>
        <CardHeader>
          <CardTitle>Askıya Alma / Açma</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">User Id</label>
            <Input
              placeholder="GUID / user id"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Sebep (askıya alma için)</label>
            <Input
              placeholder="Örn: Kural ihlali"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="destructive"
              onClick={() => {
                if (!userId.trim()) return toast.error('UserId gerekli');
                if (!reason.trim()) return toast.error('Sebep gerekli');
                suspendMutation.mutate();
              }}
              disabled={suspendMutation.isPending || unsuspendMutation.isPending}
            >
              <UserX className="w-4 h-4 mr-2" />
              Askıya Al
            </Button>

            <Button
              onClick={() => {
                if (!userId.trim()) return toast.error('UserId gerekli');
                unsuspendMutation.mutate();
              }}
              disabled={suspendMutation.isPending || unsuspendMutation.isPending}
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Askıdan Al
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
