'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Edit2, ToggleLeft, ToggleRight, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/lib/api/admin';
import type { PackageDto } from '@/lib/api/packages';
import { toast } from 'sonner';

export default function AdminPackagesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPackage, setEditingPackage] = useState<PackageDto | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrivateCredits, setFormPrivateCredits] = useState(0);
  const [formGroupCredits, setFormGroupCredits] = useState(0);
  const [formVideoCredits, setFormVideoCredits] = useState(0);
  const [formPrice, setFormPrice] = useState(0);
  const [formValidityDays, setFormValidityDays] = useState(30);

  const { data: packages, isLoading } = useQuery({
    queryKey: ['admin', 'packages'],
    queryFn: () => adminApi.getPackages(),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminApi.togglePackage(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'packages'] });
      toast.success('Paket durumu guncellendi');
    },
    onError: () => toast.error('Islem basarisiz'),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; price: number; privateLessonCredits: number; groupLessonCredits: number; videoAccessCredits: number; validityDays?: number }) =>
      adminApi.createPackage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'packages'] });
      toast.success('Paket olusturuldu');
      resetForm();
    },
    onError: () => toast.error('Paket olusturulamadi'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description?: string; price: number; privateLessonCredits: number; groupLessonCredits: number; videoAccessCredits: number; validityDays?: number } }) =>
      adminApi.updatePackage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'packages'] });
      toast.success('Paket guncellendi');
      resetForm();
    },
    onError: () => toast.error('Paket guncellenemedi'),
  });

  const resetForm = () => {
    setShowCreateForm(false);
    setEditingPackage(null);
    setFormName('');
    setFormDescription('');
    setFormPrivateCredits(0);
    setFormGroupCredits(0);
    setFormVideoCredits(0);
    setFormPrice(0);
    setFormValidityDays(30);
  };

  const openEditForm = (pkg: PackageDto) => {
    setEditingPackage(pkg);
    setFormName(pkg.name);
    setFormDescription(pkg.description || '');
    setFormPrivateCredits(pkg.privateLessonCredits);
    setFormGroupCredits(pkg.groupLessonCredits);
    setFormVideoCredits(pkg.videoAccessCredits);
    setFormPrice(pkg.price);
    setFormValidityDays(pkg.validityDays || 30);
    setShowCreateForm(true);
  };

  const handleSubmit = () => {
    const data = {
      name: formName,
      description: formDescription,
      privateLessonCredits: formPrivateCredits,
      groupLessonCredits: formGroupCredits,
      videoAccessCredits: formVideoCredits,
      price: formPrice,
      validityDays: formValidityDays,
    };
    if (editingPackage) {
      updateMutation.mutate({ id: editingPackage.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = (packages || []).filter((p: PackageDto) =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paket Yonetimi</h1>
          <p className="text-sm text-gray-500 mt-1">Ogrenci paketlerini olusturun ve yonetin</p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateForm(true); }} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-2" /> Yeni Paket
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Paket ara..."
          className="pl-10"
        />
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card className="border-teal-200 bg-teal-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{editingPackage ? 'Paketi Duzenle' : 'Yeni Paket Olustur'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Paket Adi</label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Orn: Baslangic Paketi" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Fiyat (TRY)</label>
                <Input type="number" value={formPrice} onChange={(e) => setFormPrice(Number(e.target.value))} min={0} step={0.01} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Gecerlilik (gun)</label>
                <Input type="number" value={formValidityDays} onChange={(e) => setFormValidityDays(Number(e.target.value))} min={1} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Birebir Ders Kredisi</label>
                <Input type="number" value={formPrivateCredits} onChange={(e) => setFormPrivateCredits(Number(e.target.value))} min={0} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Grup Ders Kredisi</label>
                <Input type="number" value={formGroupCredits} onChange={(e) => setFormGroupCredits(Number(e.target.value))} min={0} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Video Erisim Kredisi</label>
                <Input type="number" value={formVideoCredits} onChange={(e) => setFormVideoCredits(Number(e.target.value))} min={0} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Aciklama</label>
              <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Paket aciklamasi..." />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit} disabled={!formName.trim() || createMutation.isPending || updateMutation.isPending} className="bg-teal-600 hover:bg-teal-700">
                {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                {editingPackage ? 'Guncelle' : 'Olustur'}
              </Button>
              <Button size="sm" variant="ghost" onClick={resetForm}>Iptal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Package List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Henuz paket olusturulmamis</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pkg: PackageDto) => (
            <Card key={pkg.id} className={`relative ${!pkg.isActive ? 'opacity-60' : ''}`}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                    {pkg.description && <p className="text-xs text-gray-500 mt-0.5">{pkg.description}</p>}
                  </div>
                  <Badge className={pkg.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                    {pkg.isActive ? 'Aktif' : 'Pasif'}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-2xl font-bold text-teal-600">{pkg.price}</span>
                  <span className="text-sm text-gray-500">TRY</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 flex-wrap">
                  {pkg.privateLessonCredits > 0 && <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full">{pkg.privateLessonCredits} 1:1</span>}
                  {pkg.groupLessonCredits > 0 && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{pkg.groupLessonCredits} Grup</span>}
                  {pkg.videoAccessCredits > 0 && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">{pkg.videoAccessCredits} Video</span>}
                  {pkg.validityDays && <span>{pkg.validityDays} gun</span>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => openEditForm(pkg)}>
                    <Edit2 className="w-3.5 h-3.5 mr-1" /> Duzenle
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`text-xs ${pkg.isActive ? 'text-red-600 border-red-200' : 'text-green-600 border-green-200'}`}
                    onClick={() => toggleMutation.mutate({ id: pkg.id, isActive: !pkg.isActive })}
                    disabled={toggleMutation.isPending}
                  >
                    {pkg.isActive ? <ToggleRight className="w-3.5 h-3.5 mr-1" /> : <ToggleLeft className="w-3.5 h-3.5 mr-1" />}
                    {pkg.isActive ? 'Pasife Al' : 'Aktif Et'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
