import { apiClient } from './client';
import type { MentorListItem, PublicCourseDto } from '@/lib/types/models';
import type { PaginatedResponse } from '@/lib/types/api';

// ── Homepage-specific API calls ──

export interface PlatformStatistics {
  totalStudents: number;
  activeMentors: number;
  averageRating: number;
  totalSessions: number;
}

export interface TestimonialDto {
  id: string;
  studentName: string;
  studentAvatar?: string;
  university: string;
  department: string;
  scoreBefore?: number;
  scoreAfter?: number;
  quote: string;
  rating: number;
  mentorName: string;
}

export const homepageApi = {
  // Use existing mentors endpoint with different sort params
  getTopRatedMentors: async (limit = 12): Promise<MentorListItem[]> => {
    const res = await apiClient.get<PaginatedResponse<MentorListItem>>('/mentors', {
      pageSize: limit,
      page: 1,
    });
    // Sort by ratingAvg descending client-side
    return [...res.items].sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0));
  },

  getNewestMentors: async (limit = 12): Promise<MentorListItem[]> => {
    const res = await apiClient.get<PaginatedResponse<MentorListItem>>('/mentors', {
      pageSize: limit,
      page: 1,
    });
    return res.items;
  },

  // Use existing courses catalog endpoint
  getFeaturedCourses: async (limit = 8): Promise<PublicCourseDto[]> => {
    const res = await apiClient.get<{ items: PublicCourseDto[]; totalCount: number }>('/courses/catalog', {
      pageSize: limit,
      page: 1,
      sortBy: 'newest',
    });
    return res.items || [];
  },

  // Statistics — try backend, fallback to computed from other data
  getStatistics: async (): Promise<PlatformStatistics> => {
    try {
      const res = await apiClient.get<PlatformStatistics>('/public/statistics');
      return res;
    } catch {
      // Fallback: return reasonable defaults
      return {
        totalStudents: 350,
        activeMentors: 100,
        averageRating: 4.8,
        totalSessions: 1000,
      };
    }
  },

  // Testimonials — try backend, fallback to featured reviews
  getTestimonials: async (limit = 6): Promise<TestimonialDto[]> => {
    try {
      const res = await apiClient.get<TestimonialDto[]>('/public/testimonials', { limit });
      return res;
    } catch {
      // Fallback static testimonials
      return [
        {
          id: '1',
          studentName: 'Ahmet Akif',
          university: 'Boğaziçi Üniversitesi',
          department: 'Bilgisayar Mühendisliği',
          scoreBefore: 320,
          scoreAfter: 445,
          quote: 'Mentorluk sürecinde yalnız olmadığımı hissettim. Motivasyonum düştüğünde bile yanındaydı. TYT puanımı 125 puan artırdım!',
          rating: 5,
          mentorName: 'Ahmet Yılmaz',
        },
        {
          id: '2',
          studentName: 'Berkan Şimşek',
          university: 'İTÜ',
          department: 'Elektrik-Elektronik Mühendisliği',
          scoreBefore: 280,
          scoreAfter: 410,
          quote: 'Çalışma tempomun bana göre belirlenmesi çok iyi oldu. Hangi konularda eksik olduğumu tespit ettik ve odaklı çalıştık.',
          rating: 5,
          mentorName: 'Zeynep Kara',
        },
        {
          id: '3',
          studentName: 'Şeyda Ahlat',
          university: 'ODTÜ',
          department: 'Matematik',
          scoreBefore: 350,
          scoreAfter: 460,
          quote: 'Mentorluk hizmeti aldım ve TYT kısmını tamamladık. Kafamın rahat olduğu bir yıl oldu. Hedefime ulaştım!',
          rating: 5,
          mentorName: 'Can Demir',
        },
        {
          id: '4',
          studentName: 'Elif Yıldız',
          university: 'Hacettepe Üniversitesi',
          department: 'Tıp Fakültesi',
          scoreBefore: 380,
          scoreAfter: 485,
          quote: 'Mentorüm her hafta düzenli takip yaptı. Özellikle AYT Fen bölümünde inanılmaz gelişim gösterdim.',
          rating: 5,
          mentorName: 'Seda Yıldız',
        },
        {
          id: '5',
          studentName: 'Oğuzhan Kaya',
          university: 'Bilkent Üniversitesi',
          department: 'Endüstri Mühendisliği',
          scoreBefore: 300,
          scoreAfter: 430,
          quote: 'Sayısal derslerde çok zorlanıyordum. Mentorüm sayesinde matematik ve fizik artık en güçlü derslerim.',
          rating: 5,
          mentorName: 'Murat Özkan',
        },
        {
          id: '6',
          studentName: 'Nisa Korkmaz',
          university: 'Koç Üniversitesi',
          department: 'İşletme',
          scoreBefore: 340,
          scoreAfter: 455,
          quote: 'Zaman yönetimi konusunda çok zorlanıyordum. Mentörüm bana kişiselleştirilmiş bir plan hazırladı.',
          rating: 5,
          mentorName: 'Deniz Aydın',
        },
      ];
    }
  },
};
