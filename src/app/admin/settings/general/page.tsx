'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  X,
  Download,
  Loader2,
  Globe,
  Percent,
  Mail,
  MessageSquare,
  CreditCard,
  Gauge,
  Eye,
  EyeOff,
} from 'lucide-react';

import { adminApi, type PlatformSettingDto } from '@/lib/api/admin';
import { ConfirmActionModal } from '@/components/admin/confirm-action-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const categoryConfig: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  General: {
    label: 'Genel Ayarlar',
    icon: Globe,
    description: 'Platform adi, aciklama ve destek bilgileri',
  },
  Fee: {
    label: 'Komisyon Oranlari',
    icon: Percent,
    description: 'Platform ve mentor komisyon yuzdeleri',
  },
  Email: {
    label: 'E-posta (SMTP)',
    icon: Mail,
    description: 'E-posta gonderim sunucu ayarlari',
  },
  SMS: {
    label: 'SMS Ayarlari',
    icon: MessageSquare,
    description: 'SMS bildirim entegrasyonu',
  },
  Payment: {
    label: 'Odeme Ayarlari',
    icon: CreditCard,
    description: 'Odeme saglayici yapilandirmasi',
  },
  Limits: {
    label: 'Limitler',
    icon: Gauge,
    description: 'Sistem limitleri ve varsayilan degerler',
  },
  Dev: {
    label: 'Geliştirme Modu',
    icon: Settings,
    description: 'Geliştirme ve test amaçlı ayarlar',
  },
};

const categoryOrder = ['General', 'Fee', 'Email', 'SMS', 'Payment', 'Limits', 'Dev'];

// Sensitive keys that should be masked by default
const sensitiveKeys = new Set([
  'smtp_password',
  'smtp_username',
  'iyzico_api_key',
  'iyzico_secret_key',
  'twilio_auth_token',
]);

function isBooleanValue(value: string): boolean {
  return value === 'true' || value === 'false';
}

function isNumericValue(value: string): boolean {
  return /^\d+(\.\d+)?$/.test(value);
}

function isPercentageKey(key: string): boolean {
  return key.endsWith('_rate');
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// ---------------------------------------------------------------------------
// Setting Row
// ---------------------------------------------------------------------------

function SettingRow({
  setting,
  onSave,
  isSaving,
}: {
  setting: PlatformSettingDto;
  onSave: (key: string, value: string) => void;
  isSaving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(setting.value);
  const [showSensitive, setShowSensitive] = useState(false);
  const isSensitive = sensitiveKeys.has(setting.key);

  useEffect(() => {
    setEditValue(setting.value);
  }, [setting.value]);

  const handleSave = () => {
    onSave(setting.key, editValue);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditValue(setting.value);
    setEditing(false);
  };

  const handleToggle = () => {
    const newVal = setting.value === 'true' ? 'false' : 'true';
    onSave(setting.key, newVal);
  };

  const displayValue = (() => {
    if (isSensitive && !showSensitive && setting.value) {
      return '••••••••';
    }
    if (isPercentageKey(setting.key) && setting.value) {
      const num = parseFloat(setting.value);
      if (!isNaN(num)) return `%${(num * 100).toFixed(0)}`;
    }
    return setting.value || '-';
  })();

  return (
    <div className="flex items-center justify-between py-4 px-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex items-center gap-2">
          <p className="font-mono text-sm font-bold text-gray-800">{setting.key}</p>
          {isSensitive && (
            <button
              onClick={() => setShowSensitive(!showSensitive)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title={showSensitive ? 'Gizle' : 'Goster'}
            >
              {showSensitive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
        {setting.description && (
          <p className="text-xs text-gray-500 mt-0.5">{setting.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">
          Son guncelleme: {formatDate(setting.updatedAt)}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isBooleanValue(setting.value) && !editing ? (
          // Toggle for boolean values
          <button
            onClick={handleToggle}
            disabled={isSaving}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
              setting.value === 'true' ? 'bg-green-500' : 'bg-gray-300',
              isSaving && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
                setting.value === 'true' ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        ) : editing ? (
          // Inline edit mode
          <div className="flex items-center gap-2">
            {isNumericValue(setting.value) ? (
              <Input
                type="number"
                step={isPercentageKey(setting.key) ? '0.01' : '1'}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-40 h-9 text-sm"
                autoFocus
              />
            ) : (
              <Input
                type={isSensitive ? 'password' : 'text'}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-60 h-9 text-sm"
                autoFocus
              />
            )}
            {isPercentageKey(setting.key) && (
              <span className="text-xs text-gray-400 whitespace-nowrap">
                (orn: 0.07 = %7)
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-9 px-2"
            >
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-9 px-2"
            >
              <X className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        ) : (
          // Display mode
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded">
              {displayValue}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              className="h-9 px-2"
            >
              <Pencil className="h-3.5 w-3.5 text-gray-500" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category Section
// ---------------------------------------------------------------------------

function CategorySection({
  category,
  settings,
  onSave,
  isSaving,
}: {
  category: string;
  settings: PlatformSettingDto[];
  onSave: (key: string, value: string) => void;
  isSaving: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const config = categoryConfig[category] || {
    label: category,
    icon: Settings,
    description: '',
  };
  const Icon = config.icon;

  return (
    <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-50 text-primary-600">
            <Icon className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900">{config.label}</h3>
            {config.description && (
              <p className="text-xs text-gray-500">{config.description}</p>
            )}
          </div>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-2">
            {settings.length} ayar
          </span>
        </div>
        {collapsed ? (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {!collapsed && (
        <div className="border-t border-gray-200">
          {settings.map((setting) => (
            <SettingRow
              key={setting.id}
              setting={setting}
              onSave={onSave}
              isSaving={isSaving}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();

  // Seed modal state
  const [seedModalOpen, setSeedModalOpen] = useState(false);

  // Query
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminApi.getSettings(),
  });

  // Mutation: Update setting
  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      adminApi.updateSetting(key, value),
    onSuccess: () => {
      toast.success('Ayar basariyla guncellendi.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
    onError: () => {
      toast.error('Ayar guncellenirken hata olustu.');
    },
  });

  // Mutation: Seed settings
  const seedMutation = useMutation({
    mutationFn: () => adminApi.seedSettings(),
    onSuccess: () => {
      toast.success('Varsayilan ayarlar basariyla yuklendi.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setSeedModalOpen(false);
    },
    onError: () => {
      toast.error('Ayarlar yuklenirken hata olustu.');
    },
  });

  const handleSave = (key: string, value: string) => {
    updateMutation.mutate({ key, value });
  };

  // Group settings by category
  const grouped = settings.reduce<Record<string, PlatformSettingDto[]>>((acc, s) => {
    const cat = s.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  // Sort categories
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ai = categoryOrder.indexOf(a);
    const bi = categoryOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Platform Ayarlari</h1>
          </div>
          <p className="text-sm text-gray-500">
            Platform genelindeki ayarlari bu sayfadan yonetebilirsiniz. Komisyon oranlari, e-posta, SMS ve limit ayarlarini buradan yapilandirin.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setSeedModalOpen(true)}
        >
          <Download className="h-4 w-4 mr-1.5" />
          Varsayilan Ayarlari Yukle
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Settings grouped by category */}
      {!isLoading && (
        <div className="space-y-6">
          {sortedCategories.map((category) => (
            <CategorySection
              key={category}
              category={category}
              settings={grouped[category]}
              onSave={handleSave}
              isSaving={updateMutation.isPending}
            />
          ))}

          {sortedCategories.length === 0 && (
            <div className="text-center py-20">
              <Settings className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Henuz ayar bulunamadi. Varsayilan ayarlari yukleyerek baslayabilirsiniz.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Seed Confirmation Modal */}
      <ConfirmActionModal
        open={seedModalOpen}
        onClose={() => setSeedModalOpen(false)}
        onConfirm={() => seedMutation.mutate()}
        title="Varsayilan Ayarlari Yukle"
        description="Varsayilan platform ayarlarini yuklemek istediginize emin misiniz? Mevcut ayarlar korunur, yalnizca eksik ayarlar eklenir."
        confirmLabel="Yukle"
        variant="warning"
        isLoading={seedMutation.isPending}
      />
    </div>
  );
}
