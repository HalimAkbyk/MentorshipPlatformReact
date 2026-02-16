import { apiClient } from './client';
import type {
  MentorCourseDto,
  CourseEditDto,
  PublicCoursesResponse,
  CourseDetailDto,
  CoursePlayerDto,
  EnrolledCourseDto,
  CourseProgressDto,
  LectureNoteDto,
  VideoUploadUrlResponse,
  PreviewLectureDto,
} from '../types/models';

// ===== Request types =====

export interface CreateCourseData {
  title: string;
  shortDescription?: string;
  description?: string;
  price: number;
  category?: string;
  language?: string;
  level?: string;
}

export interface UpdateCourseData {
  title: string;
  shortDescription?: string;
  description?: string;
  price: number;
  category?: string;
  language?: string;
  level?: string;
  coverImageUrl?: string;
  promoVideoKey?: string;
  whatYouWillLearn?: string[];
  requirements?: string[];
  targetAudience?: string[];
}

export interface GetPublicCoursesParams {
  search?: string;
  category?: string;
  level?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

// ===== API =====

export const coursesApi = {
  // === Mentor Course CRUD ===
  getMyCourses: async (): Promise<MentorCourseDto[]> => {
    return apiClient.get<MentorCourseDto[]>('/courses/me');
  },

  getCourseForEdit: async (id: string): Promise<CourseEditDto> => {
    return apiClient.get<CourseEditDto>(`/courses/${id}/edit`);
  },

  create: async (data: CreateCourseData): Promise<{ id: string }> => {
    return apiClient.post('/courses', data);
  },

  update: async (id: string, data: UpdateCourseData): Promise<void> => {
    return apiClient.put(`/courses/${id}`, data);
  },

  publish: async (id: string): Promise<void> => {
    return apiClient.post(`/courses/${id}/publish`);
  },

  archive: async (id: string): Promise<void> => {
    return apiClient.post(`/courses/${id}/archive`);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/courses/${id}`);
  },

  // === Sections ===
  createSection: async (courseId: string, title: string): Promise<{ id: string }> => {
    return apiClient.post(`/courses/${courseId}/sections`, { title });
  },

  updateSection: async (courseId: string, sectionId: string, title: string): Promise<void> => {
    return apiClient.put(`/courses/${courseId}/sections/${sectionId}`, { title });
  },

  deleteSection: async (courseId: string, sectionId: string): Promise<void> => {
    return apiClient.delete(`/courses/${courseId}/sections/${sectionId}`);
  },

  reorderSections: async (courseId: string, sectionIds: string[]): Promise<void> => {
    return apiClient.put(`/courses/${courseId}/sections/reorder`, { sectionIds });
  },

  // === Lectures ===
  createLecture: async (
    sectionId: string,
    data: { title: string; type?: string; isPreview: boolean; description?: string }
  ): Promise<{ id: string }> => {
    return apiClient.post(`/sections/${sectionId}/lectures`, data);
  },

  updateLecture: async (
    sectionId: string,
    lectureId: string,
    data: { title: string; description?: string; isPreview: boolean; textContent?: string }
  ): Promise<void> => {
    return apiClient.put(`/sections/${sectionId}/lectures/${lectureId}`, data);
  },

  deleteLecture: async (sectionId: string, lectureId: string): Promise<void> => {
    return apiClient.delete(`/sections/${sectionId}/lectures/${lectureId}`);
  },

  reorderLectures: async (sectionId: string, lectureIds: string[]): Promise<void> => {
    return apiClient.put(`/sections/${sectionId}/lectures/reorder`, { lectureIds });
  },

  // === Video Upload ===
  getVideoUploadUrl: async (
    lectureId: string,
    fileName: string,
    contentType: string
  ): Promise<VideoUploadUrlResponse> => {
    return apiClient.post(`/lectures/${lectureId}/upload-url`, { fileName, contentType });
  },

  confirmVideoUpload: async (
    lectureId: string,
    videoKey: string,
    durationSec: number
  ): Promise<void> => {
    return apiClient.post(`/lectures/${lectureId}/confirm-upload`, { videoKey, durationSec });
  },

  // === Public Catalog ===
  getPublicCourses: async (params: GetPublicCoursesParams): Promise<PublicCoursesResponse> => {
    return apiClient.get<PublicCoursesResponse>('/courses/catalog', params);
  },

  getCourseDetail: async (id: string): Promise<CourseDetailDto> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = await apiClient.get(`/courses/${id}`);

    // Backend returns: mentor (object), curriculum (array), *Json (strings)
    // Frontend expects: mentorId/mentorName/etc (flat), sections (array), arrays
    const parseJsonArray = (val: unknown): string[] => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
      }
      return [];
    };

    return {
      id: raw.id,
      title: raw.title,
      shortDescription: raw.shortDescription,
      description: raw.description,
      coverImageUrl: raw.coverImageUrl,
      promoVideoKey: raw.promoVideoKey,
      price: raw.price ?? 0,
      currency: raw.currency ?? 'TRY',
      level: raw.level,
      language: raw.language,
      category: raw.category,
      whatYouWillLearn: parseJsonArray(raw.whatYouWillLearn ?? raw.whatYouWillLearnJson),
      requirements: parseJsonArray(raw.requirements ?? raw.requirementsJson),
      targetAudience: parseJsonArray(raw.targetAudience ?? raw.targetAudienceJson),
      totalLectures: raw.totalLectures ?? 0,
      totalDurationSec: raw.totalDurationSec ?? 0,
      ratingAvg: raw.ratingAvg ?? 0,
      ratingCount: raw.ratingCount ?? 0,
      enrollmentCount: raw.enrollmentCount ?? 0,
      mentorId: raw.mentor?.userId ?? raw.mentorId ?? '',
      mentorName: raw.mentor?.displayName ?? raw.mentorName ?? '',
      mentorAvatar: raw.mentor?.avatarUrl ?? raw.mentorAvatar,
      mentorBio: raw.mentor?.bio ?? raw.mentorBio,
      isEnrolled: raw.isEnrolled ?? false,
      sections: (raw.curriculum ?? raw.sections ?? []).map((s: any) => ({
        id: s.id,
        title: s.title,
        sortOrder: s.sortOrder ?? 0,
        lectures: (s.lectures ?? []).map((l: any) => ({
          id: l.id,
          title: l.title,
          durationSec: l.durationSec ?? 0,
          isPreview: l.isPreview ?? false,
          type: l.type,
        })),
      })),
    } as CourseDetailDto;
  },

  // === Preview ===
  getPreviewLecture: async (courseId: string, lectureId: string): Promise<PreviewLectureDto> => {
    return apiClient.get<PreviewLectureDto>(`/courses/${courseId}/preview/${lectureId}`);
  },

  // === Enrollment ===
  enroll: async (courseId: string): Promise<{ enrollmentId: string }> => {
    return apiClient.post(`/course-enrollments/${courseId}`);
  },

  getEnrolledCourses: async (): Promise<EnrolledCourseDto[]> => {
    return apiClient.get<EnrolledCourseDto[]>('/course-enrollments/my');
  },

  getCoursePlayer: async (courseId: string, lectureId?: string): Promise<CoursePlayerDto> => {
    const params = lectureId ? { lectureId } : undefined;
    return apiClient.get<CoursePlayerDto>(`/course-enrollments/${courseId}/player`, params);
  },

  updateProgress: async (lectureId: string, watchedSec: number, lastPositionSec: number): Promise<void> => {
    return apiClient.post(`/course-enrollments/progress/${lectureId}`, { watchedSec, lastPositionSec });
  },

  completeLecture: async (lectureId: string): Promise<void> => {
    return apiClient.post(`/course-enrollments/complete/${lectureId}`);
  },

  getCourseProgress: async (courseId: string): Promise<CourseProgressDto> => {
    return apiClient.get<CourseProgressDto>(`/course-enrollments/${courseId}/progress`);
  },

  // === Notes ===
  getLectureNotes: async (lectureId: string): Promise<LectureNoteDto[]> => {
    return apiClient.get<LectureNoteDto[]>(`/course-notes/lecture/${lectureId}`);
  },

  createNote: async (lectureId: string, timestampSec: number, content: string): Promise<{ id: string }> => {
    return apiClient.post('/course-notes', { lectureId, timestampSec, content });
  },

  updateNote: async (noteId: string, content: string, timestampSec?: number): Promise<void> => {
    return apiClient.put(`/course-notes/${noteId}`, { content, timestampSec });
  },

  deleteNote: async (noteId: string): Promise<void> => {
    return apiClient.delete(`/course-notes/${noteId}`);
  },
};
