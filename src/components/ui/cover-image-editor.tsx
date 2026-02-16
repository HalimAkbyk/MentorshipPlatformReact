'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload, Move, Loader2, ZoomIn, ZoomOut, RotateCw, RotateCcw,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw as ResetIcon,
  Image as ImageIcon, X,
} from 'lucide-react';
import { toast } from 'sonner';

export interface CoverImageEditorProps {
  /** Current image URL */
  currentUrl: string;
  /** Upload endpoint (e.g. /api/offerings/{id}/upload-cover) */
  uploadEndpoint: string;
  /** Callback when a new image is uploaded */
  onUploaded: (url: string) => void;
  /** Current CSS object-position value */
  currentPosition?: string;
  /** Callback when position changes */
  onPositionChange?: (position: string) => void;
  /** Height class for the preview area */
  previewHeight?: string;
  /** Optional: additional query cache invalidation callback */
  onAfterUpload?: () => void;
}

interface TransformState {
  scale: number;
  rotate: number;
  translateX: number;
  translateY: number;
}

const DEFAULT_TRANSFORM: TransformState = {
  scale: 1,
  rotate: 0,
  translateX: 0,
  translateY: 0,
};

export function CoverImageEditor({
  currentUrl,
  uploadEndpoint,
  onUploaded,
  currentPosition = 'center center',
  onPositionChange,
  previewHeight = 'h-48',
  onAfterUpload,
}: CoverImageEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(currentUrl || '');
  const [objectPosition, setObjectPosition] = useState(currentPosition || 'center center');
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [transform, setTransform] = useState<TransformState>(DEFAULT_TRANSFORM);

  // Sync with external URL
  useEffect(() => {
    if (currentUrl && currentUrl !== previewUrl && !uploading) {
      setPreviewUrl(currentUrl);
    }
  }, [currentUrl]);

  // Sync position
  useEffect(() => {
    if (currentPosition && currentPosition !== objectPosition) {
      setObjectPosition(currentPosition);
    }
  }, [currentPosition]);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Lutfen bir gorsel dosyasi secin');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dosya boyutu en fazla 10 MB olabilir');
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploading(true);
    setProgress(0);
    setTransform(DEFAULT_TRANSFORM);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5072/api';
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      const formData = new FormData();
      formData.append('file', file);

      const result = await new Promise<{ coverImageUrl: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        });
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error('Yanit islenemedi'));
            }
          } else {
            reject(new Error(`Yukleme basarisiz: ${xhr.status}`));
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Yukleme basarisiz')));
        xhr.open('POST', `${API_URL}${uploadEndpoint}`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      setPreviewUrl(result.coverImageUrl);
      onUploaded(result.coverImageUrl);
      onAfterUpload?.();
      toast.success('Kapak gorseli yuklendi!');
    } catch (error) {
      console.error('Cover upload error:', error);
      toast.error('Kapak gorseli yuklenirken hata olustu');
      setPreviewUrl(currentUrl || '');
    } finally {
      setUploading(false);
      setProgress(0);
      URL.revokeObjectURL(localPreview);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  // Drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  // Position click (focal point)
  const handlePositionClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    const newPos = `${x}% ${y}%`;
    setObjectPosition(newPos);
    onPositionChange?.(newPos);
  };

  // Transform controls
  const zoomIn = useCallback(() => {
    setTransform(t => ({ ...t, scale: Math.min(t.scale + 0.1, 3) }));
  }, []);

  const zoomOut = useCallback(() => {
    setTransform(t => ({ ...t, scale: Math.max(t.scale - 0.1, 0.5) }));
  }, []);

  const rotateRight = useCallback(() => {
    setTransform(t => ({ ...t, rotate: t.rotate + 15 }));
  }, []);

  const rotateLeft = useCallback(() => {
    setTransform(t => ({ ...t, rotate: t.rotate - 15 }));
  }, []);

  const panUp = useCallback(() => {
    setTransform(t => ({ ...t, translateY: t.translateY - 5 }));
  }, []);

  const panDown = useCallback(() => {
    setTransform(t => ({ ...t, translateY: t.translateY + 5 }));
  }, []);

  const panLeft = useCallback(() => {
    setTransform(t => ({ ...t, translateX: t.translateX - 5 }));
  }, []);

  const panRight = useCallback(() => {
    setTransform(t => ({ ...t, translateX: t.translateX + 5 }));
  }, []);

  const resetTransform = useCallback(() => {
    setTransform(DEFAULT_TRANSFORM);
    setObjectPosition('center center');
    onPositionChange?.('center center');
  }, [onPositionChange]);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!isEditing) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setTransform(t => ({ ...t, scale: Math.min(Math.max(t.scale + delta, 0.5), 3) }));
  }, [isEditing]);

  const getTransformStyle = (): React.CSSProperties => ({
    objectPosition,
    transform: `scale(${transform.scale}) rotate(${transform.rotate}deg) translate(${transform.translateX}px, ${transform.translateY}px)`,
    transition: 'transform 0.15s ease-out',
  });

  const hasTransform = transform.scale !== 1 || transform.rotate !== 0 || transform.translateX !== 0 || transform.translateY !== 0;

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">Kapak Gorseli</label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Preview / Upload area */}
      {previewUrl && !uploading ? (
        <div className="space-y-2">
          {/* Image preview */}
          <div
            ref={containerRef}
            onClick={handlePositionClick}
            onWheel={handleWheel}
            className={`relative rounded-lg overflow-hidden border-2 ${previewHeight} group ${
              isEditing
                ? 'cursor-crosshair border-blue-400 ring-2 ring-blue-200'
                : 'border-gray-200'
            }`}
          >
            <img
              src={previewUrl}
              alt="Kapak onizleme"
              className="w-full h-full object-cover"
              style={getTransformStyle()}
              onError={() => {
                setPreviewUrl('');
              }}
              draggable={false}
            />

            {/* Hover overlay (non-editing) */}
            {!isEditing && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 shadow-sm flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Degistir
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 shadow-sm flex items-center gap-1.5"
                >
                  <Move className="w-3.5 h-3.5" />
                  Duzenle
                </button>
              </div>
            )}

            {/* Editing mode top bar */}
            {isEditing && (
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-md font-medium">
                  Gorseli duzenleyin
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(false);
                  }}
                  className="px-2 py-1 bg-white text-gray-700 text-xs rounded-md font-medium hover:bg-gray-100 shadow-sm"
                >
                  Tamam
                </button>
              </div>
            )}

            {/* Focal point indicator */}
            {isEditing && objectPosition !== 'center center' && (
              <div
                className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-500 shadow-lg pointer-events-none"
                style={{
                  left: objectPosition.split(' ')[0],
                  top: objectPosition.split(' ')[1],
                }}
              />
            )}
          </div>

          {/* Editing controls panel */}
          {isEditing && (
            <div className="bg-gray-50 rounded-lg border p-3 space-y-3">
              {/* Zoom & Rotate row */}
              <div className="flex items-center gap-4">
                {/* Zoom */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 w-12">Zoom</span>
                  <button type="button" onClick={zoomOut} className="p-1 rounded hover:bg-gray-200 text-gray-600" title="Uzaklastir">
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <div className="w-16 bg-gray-200 rounded-full h-1.5 relative">
                    <div
                      className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(((transform.scale - 0.5) / 2.5) * 100, 100)}%` }}
                    />
                  </div>
                  <button type="button" onClick={zoomIn} className="p-1 rounded hover:bg-gray-200 text-gray-600" title="Yakinlastir">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] text-gray-400 ml-1 w-10">
                    {Math.round(transform.scale * 100)}%
                  </span>
                </div>

                {/* Rotate */}
                <div className="flex items-center gap-1 border-l pl-4">
                  <span className="text-xs text-gray-500 w-12">Dondur</span>
                  <button type="button" onClick={rotateLeft} className="p-1 rounded hover:bg-gray-200 text-gray-600" title="Sola dondur">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] text-gray-400 w-8 text-center">{transform.rotate}°</span>
                  <button type="button" onClick={rotateRight} className="p-1 rounded hover:bg-gray-200 text-gray-600" title="Saga dondur">
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Pan controls */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 w-12">Tasi</span>
                  <div className="flex items-center gap-0.5">
                    <button type="button" onClick={panLeft} className="p-1 rounded hover:bg-gray-200 text-gray-600" title="Sola tasi">
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex flex-col gap-0.5">
                      <button type="button" onClick={panUp} className="p-1 rounded hover:bg-gray-200 text-gray-600" title="Yukari tasi">
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={panDown} className="p-1 rounded hover:bg-gray-200 text-gray-600" title="Asagi tasi">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button type="button" onClick={panRight} className="p-1 rounded hover:bg-gray-200 text-gray-600" title="Saga tasi">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Position presets */}
                <div className="flex items-center gap-1 border-l pl-4">
                  <span className="text-xs text-gray-500 mr-1">Konum</span>
                  {[
                    { label: 'Ust', pos: 'center top' },
                    { label: 'Orta', pos: 'center center' },
                    { label: 'Alt', pos: 'center bottom' },
                    { label: 'Sol', pos: 'left center' },
                    { label: 'Sag', pos: 'right center' },
                  ].map((preset) => (
                    <button
                      key={preset.pos}
                      type="button"
                      onClick={() => { setObjectPosition(preset.pos); onPositionChange?.(preset.pos); }}
                      className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors ${
                        objectPosition === preset.pos
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Reset button */}
                {hasTransform && (
                  <button
                    type="button"
                    onClick={resetTransform}
                    className="ml-auto flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200"
                    title="Sifirla"
                  >
                    <X className="w-3 h-3" />
                    Sifirla
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : uploading ? (
        /* Upload progress */
        <div className="rounded-lg border-2 border-gray-200 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
            <span className="text-gray-700">Yukleniyor...</span>
            <span className="text-gray-400 ml-auto">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        /* Empty state - upload trigger */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
        >
          <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">
            Kapak gorseli yukleyin
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Surukle-birak veya tiklayarak secin - Max 10 MB - JPG, PNG, WebP
          </p>
        </div>
      )}
    </div>
  );
}
