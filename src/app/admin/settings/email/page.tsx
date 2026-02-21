'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Send,
  Server,
  Zap,
  Save,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

import { adminApi, type PlatformSettingDto } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Provider = 'smtp' | 'resend';

interface SettingField {
  key: string;
  label: string;
  placeholder: string;
  sensitive?: boolean;
  type?: 'text' | 'number';
}

const SMTP_FIELDS: SettingField[] = [
  { key: 'smtp_host', label: 'SMTP Sunucu', placeholder: 'smtp.gmail.com' },
  { key: 'smtp_port', label: 'Port', placeholder: '587', type: 'number' },
  { key: 'smtp_username', label: 'Kullanıcı Adı', placeholder: 'your-email@gmail.com', sensitive: true },
  { key: 'smtp_password', label: 'Şifre', placeholder: '••••••••', sensitive: true },
  { key: 'smtp_from_email', label: 'Gönderici E-posta', placeholder: 'noreply@example.com' },
  { key: 'smtp_from_name', label: 'Gönderici Adı', placeholder: 'MentorHub' },
];

const RESEND_FIELDS: SettingField[] = [
  { key: 'resend_api_key', label: 'API Anahtarı', placeholder: 're_xxxxxxxx', sensitive: true },
  { key: 'resend_from_email', label: 'Gönderici E-posta', placeholder: 'noreply@yourdomain.com' },
  { key: 'resend_from_name', label: 'Gönderici Adı', placeholder: 'MentorHub' },
];

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminEmailSettingsPage() {
  const queryClient = useQueryClient();

  // State
  const [provider, setProvider] = useState<Provider>('smtp');
  const [values, setValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [showSensitive, setShowSensitive] = useState<Set<string>>(new Set());
  const [testEmail, setTestEmail] = useState('');

  // Fetch all settings
  const { data: settings = [], isLoading } = useQuery<PlatformSettingDto[]>({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminApi.getSettings(),
  });

  // Initialize values from settings
  useEffect(() => {
    if (settings.length === 0) return;
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }
    setValues(map);
    setProvider((map['email_provider'] || 'smtp') as Provider);
  }, [settings]);

  // Update setting mutation
  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      adminApi.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
  });

  // Test email mutation
  const testMutation = useMutation({
    mutationFn: (email: string) => adminApi.sendTestEmail(email),
    onSuccess: () => {
      toast.success('Test e-postası gönderildi! Gelen kutunuzu kontrol edin.');
    },
    onError: () => {
      toast.error('Test e-postası gönderilemedi. Ayarlarınızı kontrol edin.');
    },
  });

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDirty((prev) => new Set(prev).add(key));
  };

  const handleProviderChange = async (newProvider: Provider) => {
    setProvider(newProvider);
    handleChange('email_provider', newProvider);
    try {
      await updateMutation.mutateAsync({ key: 'email_provider', value: newProvider });
      toast.success(`E-posta sağlayıcı "${newProvider === 'smtp' ? 'Gmail SMTP' : 'Resend'}" olarak değiştirildi`);
    } catch {
      toast.error('Sağlayıcı değiştirilemedi');
    }
  };

  const handleSaveAll = async () => {
    const keys = Array.from(dirty);
    if (keys.length === 0) {
      toast.info('Değişiklik yok');
      return;
    }

    let success = 0;
    let fail = 0;
    for (const key of keys) {
      try {
        await updateMutation.mutateAsync({ key, value: values[key] || '' });
        success++;
      } catch {
        fail++;
      }
    }
    setDirty(new Set());

    if (fail === 0) {
      toast.success(`${success} ayar başarıyla kaydedildi`);
    } else {
      toast.warning(`${success} başarılı, ${fail} hatalı`);
    }
  };

  const toggleSensitive = (key: string) => {
    setShowSensitive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleTestEmail = () => {
    if (!testEmail.trim() || !testEmail.includes('@')) {
      toast.error('Geçerli bir e-posta adresi girin');
      return;
    }
    testMutation.mutate(testEmail);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const renderFields = (fields: SettingField[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {field.label}
          </label>
          <div className="relative">
            <Input
              type={field.sensitive && !showSensitive.has(field.key) ? 'password' : field.type || 'text'}
              value={values[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={cn(
                dirty.has(field.key) && 'ring-2 ring-amber-400 border-amber-400'
              )}
            />
            {field.sensitive && (
              <button
                type="button"
                onClick={() => toggleSensitive(field.key)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSensitive.has(field.key) ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">E-posta Ayarları</h1>
        </div>
        <p className="text-sm text-gray-500">
          E-posta sağlayıcı seçimi, SMTP/Resend yapılandırması ve test e-postası
        </p>
      </div>

      {/* Provider Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">E-posta Sağlayıcı</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* SMTP Card */}
          <button
            onClick={() => handleProviderChange('smtp')}
            className={cn(
              'relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left',
              provider === 'smtp'
                ? 'border-primary-500 bg-primary-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            <div className={cn(
              'p-2.5 rounded-lg',
              provider === 'smtp' ? 'bg-primary-100' : 'bg-gray-100'
            )}>
              <Server className={cn('h-6 w-6', provider === 'smtp' ? 'text-primary-600' : 'text-gray-500')} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">Gmail SMTP</span>
                {provider === 'smtp' && <CheckCircle className="h-4 w-4 text-primary-600" />}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Gmail App Password ile SMTP üzerinden gönderim. Günlük 500 mail limiti.
              </p>
            </div>
          </button>

          {/* Resend Card */}
          <button
            onClick={() => handleProviderChange('resend')}
            className={cn(
              'relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left',
              provider === 'resend'
                ? 'border-primary-500 bg-primary-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            <div className={cn(
              'p-2.5 rounded-lg',
              provider === 'resend' ? 'bg-primary-100' : 'bg-gray-100'
            )}>
              <Zap className={cn('h-6 w-6', provider === 'resend' ? 'text-primary-600' : 'text-gray-500')} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">Resend</span>
                {provider === 'resend' && <CheckCircle className="h-4 w-4 text-primary-600" />}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Modern API tabanlı gönderim. Aylık 3000 ücretsiz mail.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* SMTP Settings */}
      <div className={cn(
        'bg-white rounded-xl border border-gray-200 p-6 mb-6 transition-all',
        provider !== 'smtp' && 'opacity-50 pointer-events-none'
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">SMTP Ayarları</h2>
          </div>
          {provider === 'smtp' && (
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
              Aktif
            </span>
          )}
        </div>
        {renderFields(SMTP_FIELDS)}
      </div>

      {/* Resend Settings */}
      <div className={cn(
        'bg-white rounded-xl border border-gray-200 p-6 mb-6 transition-all',
        provider !== 'resend' && 'opacity-50 pointer-events-none'
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Resend Ayarları</h2>
          </div>
          {provider === 'resend' && (
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
              Aktif
            </span>
          )}
        </div>
        {renderFields(RESEND_FIELDS)}
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Not:</strong> Resend kullanmak için{' '}
            <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline">
              resend.com
            </a>
            {' '}üzerinden hesap oluşturup API anahtarı almanız gerekir.
            Gönderici e-posta adresi için domain doğrulaması yapmanız önerilir.
          </p>
        </div>
      </div>

      {/* Save Button */}
      {dirty.size > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">
              {dirty.size} ayar değiştirildi, kaydetmeyi unutmayın.
            </span>
          </div>
          <Button onClick={handleSaveAll} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Kaydet
          </Button>
        </div>
      )}

      {/* Test Email */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Send className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Test E-postası</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Aktif sağlayıcı ({provider === 'smtp' ? 'Gmail SMTP' : 'Resend'}) üzerinden
          test e-postası göndererek ayarların doğru yapılandırıldığını kontrol edin.
        </p>
        <div className="flex gap-3">
          <Input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@example.com"
            className="max-w-sm"
          />
          <Button
            onClick={handleTestEmail}
            disabled={testMutation.isPending || !testEmail.trim()}
          >
            {testMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Gönder
          </Button>
        </div>
      </div>
    </div>
  );
}
