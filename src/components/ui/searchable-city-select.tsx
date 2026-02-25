'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TURKISH_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya',
  'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik',
  'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum',
  'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir',
  'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul',
  'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri',
  'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kilis', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya',
  'Manisa', 'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye',
  'Rize', 'Sakarya', 'Samsun', 'Şanlıurfa', 'Siirt', 'Sinop', 'Şırnak', 'Sivas',
  'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak',
];

interface SearchableCitySelectProps {
  value: string;
  onChange: (city: string) => void;
  showLabel?: boolean;
  inputClassName?: string;
}

export function SearchableCitySelect({ value, onChange, showLabel = true, inputClassName }: SearchableCitySelectProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search) return TURKISH_CITIES;
    const q = search.toLowerCase().replace(/[ıİ]/g, m => m === 'ı' ? 'i' : 'i');
    return TURKISH_CITIES.filter(c =>
      c.toLowerCase().replace(/[ıİ]/g, m => m === 'ı' ? 'i' : 'i').includes(q)
    );
  }, [search]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const selectCity = (city: string) => {
    onChange(city);
    setSearch('');
    setIsOpen(false);
  };

  const clearCity = () => {
    onChange('');
    setSearch('');
    setIsOpen(true);
  };

  return (
    <div className="relative" ref={containerRef}>
      {showLabel && (
        <div className="flex items-center gap-2 mb-1.5">
          <MapPin className="w-4 h-4 text-gray-400" />
          <Label className="text-sm text-gray-700">Şehir *</Label>
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input
          type="text"
          value={isOpen ? search : (value || '')}
          onChange={e => { setSearch(e.target.value); if (!isOpen) setIsOpen(true); }}
          onFocus={() => { setIsOpen(true); setSearch(''); }}
          placeholder="Şehir ara..."
          className={inputClassName || "h-11 rounded-xl pl-10 bg-gray-50 border-gray-200 text-sm focus:bg-white"}
          autoComplete="off"
        />
        {value && !isOpen && (
          <button
            type="button"
            onClick={clearCity}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">Sonuç bulunamadı</div>
          ) : (
            filtered.map(c => (
              <button
                key={c}
                type="button"
                onMouseDown={() => selectCity(c)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-teal-50 transition-colors ${
                  value === c ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700'
                }`}
              >
                {c}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export { TURKISH_CITIES };
