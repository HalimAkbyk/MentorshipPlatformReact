'use client';

import { useState } from 'react';
import { Tag, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Static categories used by the platform
const categories = [
  { name: 'Matematik', entityType: 'GroupClass', icon: '📐' },
  { name: 'Yazilim', entityType: 'GroupClass', icon: '💻' },
  { name: 'Muzik', entityType: 'GroupClass', icon: '🎵' },
  { name: 'Dil', entityType: 'GroupClass', icon: '🌍' },
  { name: 'Sanat', entityType: 'GroupClass', icon: '🎨' },
  { name: 'Is/Kariyer', entityType: 'GroupClass', icon: '💼' },
  { name: 'Bilim', entityType: 'GroupClass', icon: '🔬' },
  { name: 'Spor/Saglik', entityType: 'GroupClass', icon: '🏃' },
  { name: 'Diger', entityType: 'GroupClass', icon: '📦' },
];

export default function CategoriesPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Tag className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Kategoriler</h1>
          </div>
          <p className="text-sm text-gray-500">
            Platform genelinde kullanilan ders ve kurs kategorileri.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <p className="font-medium text-gray-800">{cat.name}</p>
                  <p className="text-xs text-gray-400">{cat.entityType}</p>
                </div>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Aktif
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-500">
          Kategori ekleme/duzenleme ozelligi yakin zamanda eklenecektir. Su an kategoriler sabit tanimlidir.
        </p>
      </div>
    </div>
  );
}
