'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, X, ExternalLink, Clock, User, GraduationCap, DollarSign, FileText, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { adminApi } from '@/lib/api/admin';
import { toast } from 'sonner';
import type { PendingMentorDto, VerificationDto } from '@/lib/types/admin';

export default function AdminVerificationsPage() {
  const { data: mentors, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'pending-mentors'],
    queryFn: () => adminApi.getPendingMentors(),
  });

  const [selectedMentor, setSelectedMentor] = useState<PendingMentorDto | null>(null);
  
  const [verificationModal, setVerificationModal] = useState<{
    open: boolean;
    verificationId: string | null;
    action: 'approve' | 'reject' | null;
    isProcessing: boolean;
  }>({
    open: false,
    verificationId: null,
    action: null,
    isProcessing: false,
  });

  const [publishModal, setPublishModal] = useState<{
    open: boolean;
    userId: string | null;
    isProcessing: boolean;
  }>({
    open: false,
    userId: null,
    isProcessing: false,
  });

  const [unpublishModal, setUnpublishModal] = useState<{
    open: boolean;
    userId: string | null;
    isProcessing: boolean;
  }>({
    open: false,
    userId: null,
    isProcessing: false,
  });

  const handleApproveVerification = (verificationId: string) => {
    setVerificationModal({ open: true, verificationId, action: 'approve', isProcessing: false });
  };

  const handleRejectVerification = (verificationId: string) => {
    setVerificationModal({ open: true, verificationId, action: 'reject', isProcessing: false });
  };

  const confirmVerificationAction = async () => {
    if (!verificationModal.verificationId || !verificationModal.action) return;

    try {
      setVerificationModal(prev => ({ ...prev, isProcessing: true }));

      if (verificationModal.action === 'approve') {
        await adminApi.approveVerification({ 
          verificationId: verificationModal.verificationId,
          isApproved: true  // ✅ isApproved eklendi
        });
        toast.success('Doğrulama onaylandı');
      } else {
        await adminApi.rejectVerification({ 
          verificationId: verificationModal.verificationId,
          isApproved: false,  // ✅ isApproved eklendi
          notes: 'Reddedildi' 
        });
        toast.success('Doğrulama reddedildi');
      }

      await refetch();
      setVerificationModal({ open: false, verificationId: null, action: null, isProcessing: false });
    } catch (error: any) {
      toast.error('İşlem başarısız');
      setVerificationModal(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handlePublishMentor = (userId: string) => {
    setPublishModal({ open: true, userId, isProcessing: false });
  };

  const confirmPublishMentor = async () => {
    if (!publishModal.userId) return;

    try {
      setPublishModal(prev => ({ ...prev, isProcessing: true }));
      await adminApi.publishMentor(publishModal.userId);
      toast.success('Mentor yayınlandı ve listeye eklendi!');
      await refetch();
      setPublishModal({ open: false, userId: null, isProcessing: false });
      setSelectedMentor(null);
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0] || 'Yayınlama başarısız');
      setPublishModal(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleUnpublishMentor = (userId: string) => {
    setUnpublishModal({ open: true, userId, isProcessing: false });
  };

  const confirmUnpublishMentor = async () => {
    if (!unpublishModal.userId) return;

    try {
      setUnpublishModal(prev => ({ ...prev, isProcessing: true }));
      await adminApi.unpublishMentor(unpublishModal.userId);
      toast.success('Mentor yayından kaldırıldı');
      await refetch();
      setUnpublishModal({ open: false, userId: null, isProcessing: false });
      setSelectedMentor(null);
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0] || 'İşlem başarısız');
      setUnpublishModal(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">✓ Onaylı</span>;
      case 'Pending':
        return <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">⏳ Bekliyor</span>;
      case 'Rejected':
        return <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">✕ Reddedildi</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">{status}</span>;
    }
  };

  const hasApprovedVerification = (verifications: VerificationDto[]) => {
    return verifications.some(v => v.status === 'Approved');
  };

  const canPublishMentor = (mentor: PendingMentorDto) => {
    return hasApprovedVerification(mentor.verifications) && !mentor.isListed;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Doğrulamalar</h1>
        <p className="text-gray-600">Mentor başvurularını inceleyin ve yayınlayın</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Mentors List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Başvurular ({mentors?.length || 0})</CardTitle>
            <CardDescription>Onay bekleyen mentörler</CardDescription>
          </CardHeader>
          <CardContent>
            {mentors && mentors.length > 0 ? (
              <div className="space-y-2">
                {mentors.map((mentor) => (
                  <button
                    key={mentor.userId}
                    onClick={() => setSelectedMentor(mentor)}
                    className={`w-full text-left p-3 rounded border hover:bg-gray-50 transition-colors ${
                      selectedMentor?.userId === mentor.userId ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                  >
                    <div className="font-medium">{mentor.fullName}</div>
                    <div className="text-sm text-gray-600">{mentor.university}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {mentor.isListed ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          ✓ Yayında
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                          ⏳ Bekliyor
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {mentor.verifications.filter(v => v.status === 'Pending').length} bekliyor
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Onay bekleyen mentor yok</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mentor Details */}
        {selectedMentor && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{selectedMentor.fullName}</CardTitle>
              <CardDescription>{selectedMentor.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Üniversite</div>
                      <div className="text-sm text-gray-600">{selectedMentor.university || '-'}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Bölüm</div>
                      <div className="text-sm text-gray-600">{selectedMentor.department || '-'}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Mezuniyet Yılı</div>
                      <div className="text-sm text-gray-600">{selectedMentor.graduationYear || '-'}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Saat Ücreti</div>
                      <div className="text-sm text-gray-600">
                        {selectedMentor.hourlyRate ? `₺${selectedMentor.hourlyRate}` : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedMentor.headline && (
                <div>
                  <div className="text-sm font-medium mb-1">Başlık</div>
                  <div className="text-sm text-gray-600">{selectedMentor.headline}</div>
                </div>
              )}

              {selectedMentor.bio && (
                <div>
                  <div className="text-sm font-medium mb-1">Biyografi</div>
                  <div className="text-sm text-gray-600">{selectedMentor.bio}</div>
                </div>
              )}

              {/* Verifications */}
              <div>
                <h3 className="font-semibold mb-3">Doğrulama Belgeleri</h3>
                <div className="space-y-3">
                  {selectedMentor.verifications.map((v) => (
                    <div key={v.id} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium text-sm">
                            {v.type === 'University' ? 'Öğrenci Belgesi' : 'Transkript'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(v.submittedAt).toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                        {getStatusBadge(v.status)}
                      </div>
                      {v.documentUrl && (
                        <a
                          href={v.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          Belgeyi Görüntüle <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {v.status === 'Pending' && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveVerification(v.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Onayla
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectVerification(v.id)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reddet
                          </Button>
                        </div>
                      )}
                      {v.notes && (
                        <div className="text-xs text-gray-600 mt-2 italic">Not: {v.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Publish Mentor Button */}
              {canPublishMentor(selectedMentor) && (
                <div className="border-t pt-4">
                  <Button
                    onClick={() => handlePublishMentor(selectedMentor.userId)}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Mentor'u Yayınla
                  </Button>
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    Bu işlem mentor'u öğrencilere görünür hale getirir
                  </p>
                </div>
              )}

              {selectedMentor.isListed && (
                <div className="border-t pt-4 space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
                    <Check className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-green-900">Mentor Yayında</div>
                    <div className="text-xs text-green-700">Öğrenciler bu mentor'u görebilir</div>
                  </div>
                  <Button
                    onClick={() => handleUnpublishMentor(selectedMentor.userId)}
                    variant="outline"
                    className="w-full text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <EyeOff className="w-4 h-4 mr-2" />
                    Yayından Kaldır
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!selectedMentor && mentors && mentors.length > 0 && (
          <Card className="lg:col-span-2">
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <User className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p>Detayları görüntülemek için soldan bir mentor seçin</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Verification Action Modal */}
      <ConfirmDialog
        open={verificationModal.open}
        onClose={() => !verificationModal.isProcessing && setVerificationModal({ open: false, verificationId: null, action: null, isProcessing: false })}
        onConfirm={confirmVerificationAction}
        title={verificationModal.action === 'approve' ? 'Doğrulama Onayla' : 'Doğrulama Reddet'}
        description={
          verificationModal.action === 'approve'
            ? 'Bu doğrulama belgesini onaylamak istediğinizden emin misiniz?'
            : 'Bu doğrulama belgesini reddetmek istediğinizden emin misiniz?'
        }
        confirmText={verificationModal.action === 'approve' ? 'Onayla' : 'Reddet'}
        cancelText="İptal"
        variant={verificationModal.action === 'approve' ? 'success' : 'danger'}
        isLoading={verificationModal.isProcessing}
      />

      {/* Publish Mentor Modal */}
      <ConfirmDialog
        open={publishModal.open}
        onClose={() => !publishModal.isProcessing && setPublishModal({ open: false, userId: null, isProcessing: false })}
        onConfirm={confirmPublishMentor}
        title="Mentor'u Yayınla"
        description="Bu mentor'u yayınlayıp listeye eklemek istediğinizden emin misiniz? Mentor öğrencilere görünür olacak."
        confirmText="Evet, Yayınla"
        cancelText="İptal"
        variant="success"
        isLoading={publishModal.isProcessing}
      />

      {/* Unpublish Mentor Modal */}
      <ConfirmDialog
        open={unpublishModal.open}
        onClose={() => !unpublishModal.isProcessing && setUnpublishModal({ open: false, userId: null, isProcessing: false })}
        onConfirm={confirmUnpublishMentor}
        title="Mentor'u Yayından Kaldır"
        description="Bu mentor'u yayından kaldırmak istediğinizden emin misiniz? Mentor öğrencilere görünmez olacak."
        confirmText="Evet, Kaldır"
        cancelText="İptal"
        variant="danger"
        isLoading={unpublishModal.isProcessing}
      />
    </div>
  );
}