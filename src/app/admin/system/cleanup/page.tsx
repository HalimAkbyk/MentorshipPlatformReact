'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import {
  AlertTriangle,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Database,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type CleanupResult = {
  success: boolean;
  message: string;
  adminUsersKept: number;
  deletedRows: Record<string, number>;
};

export default function CleanupPage() {
  const [confirmText, setConfirmText] = useState('');
  const [result, setResult] = useState<CleanupResult | null>(null);

  const mutation = useMutation({
    mutationFn: () => adminApi.cleanupDatabase(),
    onSuccess: (data) => {
      setResult(data);
      setConfirmText('');
    },
  });

  const isConfirmed = confirmText === 'TEMIZLE';
  const totalDeleted = result
    ? Object.values(result.deletedRows).reduce((sum, n) => sum + n, 0)
    : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Veritabani Temizligi</h1>
        <p className="text-slate-400 mt-1">
          Admin kullanicilari ve sistem verileri haric tum kullanici verilerini siler.
        </p>
      </div>

      {/* Warning Card */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold text-red-300">Dikkat — Bu islem geri alinamaz!</h2>
            <ul className="mt-3 space-y-2 text-sm text-red-200/80">
              <li className="flex items-start gap-2">
                <Trash2 className="h-4 w-4 mt-0.5 shrink-0" />
                Tum ogrenci ve egitmen kullanicilari silinir
              </li>
              <li className="flex items-start gap-2">
                <Trash2 className="h-4 w-4 mt-0.5 shrink-0" />
                Rezervasyonlar, siparisler, odemeler, mesajlar silinir
              </li>
              <li className="flex items-start gap-2">
                <Trash2 className="h-4 w-4 mt-0.5 shrink-0" />
                Kurslar, grup dersleri, kayitlar silinir
              </li>
              <li className="flex items-start gap-2">
                <Trash2 className="h-4 w-4 mt-0.5 shrink-0" />
                Kredi, performans ve hakedis verileri silinir
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Preserved Data Card */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <ShieldAlert className="h-6 w-6 text-green-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold text-green-300">Korunan Veriler</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-green-200/80">
              <li>Admin kullanicilari</li>
              <li>Feature Flags (ozellik bayraklari)</li>
              <li>Kategoriler (TYT/AYT)</li>
              <li>Paket tanimlari</li>
              <li>Platform ayarlari</li>
              <li>CMS icerikleri (banner, duyuru, statik sayfalar)</li>
              <li>Bildirim sablonlari</li>
              <li>Hakedis parametreleri</li>
              <li>Preset avatarlar</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmation Input */}
      {!result && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Onaylamak icin <code className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">TEMIZLE</code> yazin
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="TEMIZLE"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
              disabled={mutation.isPending}
            />
          </div>

          <button
            onClick={() => mutation.mutate()}
            disabled={!isConfirmed || mutation.isPending}
            className={cn(
              'w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all',
              isConfirmed && !mutation.isPending
                ? 'bg-red-600 hover:bg-red-500 text-white cursor-pointer'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            )}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Temizleniyor...
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                Veritabanini Temizle
              </>
            )}
          </button>

          {mutation.isError && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
              Hata: {(mutation.error as Error)?.message || 'Bilinmeyen hata'}
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-400" />
            <div>
              <h3 className="text-lg font-semibold text-green-300">Temizlik Tamamlandi</h3>
              <p className="text-sm text-slate-400">{result.message}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-lime-400">{result.adminUsersKept}</div>
              <div className="text-xs text-slate-500">Admin Korundu</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{totalDeleted}</div>
              <div className="text-xs text-slate-500">Toplam Silinen Satir</div>
            </div>
          </div>

          {/* Detailed table */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Tablo Bazli Detay</h4>
            <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-900 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-slate-400 font-medium">Tablo</th>
                    <th className="text-right px-3 py-2 text-slate-400 font-medium">Silinen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {Object.entries(result.deletedRows)
                    .filter(([, count]) => count > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([table, count]) => (
                      <tr key={table} className="hover:bg-slate-800/50">
                        <td className="px-3 py-1.5 text-slate-300 font-mono text-xs">{table}</td>
                        <td className="px-3 py-1.5 text-right text-red-400 font-medium">{count}</td>
                      </tr>
                    ))}
                  {Object.values(result.deletedRows).every((c) => c === 0) && (
                    <tr>
                      <td colSpan={2} className="px-3 py-4 text-center text-slate-500">
                        Silinecek veri bulunamadi — veritabani zaten temiz.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={() => setResult(null)}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Kapat
          </button>
        </div>
      )}
    </div>
  );
}
