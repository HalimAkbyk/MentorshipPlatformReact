'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  Lock, 
  Bell, 
  CreditCard, 
  Shield,
  Trash2,
  Upload
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { useAuthStore } from '../../../lib/stores/auth-store';
import { apiClient } from '../../../lib/api/client';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils/cn';

const profileSchema = z.object({
  displayName: z.string().min(2, 'En az 2 karakter'),
  email: z.string().email('Geçerli email adresi girin'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(8, 'Mevcut şifrenizi girin'),
  newPassword: z.string().min(8, 'En az 8 karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
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

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState('profile');
  const [isUpdating, setIsUpdating] = useState(false);

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
      await apiClient.patch('/me', data);
      toast.success('Profil güncellendi');
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0] || 'Bir hata oluştu');
    } finally {
      setIsUpdating(false);
    }
  };

  const updatePassword = async (data: PasswordForm) => {
    try {
      setIsUpdating(true);
      await apiClient.post('/auth/change-password', {
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

  const uploadAvatar = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await apiClient.postForm('/me/avatar', formData);
      toast.success('Profil fotoğrafı güncellendi');
    } catch (error: any) {
      toast.error('Dosya yüklenirken hata oluştu');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Ayarlar</h1>
          <p className="text-gray-600">Hesap ayarlarınızı yönetin</p>
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
                <Card>
                  <CardHeader>
                    <CardTitle>Profil Fotoğrafı</CardTitle>
                    <CardDescription>
                      Profil fotoğrafınızı güncelleyin
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-6">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={user?.avatarUrl} />
                        <AvatarFallback className="text-3xl">
                          {user?.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="avatar"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadAvatar(file);
                          }}
                        />
                        <label htmlFor="avatar">
                          <Button type="button" variant="outline" asChild>
                            <span className="cursor-pointer">
                              <Upload className="w-4 h-4 mr-2" />
                              Fotoğraf Yükle
                            </span>
                          </Button>
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                          JPG, PNG veya GIF. Max 2MB.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Kişisel Bilgiler</CardTitle>
                    <CardDescription>
                      Ad, email ve iletişim bilgilerinizi güncelleyin
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={profileForm.handleSubmit(updateProfile)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          İsim Soyisim
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
                        <Input type="email" {...profileForm.register('email')} />
                        {profileForm.formState.errors.email && (
                          <p className="text-sm text-red-600 mt-1">
                            {profileForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Telefon (Opsiyonel)
                        </label>
                        <Input type="tel" {...profileForm.register('phone')} />
                      </div>

                      <Button type="submit" disabled={isUpdating}>
                        {isUpdating ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
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
                  <CardTitle>Şifre Değiştir</CardTitle>
                  <CardDescription>
                    Güçlü bir şifre kullanın (en az 8 karakter)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={passwordForm.handleSubmit(updatePassword)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Mevcut Şifre
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
                        Yeni Şifre
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
                        Yeni Şifre (Tekrar)
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
                      {isUpdating ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
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
                    Hangi bildirimleri almak istediğinizi seçin
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div>
                      <p className="font-medium">Email Bildirimleri</p>
                      <p className="text-sm text-gray-600">
                        Yeni mesajlar ve ders hatırlatmaları
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
                        Tarayıcı bildirimleri
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </label>

                  <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div>
                      <p className="font-medium">Pazarlama Bildirimleri</p>
                      <p className="text-sm text-gray-600">
                        Kampanya ve özel teklifler
                      </p>
                    </div>
                    <input type="checkbox" className="w-5 h-5" />
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
                    <CardTitle>Gizlilik Ayarları</CardTitle>
                    <CardDescription>
                      Verilerinizi ve görünürlüğünüzü kontrol edin
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <div>
                        <p className="font-medium">Profil Görünürlüğü</p>
                        <p className="text-sm text-gray-600">
                          Profilinizi herkese göster
                        </p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5" />
                    </label>

                    <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <div>
                        <p className="font-medium">Aktivite Durumu</p>
                        <p className="text-sm text-gray-600">
                          Çevrimiçi durumunuzu göster
                        </p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5" />
                    </label>

                    <Button>Ayarları Kaydet</Button>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600">Tehlikeli Bölge</CardTitle>
                    <CardDescription>
                      Kalıcı işlemler - dikkatli olun
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                      <div>
                        <p className="font-medium">Hesabı Sil</p>
                        <p className="text-sm text-gray-600">
                          Tüm verileriniz kalıcı olarak silinecek
                        </p>
                      </div>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hesabı Sil
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