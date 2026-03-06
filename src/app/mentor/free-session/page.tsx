'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Video, Search, Loader2, Inbox, User, Coins,
} from 'lucide-react';
import { useEligibleStudents, useCreateFreeSession } from '@/lib/hooks/use-free-sessions';

export default function FreeSessionPage() {
  const { data: students, isLoading } = useEligibleStudents();
  const createMutation = useCreateFreeSession();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [note, setNote] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const filtered = (students ?? []).filter((s) =>
    s.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const handleStart = async () => {
    if (!selectedStudentId) return;
    try {
      const result = await createMutation.mutateAsync({
        studentUserId: selectedStudentId,
        note: note.trim() || undefined,
      });
      toast.success('Anlık seans başlatıldı! Öğrenciye bildirim gönderildi.');
      // TODO: redirect to classroom when free-session classroom page is created
      // router.push(`/mentor/free-session/${result.freeSessionId}`);
    } catch {
      // error handled by apiClient
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
          <Video className="w-4 h-4 text-teal-600" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Anlık Seans</h1>
          <p className="text-xs text-gray-500">
            Kredisi olan bir öğrenci seçerek hemen seans başlatın. 1 PrivateLesson kredisi düşülür.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Öğrenci ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-2 mb-6">
          {filtered.map((student) => {
            const isSelected = selectedStudentId === student.studentId;
            return (
              <Card
                key={student.studentId}
                className={`border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-teal-400 bg-teal-50/50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => setSelectedStudentId(isSelected ? null : student.studentId)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={student.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-sm bg-gray-100 text-gray-600">
                      {student.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {student.displayName}
                    </p>
                  </div>
                  <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs">
                    <Coins className="w-3 h-3 mr-1" />
                    {student.remainingCredits} kredi
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border border-dashed border-gray-300">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {search ? 'Sonuç bulunamadı' : 'Uygun öğrenci yok'}
            </h3>
            <p className="text-xs text-gray-500">
              {search
                ? 'Arama kriterlerinize uygun öğrenci bulunamadı.'
                : 'Henüz PrivateLesson kredisi olan öğrenci bulunmuyor.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action area */}
      {selectedStudentId && (
        <div className="sticky bottom-4 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Not (isteğe bağlı)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="text-sm"
              />
            </div>
            <Button
              onClick={handleStart}
              disabled={createMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700 text-white shrink-0"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Video className="w-4 h-4 mr-1" />
              )}
              Seans Başlat
            </Button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            Öğrencinin 1 PrivateLesson kredisi düşülecektir.
          </p>
        </div>
      )}
    </div>
  );
}
