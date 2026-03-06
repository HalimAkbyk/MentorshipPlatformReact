'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  BookOpen,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils/format';
import type { SessionRequestDto } from '@/lib/api/session-requests';

interface SessionRequestCardProps {
  request: SessionRequestDto;
  role: 'student' | 'mentor' | 'admin';
  onApprove?: (id: string) => Promise<void>;
  onReject?: (id: string, reason?: string) => Promise<void>;
  isApproving?: boolean;
  isRejecting?: boolean;
}

function getStatusBadge(status: string) {
  const cls = 'text-[10px] px-1.5 py-0';
  switch (status) {
    case 'Pending':
      return (
        <Badge className={`bg-yellow-100 text-yellow-700 border-yellow-200 ${cls}`}>
          Beklemede
        </Badge>
      );
    case 'Approved':
      return (
        <Badge className={`bg-green-100 text-green-700 border-green-200 ${cls}`}>
          Onaylandı
        </Badge>
      );
    case 'Rejected':
      return (
        <Badge className={`bg-red-100 text-red-700 border-red-200 ${cls}`}>
          Reddedildi
        </Badge>
      );
    case 'Expired':
      return (
        <Badge className={`bg-gray-100 text-gray-500 border-gray-200 ${cls}`}>
          Suresi Doldu
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={cls}>
          {status}
        </Badge>
      );
  }
}

export function SessionRequestCard({
  request,
  role,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
}: SessionRequestCardProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const isPending = request.status === 'Pending';
  const canAction = (role === 'mentor' || role === 'admin') && isPending;

  const handleReject = async () => {
    if (onReject) {
      await onReject(request.id, rejectReason || undefined);
      setShowRejectForm(false);
      setRejectReason('');
    }
  };

  // Determine which person info to show based on role
  const personName = role === 'student' ? request.mentorName : request.studentName;
  const personAvatar = role === 'student' ? request.mentorAvatar : request.studentAvatar;
  const personLabel = role === 'student' ? 'Egitmen' : 'Ogrenci';

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Avatar className="w-10 h-10 rounded-xl shrink-0">
              <AvatarImage src={personAvatar ?? undefined} />
              <AvatarFallback className="rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-sm">
                {personName?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-sm text-gray-900">{personName}</span>
                {getStatusBadge(request.status)}
              </div>

              <p className="text-[10px] text-gray-400">{personLabel}</p>

              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <BookOpen className="w-3 h-3 shrink-0" />
                <span className="truncate">{request.offeringTitle}</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(request.requestedStartAt, 'dd MMM yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(request.requestedStartAt)} ({request.durationMin} dk)
                </span>
              </div>

              {request.studentNote && (
                <div className="flex items-start gap-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mt-1">
                  <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{request.studentNote}</span>
                </div>
              )}

              {request.status === 'Rejected' && request.rejectionReason && (
                <div className="flex items-start gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg p-2 mt-1">
                  <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">Ret sebebi: {request.rejectionReason}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {canAction && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
            <Button
              size="sm"
              className="text-xs bg-green-600 hover:bg-green-700"
              disabled={isApproving || isRejecting}
              onClick={() => onApprove?.(request.id)}
            >
              {isApproving ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
              )}
              Onayla
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs text-red-600 border-red-200 hover:bg-red-50"
              disabled={isApproving || isRejecting}
              onClick={() => setShowRejectForm(!showRejectForm)}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              Reddet
            </Button>
          </div>
        )}

        {/* Reject Form */}
        {showRejectForm && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 space-y-2">
            <Textarea
              placeholder="Ret sebebi (istege bagli)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="text-sm min-h-[60px] resize-none"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                className="text-xs"
                disabled={isRejecting}
                onClick={handleReject}
              >
                {isRejecting ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : null}
                Reddet
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectReason('');
                }}
              >
                Vazgec
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
