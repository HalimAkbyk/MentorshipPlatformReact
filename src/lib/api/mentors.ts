import { apiClient } from './client';
import type {
  MentorListItem,
  MentorDetail
} from '@/lib/types/models';
import type { PaginatedResponse } from '@/lib/types/api';
import type { MyMentorOffering,MyMentorProfile } from '@/lib/types/mentor';

export interface MentorFilters {
  searchTerm?: string;
  university?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
}

export const mentorsApi = {
  list: async (filters: MentorFilters = {}): Promise<PaginatedResponse<MentorListItem>> => {
    return apiClient.get<PaginatedResponse<MentorListItem>>('/mentors', filters);
  },

  getById: async (id: string): Promise<MentorDetail> => {
    return apiClient.get<MentorDetail>(`/mentors/${id}`);
  },

  // ✅ Mevcut profil (onboarding prefill)
  getMyProfile: async (): Promise<MyMentorProfile> => {
    return apiClient.get<MyMentorProfile>('/mentors/me/profile');
  },

  // ✅ Offerings (onboarding pricing prefill)
  getMyOfferings: async (): Promise<MyMentorOffering[]> => {
    return apiClient.get<MyMentorOffering[]>('/mentors/me/offerings');
  },

  // ✅ Student → Mentor role upgrade
  becomeMentor: async (data: {
    university: string;
    department: string;
    bio: string;
    graduationYear?: number;
    headline?: string;
  }): Promise<{ accessToken: string; refreshToken: string; roles: string[] }> => {
    return apiClient.post('/mentors/become-mentor', data);
  },

  // ✅ Profil oluştur (ilk kez)
  createProfile: async (data: {
    university: string;
    department: string;
    bio: string;
    graduationYear?: number;
    headline?: string;
  }) => {
    return apiClient.post('/mentors/me/profile', data);
  },

  // ✅ Profil güncelle (varsa)
  updateProfile: async (data: {
    university?: string;
    department?: string;
    bio?: string;
    headline?: string;
    graduationYear?: number;
  }) => {
    return apiClient.patch('/mentors/me/profile', data);
  },

  // ✅ Ücretlendirme: backend tarafında tek offering upsert edilecek şekilde (OneToOne)
  // Not: Backend senin tarafta farklıysa burayı ona göre değiştiririz ama şu an onboarding için standartladık.
  upsertMyOneToOneOffering: async (data: { hourlyRate: number; durationMin?: number; currency?: string }) => {
    return apiClient.put('/mentors/me/offerings', {
      hourlyRate: data.hourlyRate,
      durationMinDefault: data.durationMin ?? 60,
      currency: data.currency ?? 'TRY',
    });
  },

  submitVerification: async (type: string, document: File) => {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('document', document);

    return apiClient.postForm('/mentors/me/verification', formData);
  },

  // ✅ Verification silme (sadece Pending/Rejected)
  deleteVerification: async (verificationId: string) => {
    return apiClient.delete(`/mentors/me/verification/${verificationId}`);
  },
};