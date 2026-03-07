'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Check, X, ExternalLink, Clock, User, GraduationCap, FileText, EyeOff,
  MapPin, BookOpen, Globe, Award, Linkedin, Github, Link2, MessageSquare,
  Send, ChevronRight, Eye, Package, Calendar, Loader2, Search, Shield,
  CheckCircle, AlertCircle, XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { adminApi } from '@/lib/api/admin';
import { toast } from 'sonner';
import type { PendingMentorDto, VerificationDto } from '@/lib/types/admin';

const EDUCATION_MAP: Record<string, string> = {
  'high-school': 'Lise Ogrencisi',
  'university': 'Universite Ogrencisi',
  'graduate': 'Mezun',
  'masters': 'Yuksek Lisans / Doktora',
};

const CATEGORY_MAP: Record<string, string> = {
  matematik: 'Matematik', fizik: 'Fizik', kimya: 'Kimya', biyoloji: 'Biyoloji',
  turkce: 'Turkce & Edebiyat', tarih: 'Tarih & Cografya', ingilizce: 'Ingilizce',
  yazilim: 'Yazilim & Teknoloji', 'genel-kultur': 'Genel Kultur',
};

function safeJsonParse(str: string | null | undefined): string[] {
  if (!str) return [];
  try { return JSON.parse(str); } catch { return []; }
}

export default function AdminVerificationsPage() {
  const { data: mentors, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'pending-mentors'],
    queryFn: () => adminApi.getPendingMentors(),
  });

  const [selectedMentor, setSelectedMentor] = useState<PendingMentorDto | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'listed'>('all');

  // Notification state
  const [showNotifyForm, setShowNotifyForm] = useState(false);
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [sendingNotify, setSendingNotify] = useState(false);

  // Modals
  const [verificationModal, setVerificationModal] = useState<{
    open: boolean; verificationId: string | null; action: 'approve' | 'reject' | null; isProcessing: boolean;
  }>({ open: false, verificationId: null, action: null, isProcessing: false });

  const [publishModal, setPublishModal] = useState<{
    open: boolean; userId: string | null; isProcessing: boolean;
  }>({ open: false, userId: null, isProcessing: false });

  const [unpublishModal, setUnpublishModal] = useState<{
    open: boolean; userId: string | null; isProcessing: boolean;
  }>({ open: false, userId: null, isProcessing: false });

  // Filtering
  const filteredMentors = (mentors || []).filter(m => {
    const matchesSearch = !searchQuery ||
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterTab === 'all' ||
      (filterTab === 'pending' && !m.isListed) ||
      (filterTab === 'listed' && m.isListed);
    return matchesSearch && matchesFilter;
  });

  // Actions
  const confirmVerificationAction = async () => {
    if (!verificationModal.verificationId || !verificationModal.action) return;
    try {
      setVerificationModal(prev => ({ ...prev, isProcessing: true }));
      if (verificationModal.action === 'approve') {
        await adminApi.approveVerification({ verificationId: verificationModal.verificationId, isApproved: true });
        toast.success('Dogrulama onaylandi');
      } else {
        await adminApi.rejectVerification({ verificationId: verificationModal.verificationId, isApproved: false, notes: 'Reddedildi' });
        toast.success('Dogrulama reddedildi');
      }
      const { data: refreshed } = await refetch();
      if (refreshed && selectedMentor) {
        const updated = refreshed.find((m: PendingMentorDto) => m.userId === selectedMentor.userId);
        setSelectedMentor(updated ?? null);
      }
      setVerificationModal({ open: false, verificationId: null, action: null, isProcessing: false });
    } catch {
      toast.error('Islem basarisiz');
      setVerificationModal(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const confirmPublishMentor = async () => {
    if (!publishModal.userId) return;
    try {
      setPublishModal(prev => ({ ...prev, isProcessing: true }));
      await adminApi.publishMentor(publishModal.userId);
      toast.success('Egitmen yayinlandi!');
      const { data: refreshed } = await refetch();
      if (refreshed) {
        const updated = refreshed.find((m: PendingMentorDto) => m.userId === publishModal.userId);
        setSelectedMentor(updated ?? null);
      }
      setPublishModal({ open: false, userId: null, isProcessing: false });
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0] || 'Yayinlama basarisiz');
      setPublishModal(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const confirmUnpublishMentor = async () => {
    if (!unpublishModal.userId) return;
    try {
      setUnpublishModal(prev => ({ ...prev, isProcessing: true }));
      await adminApi.unpublishMentor(unpublishModal.userId);
      toast.success('Egitmen yayindan kaldirildi');
      const { data: refreshed } = await refetch();
      if (refreshed) {
        const updated = refreshed.find((m: PendingMentorDto) => m.userId === unpublishModal.userId);
        setSelectedMentor(updated ?? null);
      }
      setUnpublishModal({ open: false, userId: null, isProcessing: false });
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0] || 'Islem basarisiz');
      setUnpublishModal(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleSendNotification = async () => {
    if (!selectedMentor || !notifyTitle.trim() || !notifyMessage.trim()) return;
    try {
      setSendingNotify(true);
      await adminApi.sendMentorNotification(selectedMentor.userId, notifyTitle.trim(), notifyMessage.trim());
      toast.success('Bildirim gonderildi');
      setNotifyTitle('');
      setNotifyMessage('');
      setShowNotifyForm(false);
    } catch {
      toast.error('Bildirim gonderilemedi');
    } finally {
      setSendingNotify(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Pending': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'Rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved': return <Badge className="bg-green-100 text-green-800 border-green-200">Onayli</Badge>;
      case 'Pending': return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Bekliyor</Badge>;
      case 'Rejected': return <Badge className="bg-red-100 text-red-800 border-red-200">Reddedildi</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReadinessScore = (m: PendingMentorDto) => {
    let score = 0;
    if (m.bio && m.headline) score++;
    if (m.offeringCount > 0) score++;
    if (m.hasAvailability) score++;
    if (m.categories) score++;
    if (m.city || m.university) score++;
    return score;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const pendingCount = (mentors || []).filter(m => !m.isListed).length;
  const listedCount = (mentors || []).filter(m => m.isListed).length;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Egitmen Onaylari</h1>
        <p className="text-sm text-gray-500 mt-1">Basvurulari inceleyin, onaylayin veya duzenleme isteyin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterTab('all')}>
          <CardContent className="py-4 px-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{mentors?.length || 0}</p>
                <p className="text-xs text-gray-500">Toplam</p>
              </div>
              <User className="w-8 h-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${filterTab === 'pending' ? 'ring-2 ring-amber-300' : ''}`} onClick={() => setFilterTab('pending')}>
          <CardContent className="py-4 px-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                <p className="text-xs text-gray-500">Onay Bekliyor</p>
              </div>
              <Clock className="w-8 h-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${filterTab === 'listed' ? 'ring-2 ring-green-300' : ''}`} onClick={() => setFilterTab('listed')}>
          <CardContent className="py-4 px-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{listedCount}</p>
                <p className="text-xs text-gray-500">Yayinda</p>
              </div>
              <Eye className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Isim veya email ile ara..."
          className="pl-10"
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Mentor List */}
        <div className="lg:col-span-2 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {filteredMentors.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Sonuc bulunamadi</p>
            </div>
          ) : (
            filteredMentors.map((mentor) => {
              const readiness = getReadinessScore(mentor);
              const isSelected = selectedMentor?.userId === mentor.userId;
              const pendingVerifs = mentor.verifications.filter(v => v.status === 'Pending').length;
              return (
                <button
                  key={mentor.userId}
                  onClick={() => { setSelectedMentor(mentor); setShowNotifyForm(false); }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-blue-400 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={mentor.avatarUrl || undefined} />
                      <AvatarFallback className="bg-teal-100 text-teal-700 text-sm font-bold">
                        {mentor.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-gray-900 truncate">{mentor.fullName}</p>
                        {mentor.isListed ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] px-1.5 py-0">Yayinda</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0">Bekliyor</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{mentor.email}</p>
                      {mentor.headline && <p className="text-xs text-gray-600 mt-1 truncate">{mentor.headline}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < readiness ? 'bg-teal-500' : 'bg-gray-200'}`} />
                            ))}
                          </div>
                          <span className="text-[10px] text-gray-400">{readiness}/5</span>
                        </div>
                        {pendingVerifs > 0 && (
                          <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> {pendingVerifs} belge
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-1 ${isSelected ? 'text-blue-500' : 'text-gray-300'}`} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right: Detail Panel */}
        <div className="lg:col-span-3">
          {selectedMentor ? (
            <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {/* Header Card */}
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={selectedMentor.avatarUrl || undefined} />
                      <AvatarFallback className="bg-teal-100 text-teal-700 text-xl font-bold">
                        {selectedMentor.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-gray-900">{selectedMentor.fullName}</h2>
                      <p className="text-sm text-gray-500">{selectedMentor.email}</p>
                      {selectedMentor.headline && (
                        <p className="text-sm text-teal-700 mt-1">{selectedMentor.headline}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {selectedMentor.isListed ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">Yayinda</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200">Onay Bekliyor</Badge>
                        )}
                        <span className="text-xs text-gray-400">
                          Kayit: {new Date(selectedMentor.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { icon: Package, label: 'Paket', value: selectedMentor.offeringCount, ok: selectedMentor.offeringCount > 0 },
                      { icon: Calendar, label: 'Takvim', value: selectedMentor.hasAvailability ? 'Var' : 'Yok', ok: selectedMentor.hasAvailability },
                      { icon: Shield, label: 'Belge', value: `${selectedMentor.verifications.filter(v => v.status === 'Approved').length}/${selectedMentor.verifications.length}`, ok: selectedMentor.verifications.some(v => v.status === 'Approved') },
                      { icon: Eye, label: 'Durum', value: selectedMentor.isListed ? 'Yayinda' : 'Bekliyor', ok: selectedMentor.isListed },
                    ].map((stat) => (
                      <div key={stat.label} className={`p-3 rounded-lg text-center ${stat.ok ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-100'}`}>
                        <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.ok ? 'text-green-600' : 'text-gray-400'}`} />
                        <p className={`text-xs font-semibold ${stat.ok ? 'text-green-700' : 'text-gray-500'}`}>{stat.value}</p>
                        <p className="text-[10px] text-gray-400">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Profile Info */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Profil Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedMentor.bio && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Biyografi</p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{selectedMentor.bio}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: MapPin, label: 'Sehir', value: selectedMentor.city },
                      { icon: GraduationCap, label: 'Egitim', value: selectedMentor.educationStatus ? EDUCATION_MAP[selectedMentor.educationStatus] || selectedMentor.educationStatus : null },
                      { icon: GraduationCap, label: 'Universite', value: selectedMentor.university },
                      { icon: FileText, label: 'Bolum', value: selectedMentor.department },
                      { icon: Clock, label: 'Mezuniyet', value: selectedMentor.graduationYear?.toString() },
                      { icon: Award, label: 'Sertifikalar', value: selectedMentor.certifications },
                    ].filter(item => item.value).map((item) => (
                      <div key={item.label} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50">
                        <item.icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">{item.label}</p>
                          <p className="text-sm text-gray-700">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Categories */}
                  {selectedMentor.categories && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1.5">Uzmanlik Alanlari</p>
                      <div className="flex flex-wrap gap-1.5">
                        {safeJsonParse(selectedMentor.categories).map(cat => (
                          <Badge key={cat} variant="outline" className="text-xs bg-teal-50 border-teal-200 text-teal-700">
                            {CATEGORY_MAP[cat] || cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subtopics */}
                  {selectedMentor.subtopics && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1.5">Alt Konular</p>
                      <div className="flex flex-wrap gap-1.5">
                        {safeJsonParse(selectedMentor.subtopics).map(s => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {selectedMentor.languages && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1.5">Diller</p>
                      <div className="flex flex-wrap gap-1.5">
                        {safeJsonParse(selectedMentor.languages).map(l => (
                          <Badge key={l} variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                            <Globe className="w-3 h-3 mr-1" />{l}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social Links */}
                  {(selectedMentor.linkedinUrl || selectedMentor.githubUrl || selectedMentor.portfolioUrl) && (
                    <div className="flex items-center gap-3 pt-2">
                      {selectedMentor.linkedinUrl && (
                        <a href={selectedMentor.linkedinUrl.startsWith('http') ? selectedMentor.linkedinUrl : `https://${selectedMentor.linkedinUrl}`} target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs">
                          <Linkedin className="w-4 h-4" /> LinkedIn
                        </a>
                      )}
                      {selectedMentor.githubUrl && (
                        <a href={selectedMentor.githubUrl.startsWith('http') ? selectedMentor.githubUrl : `https://${selectedMentor.githubUrl}`} target="_blank" rel="noopener noreferrer"
                          className="text-gray-700 hover:text-gray-900 flex items-center gap-1 text-xs">
                          <Github className="w-4 h-4" /> GitHub
                        </a>
                      )}
                      {selectedMentor.portfolioUrl && (
                        <a href={selectedMentor.portfolioUrl.startsWith('http') ? selectedMentor.portfolioUrl : `https://${selectedMentor.portfolioUrl}`} target="_blank" rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-800 flex items-center gap-1 text-xs">
                          <Link2 className="w-4 h-4" /> Portfolyo
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Verifications */}
              {selectedMentor.verifications.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Dogrulama Belgeleri</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedMentor.verifications.map((v) => (
                      <div key={v.id} className="border rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(v.status)}
                            <div>
                              <p className="text-sm font-medium">{v.type === 'University' ? 'Ogrenci Belgesi' : 'Transkript'}</p>
                              <p className="text-[10px] text-gray-400">{new Date(v.submittedAt).toLocaleDateString('tr-TR')}</p>
                            </div>
                          </div>
                          {getStatusBadge(v.status)}
                        </div>
                        {v.documentUrl && (
                          <a href={v.documentUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mb-2">
                            Belgeyi Goruntule <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {v.status === 'Pending' && (
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs"
                              onClick={() => setVerificationModal({ open: true, verificationId: v.id, action: 'approve', isProcessing: false })}>
                              <Check className="w-3.5 h-3.5 mr-1" /> Onayla
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50 text-xs"
                              onClick={() => setVerificationModal({ open: true, verificationId: v.id, action: 'reject', isProcessing: false })}>
                              <X className="w-3.5 h-3.5 mr-1" /> Reddet
                            </Button>
                          </div>
                        )}
                        {v.notes && <p className="text-xs text-gray-500 mt-2 italic">Not: {v.notes}</p>}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Send Notification */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      Egitmene Mesaj Gonder
                    </CardTitle>
                    {!showNotifyForm && (
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowNotifyForm(true)}>
                        <Send className="w-3.5 h-3.5 mr-1" /> Mesaj Yaz
                      </Button>
                    )}
                  </div>
                  <CardDescription className="text-xs">Duzenleme talebi veya bilgilendirme gonderin</CardDescription>
                </CardHeader>
                {showNotifyForm && (
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Baslik</p>
                      <Input
                        value={notifyTitle}
                        onChange={(e) => setNotifyTitle(e.target.value)}
                        placeholder="Orn: Profil bilgilerinizi guncelleyin"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Mesaj</p>
                      <Textarea
                        value={notifyMessage}
                        onChange={(e) => setNotifyMessage(e.target.value)}
                        placeholder="Egitmene iletmek istediginiz mesaji yazin..."
                        rows={3}
                        className="text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleSendNotification}
                        disabled={sendingNotify || !notifyTitle.trim() || !notifyMessage.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-xs"
                      >
                        {sendingNotify ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                        Gonder
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setShowNotifyForm(false); setNotifyTitle(''); setNotifyMessage(''); }}>
                        Iptal
                      </Button>
                      {/* Quick templates */}
                      <div className="ml-auto flex gap-1">
                        {[
                          { label: 'Bio eksik', title: 'Biyografinizi tamamlayin', msg: 'Profilinizin onaylanmasi icin biyografi alaninizi doldurmaniz gerekmektedir. Lutfen ayarlar sayfasindan guncelleyin.' },
                          { label: 'Belge iste', title: 'Dogrulama belgesi gerekli', msg: 'Profilinizin yayinlanmasi icin ogrenci belgesi veya transkript yuklemeniz gerekmektedir.' },
                        ].map(tpl => (
                          <button
                            key={tpl.label}
                            onClick={() => { setNotifyTitle(tpl.title); setNotifyMessage(tpl.msg); }}
                            className="text-[10px] px-2 py-1 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                          >
                            {tpl.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!selectedMentor.isListed && (
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => setPublishModal({ open: true, userId: selectedMentor.userId, isProcessing: false })}
                  >
                    <Check className="w-4 h-4 mr-2" /> Egitmeni Onayla ve Yayinla
                  </Button>
                )}
                {selectedMentor.isListed && (
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => setUnpublishModal({ open: true, userId: selectedMentor.userId, isProcessing: false })}
                  >
                    <EyeOff className="w-4 h-4 mr-2" /> Yayindan Kaldir
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center text-gray-400">
                <User className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Detaylari goruntulemek icin soldan bir egitmen secin</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ConfirmDialog
        open={verificationModal.open}
        onClose={() => !verificationModal.isProcessing && setVerificationModal({ open: false, verificationId: null, action: null, isProcessing: false })}
        onConfirm={confirmVerificationAction}
        title={verificationModal.action === 'approve' ? 'Dogrulama Onayla' : 'Dogrulama Reddet'}
        description={verificationModal.action === 'approve'
          ? 'Bu dogrulama belgesini onaylamak istediginizden emin misiniz?'
          : 'Bu dogrulama belgesini reddetmek istediginizden emin misiniz?'}
        confirmText={verificationModal.action === 'approve' ? 'Onayla' : 'Reddet'}
        cancelText="Iptal"
        variant={verificationModal.action === 'approve' ? 'success' : 'danger'}
        isLoading={verificationModal.isProcessing}
      />
      <ConfirmDialog
        open={publishModal.open}
        onClose={() => !publishModal.isProcessing && setPublishModal({ open: false, userId: null, isProcessing: false })}
        onConfirm={confirmPublishMentor}
        title="Egitmeni Yayinla"
        description="Bu egitmeni yayinlayip listeye eklemek istediginizden emin misiniz? Ogrenciler bu egitmeni gorebilecek."
        confirmText="Evet, Yayinla"
        cancelText="Iptal"
        variant="success"
        isLoading={publishModal.isProcessing}
      />
      <ConfirmDialog
        open={unpublishModal.open}
        onClose={() => !unpublishModal.isProcessing && setUnpublishModal({ open: false, userId: null, isProcessing: false })}
        onConfirm={confirmUnpublishMentor}
        title="Egitmeni Yayindan Kaldir"
        description="Bu egitmeni yayindan kaldirmak istediginizden emin misiniz?"
        confirmText="Evet, Kaldir"
        cancelText="Iptal"
        variant="danger"
        isLoading={unpublishModal.isProcessing}
      />
    </div>
  );
}
