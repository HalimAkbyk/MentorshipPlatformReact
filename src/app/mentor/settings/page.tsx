'use client';

import { useState, useRef } from 'react';
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
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { useAuthStore } from '../../../lib/stores/auth-store';
import { userApi } from '../../../lib/api/user';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils/cn';

// 10 preset avatar URLs (DiceBear API - free & no copyright)
const PRESET_AVATARS = [
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Jasper&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Luna&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Oscar&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Bailey&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Milo&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Nala&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Shadow&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Tiger&backgroundColor=ffdfbf',
];

const profileSchema = z.object({
  displayName: z.string().min(2, 'En az 2 karakter'),
  email: z.string().email('Gecerli email adresi girin'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(8, 'Mevcut sifrenizi girin'),
  newPassword: z.string().min(8, 'En az 8 karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Sifreler eslemiyor',
  path: ['confirmPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const tabs = [
  { id: 'profile', name: 'Profil', icon: User },
  { id: 'security', name: 'Guvenlik', icon: Lock },
  { id: 'notifications', name: 'Bildirimler', icon: Bell },
  { id: 'privacy', name: 'Gizlilik', icon: Shield },
];

export default function MentorSettingsPage() {
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const [activeTab, setActiveTab] = useState('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      email: user?.email || '',
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
      });
      toast.success('Profil guncellendi');
      refreshUser?.();
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0] || 'Bir hata olustu');
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
      toast.success('Sifre guncellendi');
      passwordForm.reset();
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0] || 'Bir hata olustu');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate file
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Dosya boyutu 2MB\'den buyuk olamaz');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Sadece JPG, PNG, GIF veya WebP dosyalari yuklenebilir');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      setSelectedPreset(null);
      const result = await userApi.uploadAvatar(file);
      toast.success('Avatar guncellendi');
      refreshUser?.();
    } catch (error: any) {
      toast.error('Dosya yuklenirken hata olustu');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePresetSelect = async (presetUrl: string) => {
    try {
      setIsUploadingAvatar(true);
      setSelectedPreset(presetUrl);
      await userApi.setAvatarUrl(presetUrl);
      toast.success('Avatar guncellendi');
      refreshUser?.();
    } catch (error: any) {
      toast.error('Avatar guncellenirken hata olustu');
      setSelectedPreset(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Determine which preset is currently selected (if user's avatar matches one)
  const currentAvatarIsPreset = PRESET_AVATARS.includes(user?.avatarUrl || '');
  const activePreset = selectedPreset || (currentAvatarIsPreset ? user?.avatarUrl : null);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Ayarlar</h1>
          <p className="text-gray-600">Hesap ayarlarinizi yonetin</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <tab.icon className="w-5 h-5" />
                      <span>{tab.name}</span>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <>
                {/* Avatar Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      Profil Fotografi
                    </CardTitle>
                    <CardDescription>
                      Kendi fotografinizi yukleyin veya onerilen avatarlardan birini secin
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Current Avatar & Upload */}
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <Avatar className="w-24 h-24 border-4 border-primary-100">
                          <AvatarImage src={user?.avatarUrl} />
                          <AvatarFallback className="text-3xl bg-primary-50 text-primary-700">
                            {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        {isUploadingAvatar && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                          </div>
                        )}
                      </div>
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                            // Reset input so same file can be selected again
                            e.target.value = '';
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {isUploadingAvatar ? 'Yukleniyor...' : 'Bilgisayarimdan Yukle'}
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                          JPG, PNG, GIF veya WebP. Max 2MB.
                        </p>
                      </div>
                    </div>

                    {/* Preset Avatars */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ImageIcon className="w-4 h-4 text-gray-500" />
                        <h4 className="text-sm font-medium text-gray-700">Onerilen Avatarlar</h4>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        Birini secin, otomatik olarak kaydedilir
                      </p>
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                        {PRESET_AVATARS.map((url, index) => {
                          const isActive = activePreset === url;
                          return (
                            <button
                              key={index}
                              onClick={() => handlePresetSelect(url)}
                              disabled={isUploadingAvatar}
                              className={cn(
                                'relative group rounded-full transition-all duration-200',
                                isActive
                                  ? 'ring-3 ring-primary-500 ring-offset-2 scale-110'
                                  : 'hover:ring-2 hover:ring-primary-300 hover:ring-offset-1 hover:scale-105',
                                isUploadingAvatar && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              <Avatar className="w-14 h-14 sm:w-12 sm:h-12">
                                <AvatarImage src={url} />
                                <AvatarFallback>{index + 1}</AvatarFallback>
                              </Avatar>
                              {isActive && (
                                <div className="absolute -bottom-1 -right-1 bg-primary-500 rounded-full p-0.5">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Personal Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Kisisel Bilgiler</CardTitle>
                    <CardDescription>
                      Ad, email ve iletisim bilgilerinizi guncelleyin
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={profileForm.handleSubmit(updateProfile)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Isim Soyisim
                        </label>
                        <Input {...profileForm.register('displayName')} />
                        {profileForm.formState.errors.displayName && (
                          <p className="text-sm text-red-600 mt-1">
                            {profileForm.formState.errors.displayName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Email
                        </label>
                        <Input type="email" {...profileForm.register('email')} disabled />
                        <p className="text-xs text-gray-500 mt-1">Email adresi degistirilemez</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Telefon (Opsiyonel)
                        </label>
                        <Input type="tel" {...profileForm.register('phone')} />
                      </div>

                      <Button type="submit" disabled={isUpdating}>
                        {isUpdating ? 'Kaydediliyor...' : 'Degisiklikleri Kaydet'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle>Sifre Degistir</CardTitle>
                  <CardDescription>
                    Guclu bir sifre kullanin (en az 8 karakter)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={passwordForm.handleSubmit(updatePassword)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Mevcut Sifre
                      </label>
                      <Input
                        type="password"
                        {...passwordForm.register('currentPassword')}
                      />
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="text-sm text-red-600 mt-1">
                          {passwordForm.formState.errors.currentPassword.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Yeni Sifre
                      </label>
                      <Input
                        type="password"
                        {...passwordForm.register('newPassword')}
                      />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-sm text-red-600 mt-1">
                          {passwordForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Yeni Sifre (Tekrar)
                      </label>
                      <Input
                        type="password"
                        {...passwordForm.register('confirmPassword')}
                      />
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-600 mt-1">
                          {passwordForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? 'Guncelleniyor...' : 'Sifreyi Guncelle'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>Bildirim Tercihleri</CardTitle>
                  <CardDescription>
                    Hangi bildirimleri almak istediginizi secin
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div>
                      <p className="font-medium">Email Bildirimleri</p>
                      <p className="text-sm text-gray-600">
                        Yeni mesajlar ve ders hatirlatmalari
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </label>

                  <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div>
                      <p className="font-medium">SMS Bildirimleri</p>
                      <p className="text-sm text-gray-600">
                        Sadece acil durumlarda
                      </p>
                    </div>
                    <input type="checkbox" className="w-5 h-5" />
                  </label>

                  <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div>
                      <p className="font-medium">Push Bildirimleri</p>
                      <p className="text-sm text-gray-600">
                        Tarayici bildirimleri
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </label>

                  <Button>Tercihleri Kaydet</Button>
                </CardContent>
              </Card>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Gizlilik Ayarlari</CardTitle>
                    <CardDescription>
                      Verilerinizi ve gorunurlugunuzu kontrol edin
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <div>
                        <p className="font-medium">Profil Gorunurlugu</p>
                        <p className="text-sm text-gray-600">
                          Profilinizi herkese goster
                        </p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5" />
                    </label>

                    <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <div>
                        <p className="font-medium">Aktivite Durumu</p>
                        <p className="text-sm text-gray-600">
                          Cevrimici durumunuzu goster
                        </p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5" />
                    </label>

                    <Button>Ayarlari Kaydet</Button>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600">Tehlikeli Bolge</CardTitle>
                    <CardDescription>
                      Kalici islemler - dikkatli olun
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                      <div>
                        <p className="font-medium">Hesabi Sil</p>
                        <p className="text-sm text-gray-600">
                          Tum verileriniz kalici olarak silinecek
                        </p>
                      </div>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hesabi Sil
                      </Button>
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
