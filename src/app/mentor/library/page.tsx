'use client';

import { useState } from 'react';
import { useLibraryItems, useLibraryStats, useDeleteLibraryItem, useUpdateLibraryItem } from '@/lib/hooks/use-library';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { CreateMaterialDialog } from '@/components/features/library/create-material-dialog';
import { EditMaterialDialog } from '@/components/features/library/edit-material-dialog';
import { formatFileSize } from '@/lib/utils/file';
import { toast } from 'sonner';
import {
  Plus,
  FolderOpen,
  FileText,
  Video,
  Link2,
  Image,
  File,
  Presentation,
  Sheet,
  Search,
  Pencil,
  Trash2,
  Share2,
  FolderClosed,
  LayoutTemplate,
} from 'lucide-react';
import type { LibraryItemDto } from '@/lib/api/library';

const TYPE_TABS = [
  { label: 'Tumu', value: '' },
  { label: 'Dokuman', value: 'Document' },
  { label: 'Video', value: 'Video' },
  { label: 'Link', value: 'Link' },
  { label: 'Sablon', value: 'Template' },
  { label: 'Calisma Yapragi', value: 'ExerciseSheet' },
];

function getFormatIcon(fileFormat: string) {
  switch (fileFormat) {
    case 'PDF':
      return <FileText className="w-5 h-5 text-red-500" />;
    case 'DOCX':
      return <FileText className="w-5 h-5 text-blue-500" />;
    case 'PPTX':
      return <Presentation className="w-5 h-5 text-orange-500" />;
    case 'XLSX':
      return <Sheet className="w-5 h-5 text-green-600" />;
    case 'MP4':
    case 'MOV':
      return <Video className="w-5 h-5 text-purple-500" />;
    case 'PNG':
    case 'JPG':
      return <Image className="w-5 h-5 text-pink-500" />;
    case 'URL':
      return <Link2 className="w-5 h-5 text-cyan-600" />;
    default:
      return <File className="w-5 h-5 text-gray-400" />;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function MentorLibraryPage() {
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<LibraryItemDto | null>(null);

  const { data: itemsData, isLoading } = useLibraryItems({
    itemType: typeFilter || undefined,
    search: search.trim() || undefined,
    page,
    pageSize: 12,
  });
  const { data: stats } = useLibraryStats();
  const deleteMutation = useDeleteLibraryItem();
  const updateMutation = useUpdateLibraryItem();

  const items = itemsData?.items ?? [];

  const handleDelete = async (id: string) => {
    if (!confirm('Bu materyali silmek istediginize emin misiniz?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Materyal silindi');
    } catch {
      // error handled by interceptor
    }
  };

  const handleToggleShare = async (item: LibraryItemDto) => {
    try {
      await updateMutation.mutateAsync({
        id: item.id,
        data: { isSharedWithStudents: !item.isSharedWithStudents },
      });
      toast.success(item.isSharedWithStudents ? 'Paylasim kapatildi' : 'Ogrencilerle paylasildi');
    } catch {
      // error handled by interceptor
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-50 flex items-center justify-center">
            <FolderOpen className="w-4 h-4 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Kutuphanem</h1>
            <p className="text-xs text-gray-500">Ders materyallerinizi yonetin ve paylasın</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" />
          Yeni Materyal
        </Button>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-gray-900">{stats.totalItems}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Toplam</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-blue-600">{stats.documentCount}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Dokumanlar</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-purple-600">{stats.videoCount}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Videolar</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-cyan-600">{stats.linkCount}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Linkler</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-1.5 flex-wrap">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setTypeFilter(tab.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                typeFilter === tab.value
                  ? 'bg-cyan-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            placeholder="Ara..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-0 shadow-sm animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => (
              <Card key={item.id} className="border-0 shadow-sm hover:shadow-md transition-all group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                      {getFormatIcon(item.fileFormat)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm text-gray-900 truncate">{item.title}</span>
                        {item.isTemplate && (
                          <LayoutTemplate className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        )}
                        {item.isSharedWithStudents && (
                          <Share2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                        )}
                      </div>

                      {item.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.description}</p>
                      )}

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="text-[9px] text-gray-400">+{item.tags.length - 3}</span>
                          )}
                        </div>
                      )}

                      {/* Meta row */}
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                        {item.category && (
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded">{item.category}</span>
                        )}
                        {item.subject && (
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded">{item.subject}</span>
                        )}
                        {item.fileSizeBytes && item.fileSizeBytes > 0 && (
                          <span>{formatFileSize(item.fileSizeBytes)}</span>
                        )}
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7 px-2"
                      onClick={() => setEditingItem(item)}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Duzenle
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`text-xs h-7 px-2 ${
                        item.isSharedWithStudents ? 'text-green-600' : 'text-gray-500'
                      }`}
                      onClick={() => handleToggleShare(item)}
                      disabled={updateMutation.isPending}
                    >
                      <Share2 className="w-3 h-3 mr-1" />
                      {item.isSharedWithStudents ? 'Paylasiliyor' : 'Paylas'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
                      onClick={() => handleDelete(item.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={itemsData?.totalPages ?? 1}
            totalCount={itemsData?.totalCount ?? 0}
            onPageChange={setPage}
            itemLabel="materyal"
          />
        </>
      ) : (
        <Card className="border border-dashed border-cyan-200 bg-cyan-50/30">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center mx-auto mb-3">
              <FolderClosed className="w-6 h-6 text-cyan-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {search || typeFilter ? 'Aramanizla eslesen materyal bulunamadi' : 'Kutuphaneniz bos'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {search || typeFilter
                ? 'Farkli filtreler deneyin'
                : 'Ilk materyalinizi ekleyerek baslayın'}
            </p>
            {!search && !typeFilter && (
              <Button size="sm" className="text-xs" onClick={() => setShowCreate(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Ilk Materyali Ekle
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <CreateMaterialDialog open={showCreate} onClose={() => setShowCreate(false)} />
      <EditMaterialDialog
        open={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
      />
    </div>
  );
}
