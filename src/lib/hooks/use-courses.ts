import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi, CreateCourseData, UpdateCourseData, GetPublicCoursesParams } from '../api/courses';

// ===== Mentor Queries =====

export function useMyCourses(page = 1, pageSize = 15) {
  return useQuery({
    queryKey: ['courses', 'mine', page, pageSize],
    queryFn: () => coursesApi.getMyCourses(page, pageSize),
  });
}

export function useCourseForEdit(id: string) {
  return useQuery({
    queryKey: ['course', 'edit', id],
    queryFn: () => coursesApi.getCourseForEdit(id),
    enabled: !!id,
  });
}

// ===== Mentor Mutations =====

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCourseData) => coursesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', 'mine'] });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCourseData }) => coursesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['courses', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['course', 'edit', id] });
    },
  });
}

export function usePublishCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, mentorNotes }: { id: string; mentorNotes?: string }) =>
      coursesApi.publish(id, mentorNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useCourseReviewStatus(courseId: string) {
  return useQuery({
    queryKey: ['course', 'review-status', courseId],
    queryFn: () => coursesApi.getReviewStatus(courseId),
    enabled: !!courseId,
  });
}

export function useResubmitCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, mentorNotes }: { id: string; mentorNotes?: string }) =>
      coursesApi.resubmitForReview(id, mentorNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useArchiveCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => coursesApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => coursesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', 'mine'] });
    },
  });
}

// ===== Section Mutations =====

export function useCreateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, title }: { courseId: string; title: string }) =>
      coursesApi.createSection(courseId, title),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['course', 'edit', courseId] });
    },
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, sectionId, title }: { courseId: string; sectionId: string; title: string }) =>
      coursesApi.updateSection(courseId, sectionId, title),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['course', 'edit', courseId] });
    },
  });
}

export function useDeleteSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, sectionId }: { courseId: string; sectionId: string }) =>
      coursesApi.deleteSection(courseId, sectionId),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['course', 'edit', courseId] });
    },
  });
}

export function useReorderSections() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, sectionIds }: { courseId: string; sectionIds: string[] }) =>
      coursesApi.reorderSections(courseId, sectionIds),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['course', 'edit', courseId] });
    },
  });
}

// ===== Lecture Mutations =====

export function useCreateLecture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      sectionId,
      data,
    }: {
      courseId: string;
      sectionId: string;
      data: { title: string; type?: string; isPreview: boolean; description?: string };
    }) => coursesApi.createLecture(sectionId, data),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['course', 'edit', courseId] });
    },
  });
}

export function useUpdateLecture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      sectionId,
      lectureId,
      data,
    }: {
      courseId: string;
      sectionId: string;
      lectureId: string;
      data: { title: string; description?: string; isPreview: boolean; textContent?: string };
    }) => coursesApi.updateLecture(sectionId, lectureId, data),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['course', 'edit', courseId] });
    },
  });
}

export function useDeleteLecture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      sectionId,
      lectureId,
    }: {
      courseId: string;
      sectionId: string;
      lectureId: string;
    }) => coursesApi.deleteLecture(sectionId, lectureId),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['course', 'edit', courseId] });
    },
  });
}

export function useReorderLectures() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      sectionId,
      lectureIds,
    }: {
      courseId: string;
      sectionId: string;
      lectureIds: string[];
    }) => coursesApi.reorderLectures(sectionId, lectureIds),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['course', 'edit', courseId] });
    },
  });
}

// ===== Video Upload =====

export function useGetVideoUploadUrl() {
  return useMutation({
    mutationFn: ({
      lectureId,
      fileName,
      contentType,
    }: {
      lectureId: string;
      fileName: string;
      contentType: string;
    }) => coursesApi.getVideoUploadUrl(lectureId, fileName, contentType),
  });
}

export function useConfirmVideoUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      lectureId,
      videoKey,
      durationSec,
    }: {
      courseId: string;
      lectureId: string;
      videoKey: string;
      durationSec: number;
    }) => coursesApi.confirmVideoUpload(lectureId, videoKey, durationSec),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['course', 'edit', courseId] });
    },
  });
}

// ===== Public Queries =====

export function usePublicCourses(params: GetPublicCoursesParams) {
  return useQuery({
    queryKey: ['courses', 'public', params],
    queryFn: () => coursesApi.getPublicCourses(params),
  });
}

export function useCourseDetail(id: string) {
  return useQuery({
    queryKey: ['course', 'detail', id],
    queryFn: () => coursesApi.getCourseDetail(id),
    enabled: !!id,
  });
}

// ===== Preview =====

export function usePreviewLecture() {
  return useMutation({
    mutationFn: ({ courseId, lectureId }: { courseId: string; lectureId: string }) =>
      coursesApi.getPreviewLecture(courseId, lectureId),
  });
}

// ===== Student Enrollment =====

export function useEnrollInCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => coursesApi.enroll(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useEnrolledCourses(page = 1, pageSize = 15) {
  return useQuery({
    queryKey: ['courses', 'enrolled', page, pageSize],
    queryFn: () => coursesApi.getEnrolledCourses(page, pageSize),
  });
}

export function useCoursePlayer(courseId: string, lectureId?: string) {
  return useQuery({
    queryKey: ['course', 'player', courseId, lectureId],
    queryFn: () => coursesApi.getCoursePlayer(courseId, lectureId),
    enabled: !!courseId,
  });
}

export function useUpdateProgress() {
  return useMutation({
    mutationFn: ({
      lectureId,
      watchedSec,
      lastPositionSec,
    }: {
      lectureId: string;
      watchedSec: number;
      lastPositionSec: number;
    }) => coursesApi.updateProgress(lectureId, watchedSec, lastPositionSec),
  });
}

export function useCompleteLecture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lectureId: string) => coursesApi.completeLecture(lectureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', 'player'] });
      queryClient.invalidateQueries({ queryKey: ['courses', 'enrolled'] });
    },
  });
}

export function useCourseProgress(courseId: string) {
  return useQuery({
    queryKey: ['course', 'progress', courseId],
    queryFn: () => coursesApi.getCourseProgress(courseId),
    enabled: !!courseId,
  });
}

// ===== Notes =====

export function useLectureNotes(lectureId: string) {
  return useQuery({
    queryKey: ['lecture', 'notes', lectureId],
    queryFn: () => coursesApi.getLectureNotes(lectureId),
    enabled: !!lectureId,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      lectureId,
      timestampSec,
      content,
    }: {
      lectureId: string;
      timestampSec: number;
      content: string;
    }) => coursesApi.createNote(lectureId, timestampSec, content),
    onSuccess: (_, { lectureId }) => {
      queryClient.invalidateQueries({ queryKey: ['lecture', 'notes', lectureId] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      noteId,
      lectureId,
      content,
      timestampSec,
    }: {
      noteId: string;
      lectureId: string;
      content: string;
      timestampSec?: number;
    }) => coursesApi.updateNote(noteId, content, timestampSec),
    onSuccess: (_, { lectureId }) => {
      queryClient.invalidateQueries({ queryKey: ['lecture', 'notes', lectureId] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, lectureId }: { noteId: string; lectureId: string }) =>
      coursesApi.deleteNote(noteId),
    onSuccess: (_, { lectureId }) => {
      queryClient.invalidateQueries({ queryKey: ['lecture', 'notes', lectureId] });
    },
  });
}

// ===== Admin Notes (Mentor view) =====

export function useCourseAdminNotes(courseId: string) {
  return useQuery({
    queryKey: ['course', 'admin-notes', courseId],
    queryFn: () => coursesApi.getMyAdminNotes(courseId),
    enabled: !!courseId,
  });
}
