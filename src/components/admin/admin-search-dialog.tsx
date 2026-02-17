'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, User, BookOpen, Users, CreditCard, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';

interface SearchResults {
  users: { id: string; displayName: string; email: string; roles: string[] }[];
  courses: { id: string; title: string; status: string; category: string }[];
  groupClasses: { id: string; title: string; status: string; category: string }[];
  orders: { id: string; type: string; status: string; amountTotal: number; providerPaymentId: string }[];
}

export function AdminSearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Focus on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults(null);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const data = await adminApi.globalSearch(q);
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  const navigate = (path: string) => {
    onClose();
    router.push(path);
  };

  const hasResults =
    results &&
    (results.users.length > 0 ||
      results.courses.length > 0 ||
      results.groupClasses.length > 0 ||
      results.orders.length > 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Kullanici, kurs, siparis ara..."
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            className="flex-1 text-sm text-slate-700 placeholder-slate-400 outline-none"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults(null); }} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex text-xs text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          )}

          {!isSearching && query.length >= 2 && !hasResults && (
            <div className="text-center py-8 text-sm text-slate-400">
              Sonuc bulunamadi.
            </div>
          )}

          {!isSearching && hasResults && (
            <div className="py-2">
              {/* Users */}
              {results!.users.length > 0 && (
                <div>
                  <p className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Kullanicilar
                  </p>
                  {results!.users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => navigate(`/admin/users?highlight=${u.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                    >
                      <User className="h-4 w-4 text-indigo-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{u.displayName}</p>
                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      </div>
                      <span className="ml-auto text-[10px] text-slate-400 shrink-0">
                        {u.roles?.join(', ')}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Courses */}
              {results!.courses.length > 0 && (
                <div>
                  <p className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Kurslar
                  </p>
                  {results!.courses.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => navigate(`/admin/courses/${c.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                    >
                      <BookOpen className="h-4 w-4 text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{c.title}</p>
                        <p className="text-xs text-slate-400">{c.category || '-'} · {c.status}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Group Classes */}
              {results!.groupClasses.length > 0 && (
                <div>
                  <p className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Grup Dersleri
                  </p>
                  {results!.groupClasses.map((gc) => (
                    <button
                      key={gc.id}
                      onClick={() => navigate(`/admin/group-classes?highlight=${gc.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                    >
                      <Users className="h-4 w-4 text-blue-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{gc.title}</p>
                        <p className="text-xs text-slate-400">{gc.category || '-'} · {gc.status}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Orders */}
              {results!.orders.length > 0 && (
                <div>
                  <p className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Siparisler
                  </p>
                  {results!.orders.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => navigate(`/admin/orders?highlight=${o.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                    >
                      <CreditCard className="h-4 w-4 text-amber-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {o.providerPaymentId || o.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-slate-400">{o.type} · {o.status} · {o.amountTotal}₺</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isSearching && query.length < 2 && (
            <div className="py-6 text-center text-sm text-slate-400">
              Aramak icin en az 2 karakter girin.
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-slate-100 px-4 py-2 flex items-center gap-4 text-xs text-slate-400">
          <span>↑↓ Gezin</span>
          <span>↵ Sec</span>
          <span>ESC Kapat</span>
        </div>
      </div>
    </div>
  );
}
