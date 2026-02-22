'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Lock,
  Bell,
  Shield,
  Trash2,
  Upload,
  Check,
  Camera,
  Image as ImageIcon,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { useAuthStore } from '../../../lib/stores/auth-store';
import { userApi, type PresetAvatar } from '../../../lib/api/user';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils/cn';

const profileSchema = z.object({
  displayName: z.string().min(2, 'En az 2 karakter'),
  email: z.string().email('Geçerli email adresi girin'),
  phone: z.string().optional(),
  birthYear: z.coerce.number().min(1950).max(2010).optional().or(z.literal(0).transform(() => undefined)),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(8, 'Mevcut şifrenizi girin'),
  newPassword: z.string().min(8, 'En az 8 karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Şifreler eşlemiyor',
  path: ['confirmPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const tabs = [
  { id: 'profile', name: 'Profil', icon: User },
  { id: 'security', name: 'Güvenlik', icon: Lock },
  { id: 'notifications', name: 'Bildirimler', icon: Bell },
  { id: 'privacy', name: 'Gizlilik', icon: Shield },
];

export default function MentorSettingsPage() {
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const [activeTab, setActiveTab] = useState('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [presetAvatars, setPresetAvatars] = useState<PresetAvatar[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    userApi.getPresetAvatars().then(setPresetAvatars).catch(() => {});
  }, []);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      birthYear: user?.birthYear || undefined,
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const updateProfile = async (data: ProfileForm) => {
    try {
      setIsUpdating(true);
      await userApi.updateProfile({
        displayName: data.displayName,
        phone: data.phone,
        birthYear: data.birthYear,
      });
      toast.success('Profil güncellendi');
      refreshUser?.();
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0] || 'Bir hata oluştu');
    } finally {
      setIsUpdating(false);
    }
  };

  const updatePassword = async (data: PasswordForm) => {
    try {
      setIsUpdating(true);
      await userApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Şifre güncellendi');
      passwordForm.reset();
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0] || 'Bir hata oluştu');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) { toast.error('Dosya boyutu 2MB\'den büyük olamaz'); return; }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) { toast.error('Sadece JPG, PNG, GIF veya WebP yüklenebilir'); return; }
    try {
      setIsUploadingAvatar(true); setSelectedPreset(null);
      await userApi.uploadAvatar(file);
      toast.success('Avatar güncellendi'); refreshUser?.();
    } catch { toast.error('Dosya yüklenirken hata oluştu'); }
    finally { setIsUploadingAvatar(false); }
  };

  const handlePresetSelect = async (presetUrl: string) => {
    try {
      setIsUploadingAvatar(true); setSelectedPreset(presetUrl);
      await userApi.setAvatarUrl(presetUrl);
      toast.success('Avatar güncellendi'); refreshUser?.();
    } catch { toast.error('Avatar güncellenirken hata oluştu'); setSelectedPreset(null); }
    finally { setIsUploadingAvatar(false); }
  };

  const presetUrls = presetAvatars.map(a => a.url);
  const currentAvatarIsPreset = presetUrls.includes(user?.avatarUrl || '');
  const activePreset = selectedPreset || (currentAvatarIsPreset ? user?.avatarUrl : null);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-heading">Ayarlar</h1>
          <p className="text-gray-600">Hesap ayarlarınızı yönetin</p>
        </div>
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={cn('w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                        activeTab === tab.id ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50')}>
                      <tab.icon className="w-5 h-5" /><span>{tab.name}</span>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-3 space-y-6">
            {activeTab === 'profile' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Camera className="w-5 h-5" />Profil Fotoğrafı</CardTitle>
                    <CardDescription>Kendi fotoğrafınızı yükleyin veya önerilen avatarlardan birini seçin</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <Avatar className="w-24 h-24 border-4 border-teal-100">
                          <AvatarImage src={user?.avatarUrl} />
                          <AvatarFallback className="text-3xl bg-teal-50 text-teal-700">{user?.displayName?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
                        </Avatar>
                        {isUploadingAvatar && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                          </div>
                        )}
                      </div>
                      <div>
                        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden"
                          onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); e.target.value = ''; }} />
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploadingAvatar}>
                          <Upload className="w-4 h-4 mr-2" />{isUploadingAvatar ? 'Yükleniyor...' : 'Bilgisayarımdan Yükle'}
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">JPG, PNG, GIF veya WebP. Max 2MB.</p>
                      </div>
                    </div>
                    {presetAvatars.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3"><ImageIcon className="w-4 h-4 text-gray-500" /><h4 className="text-sm font-medium text-gray-700">Önerilen Avatarlar</h4></div>
                        <p className="text-xs text-gray-500 mb-3">Birini seçin, otomatik olarak kaydedilir</p>
                        <div className="flex flex-wrap gap-3">
                          {presetAvatars.map((preset) => {
                            const isActive = activePreset === preset.url;
                            return (
                              <button key={preset.id} onClick={() => handlePresetSelect(preset.url)} disabled={isUploadingAvatar} title={preset.label}
                                className={cn('relative group rounded-full transition-all duration-200',
                                  isActive ? 'ring-3 ring-teal-500 ring-offset-2 scale-110' : 'hover:ring-2 hover:ring-teal-300 hover:ring-offset-1 hover:scale-105',
                                  isUploadingAvatar && 'opacity-50 cursor-not-allowed')}>
                                <Avatar className="w-14 h-14"><AvatarImage src={preset.url} /><AvatarFallback>{preset.label.charAt(0)}</AvatarFallback></Avatar>
                                {isActive && (<div className="absolute -bottom-1 -right-1 bg-teal-500 rounded-full p-0.5"><Check className="w-3 h-3 text-white" /></div>)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Kişisel Bilgiler</CardTitle><CardDescription>Ad, email ve iletişim bilgilerinizi güncelleyin</CardDescription></CardHeader>
                  <CardContent>
                    <form onSubmit={profileForm.handleSubmit(updateProfile)} className="space-y-4">
                      <div><label className="block text-sm font-medium mb-2">İsim Soyisim</label><Input {...profileForm.register('displayName')} />{profileForm.formState.errors.displayName && <p className="text-sm text-red-600 mt-1">{profileForm.formState.errors.displayName.message}</p>}</div>
                      <div><label className="block text-sm font-medium mb-2">Email</label><Input type="email" {...profileForm.register('email')} disabled /><p className="text-xs text-gray-500 mt-1">Email adresi değiştirilemez</p></div>
                      <div><label className="block text-sm font-medium mb-2">Telefon (Opsiyonel)</label><Input type="tel" {...profileForm.register('phone')} /></div>
                      <div><label className="block text-sm font-medium mb-2">Doğum Yılı (Opsiyonel)</label><Input type="number" {...profileForm.register('birthYear')} placeholder="1990" /></div>
                      <Button type="submit" disabled={isUpdating}>{isUpdating ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</Button>
                    </form>
                  </CardContent>
                </Card>
              </>
            )}
            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle>Şifre Değiştir</CardTitle>
                  <CardDescription>Güçlü bir şifre kullanın (en az 8 karakter)</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={passwordForm.handleSubmit(updatePassword)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Mevcut Şifre</label>
                      <div className="relative">
                        <Input type={showCurrentPw ? 'text' : 'password'} {...passwordForm.register('currentPassword')} className="pr-10" />
                        <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.currentPassword && <p className="text-sm text-red-600 mt-1">{passwordForm.formState.errors.currentPassword.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Yeni Şifre</label>
                      <div className="relative">
                        <Input type={showNewPw ? 'text' : 'password'} {...passwordForm.register('newPassword')} className="pr-10" />
                        <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.newPassword && <p className="text-sm text-red-600 mt-1">{passwordForm.formState.errors.newPassword.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Yeni Şifre (Tekrar)</label>
                      <div className="relative">
                        <Input type={showConfirmPw ? 'text' : 'password'} {...passwordForm.register('confirmPassword')} className="pr-10" />
                        <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.confirmPassword && <p className="text-sm text-red-600 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>}
                    </div>
                    <Button type="submit" disabled={isUpdating}>{isUpdating ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}</Button>
                  </form>
                </CardContent>
              </Card>
            )}
            {activeTab === 'notifications' && (
              <Card><CardHeader><CardTitle>Bildirim Tercihleri</CardTitle><CardDescription>Hangi bildirimleri almak istediğinizi seçin</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50"><div><p className="font-medium">Email Bildirimleri</p><p className="text-sm text-gray-600">Yeni mesajlar ve ders hatırlatmaları</p></div><input type="checkbox" defaultChecked className="w-5 h-5" /></label>
                  <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50"><div><p className="font-medium">SMS Bildirimleri</p><p className="text-sm text-gray-600">Sadece acil durumlarda</p></div><input type="checkbox" className="w-5 h-5" /></label>
                  <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50"><div><p className="font-medium">Push Bildirimleri</p><p className="text-sm text-gray-600">Tarayıcı bildirimleri</p></div><input type="checkbox" defaultChecked className="w-5 h-5" /></label>
                  <Button>Tercihleri Kaydet</Button>
                </CardContent>
              </Card>
            )}
            {activeTab === 'privacy' && (
              <>
                <Card><CardHeader><CardTitle>Gizlilik Ayarları</CardTitle><CardDescription>Verilerinizi ve görünürlüğünüzü kontrol edin</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50"><div><p className="font-medium">Profil Görünürlüğü</p><p className="text-sm text-gray-600">Profilinizi herkese göster</p></div><input type="checkbox" defaultChecked className="w-5 h-5" /></label>
                    <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50"><div><p className="font-medium">Aktivite Durumu</p><p className="text-sm text-gray-600">Çevrimiçi durumunuzu göster</p></div><input type="checkbox" defaultChecked className="w-5 h-5" /></label>
                    <Button>Ayarları Kaydet</Button>
                  </CardContent>
                </Card>
                <Card className="border-red-200"><CardHeader><CardTitle className="text-red-600">Tehlikeli Bölge</CardTitle><CardDescription>Kalıcı işlemler - dikkatli olun</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                      <div><p className="font-medium">Hesabı Sil</p><p className="text-sm text-gray-600">Tüm verileriniz kalıcı olarak silinecek</p></div>
                      <Button variant="destructive" size="sm"><Trash2 className="w-4 h-4 mr-2" />Hesabı Sil</Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
