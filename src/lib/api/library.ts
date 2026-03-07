import { apiClient } from './client';

export interface LibraryItemDto {
  id: string;
  title: string;
  description?: string;
  itemType: string; // Document, Video, Link, Template, ExerciseSheet
  fileFormat: string; // PDF, DOCX, PPTX, XLSX, MP4, MOV, PNG, JPG, URL, Other
  fileUrl?: string;
  originalFileName?: string;
  fileSizeBytes?: number;
  externalUrl?: string;
  thumbnailUrl?: string;
  category?: string;
  subject?: string;
  tags: string[];
  isTemplate: boolean;
  templateType?: string;
  isSharedWithStudents: boolean;
  usageCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryStatsDto {
  totalItems: number;
  documentCount: number;
  videoCount: number;
  linkCount: number;
  templateCount: number;
  totalSizeBytes: number;
}

export interface CreateLibraryItemRequest {
  title: string;
  description?: string;
  itemType: string;
  fileFormat: string;
  fileUrl?: string;
  originalFileName?: string;
  fileSizeBytes?: number;
  externalUrl?: string;
  thumbnailUrl?: string;
  category?: string;
  subject?: string;
  tags?: string[];
  isTemplate?: boolean;
  templateType?: string;
  isSharedWithStudents?: boolean;
}

export interface UpdateLibraryItemRequest {
  title?: string;
  description?: string;
  category?: string;
  subject?: string;
  tags?: string[];
  isTemplate?: boolean;
  templateType?: string;
  isSharedWithStudents?: boolean;
  externalUrl?: string;
}

export interface LibraryListResponse {
  items: LibraryItemDto[];
  totalCount: number;
  totalPages: number;
}

export interface LibraryUploadResponse {
  fileUrl: string;
  originalFileName: string;
  fileSizeBytes: number;
}

export const libraryApi = {
  list: async (params?: {
    itemType?: string;
    fileFormat?: string;
    category?: string;
    subject?: string;
    search?: string;
    isTemplate?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<LibraryListResponse> => {
    return apiClient.get<LibraryListResponse>('/library', params);
  },

  getById: async (id: string): Promise<LibraryItemDto> => {
    return apiClient.get<LibraryItemDto>(`/library/${id}`);
  },

  create: async (data: CreateLibraryItemRequest): Promise<string> => {
    const res = await apiClient.post<{ id: string }>('/library', data);
    return res.id;
  },

  update: async (id: string, data: UpdateLibraryItemRequest): Promise<void> => {
    return apiClient.put(`/library/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/library/${id}`);
  },

  getStats: async (): Promise<LibraryStatsDto> => {
    return apiClient.get<LibraryStatsDto>('/library/stats');
  },

  upload: async (file: File): Promise<LibraryUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.postForm<LibraryUploadResponse>('/library/upload', formData);
  },
};
