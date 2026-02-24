'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Flag, RotateCcw, CheckCircle, AlertTriangle,
  Shield, Filter, Users, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { adminAvatarApi, type UserAvatarInfo } from '@/lib/api/user';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

type FilterMode = 'all' | 'flagged' | 'with-avatar';

export default function AdminAvatarModerationPage() {
  const [users, setUsers] = useState<UserAvatarInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('with-avatar');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const flaggedOnly = filter === 'flagged';
      const withAvatarOnly = filter === 'with-avatar';
      const data = await adminAvatarApi.getUserAvatars(flaggedOnly, withAvatarOnly);
      setUsers(data);
    } catch {
      toast.error('Kullanici avatarlari yuklenirken hata olustu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [filter]);

  const handleFlag = async (userId: string) => {
    try {
      setProcessingId(userId);
      await adminAvatarApi.flagAvatar(userId);
      toast.success('Avatar uygunsuz olarak isaretlendi');
      fetchUsers();
    } catch {
      toast.error('Islem basarisiz');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUnflag = async (userId: string) => {
    try {
      setProcessingId(userId);
      await adminAvatarApi.unflagAvatar(userId);
      toast.success('Avatar isareti kaldirildi');
      fetchUsers();
    } catch {
      toast.error('Islem basarisiz');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReset = async (userId: string, displayName: string) => {
    if (!confirm(`${displayName} kullanicisinin avatarini sifirlamak istediginizden emin misiniz? Avatar kaldirilacak.`)) return;
    try {
      setProcessingId(userId);
      await adminAvatarApi.resetAvatar(userId);
      toast.success('Avatar sifirlandi');
      fetchUsers();
    } catch {
      toast.error('Islem basarisiz');
    } finally {
      setProcessingId(null);
    }
  };

  const flaggedCount = users.filter(u => u.isFlagged).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Geri</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-teal-600" />
              Avatar Moderasyon
            </h1>
            <p className="text-sm text-gray-500">Kullanici avatarlarini incele, uygunsuz olanlari isaretleyip kaldirabilirsin</p>
          </div>
        </div>
        {flaggedCount > 0 && (
          <Badge variant="destructive" className="text-sm px-3 py-1">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            {flaggedCount} isaretli
          </Badge>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { id: 'with-avatar' as FilterMode, label: 'Avatarli Kullanicilar', icon: Eye },
          { id: 'flagged' as FilterMode, label: 'Isaretlenenler', icon: AlertTriangle },
          { id: 'all' as FilterMode, label: 'Tum Kullanicilar', icon: Users },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm transition-all',
              filter === f.id
                ? 'border-teal-300 bg-teal-50 text-teal-700 font-medium'
                : 'border-gray-200 text-gray-600 hover:border-teal-200'
            )}
          >
            <f.icon className="w-4 h-4" />
            {f.label}
          </button>
        ))}
      </div>

      {/* User Avatar List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      ) : users.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {filter === 'flagged' ? 'Isaretlenmis avatar yok - temiz!' : 'Gosterilecek kullanici yok'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {users.map((user) => (
            <Card key={user.userId} className={cn('border-0 shadow-sm transition-all', user.isFlagged && 'border-l-4 border-l-red-400 bg-red-50/30')}>
              <CardContent className="flex items-center gap-4 py-4">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="w-16 h-16 border-2 border-gray-200">
                    <AvatarImage src={user.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-lg bg-gray-100 text-gray-500">
                      {user.displayName?.charAt(0)?.toUpperCase() ?? '?'}
                    </AvatarFallback>
                  </Avatar>
                  {user.isFlagged && (
                    <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5">
                      <AlertTriangle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{user.displayName}</span>
                    {user.isFlagged && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Uygunsuz</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {user.roles.map(role => (
                      <Badge key={role} variant="outline" className="text-[10px] px-1.5 py-0">
                        {role}
                      </Badge>
                    ))}
                    {!user.avatarUrl && (
                      <span className="text-[10px] text-gray-400 italic">Avatar yok</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  {user.avatarUrl && (
                    <>
                      {user.isFlagged ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnflag(user.userId)}
                          disabled={processingId === user.userId}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Isareti Kaldir
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFlag(user.userId)}
                          disabled={processingId === user.userId}
                          className="text-amber-600 border-amber-200 hover:bg-amber-50"
                        >
                          <Flag className="w-4 h-4 mr-1" />
                          Isaretle
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReset(user.userId, user.displayName)}
                        disabled={processingId === user.userId}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Sifirla
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
