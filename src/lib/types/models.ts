import { UserRole,VerificationType,BookingStatus,ClassStatus,OrderType,CourseStatus,CourseLevel,LectureType,CourseEnrollmentStatus } from './enums';

export interface User {
  id: string;
  email: string;
  phone?: string;
  displayName: string;
  avatarUrl?: string;
  birthYear?: number;
  roles: UserRole[];
  status: 'Active' | 'Suspended' | 'Deleted';
  createdAt: string;
  updatedAt: string;
}

export interface MentorListItem {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  university: string;
  department: string;
  graduationYear?: number;
  headline?: string;
  ratingAvg: number;
  ratingCount: number;
  hourlyRate?: number;
  isVerified: boolean;
  categories?: string[];
}

export interface MentorDetail {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  bio: string;
  university: string;
  department: string;
  graduationYear?: number;
  headline?: string;
  ratingAvg: number;
  ratingCount: number;
  isListed: boolean;
  isOwnProfile: boolean;
  verificationStatus?: 'NoDocuments' | 'PendingApproval' | 'Approved' | 'Rejected' | null;
  offerings: Offering[];
  badges: VerificationBadge[];
  availableSlots: AvailabilitySlot[];
}

export interface Offering {
  id: string;
  type: 'OneToOne' | 'GroupClass';
  title: string;
  description?: string;
  durationMin: number;
  price: number;
  currency: string;
  isActive: boolean;
  coverImageUrl?: string;
  coverImagePosition?: string;
  coverImageTransform?: string;
}

export interface VerificationBadge {
  type: VerificationType;
  isVerified: boolean;
}

export interface AvailabilitySlot {
  id: string;
  startAt: string;
  endAt: string;
}

export interface Booking {
  id: string;
  // ✅ Backend'den gelen alanlar (GetMyBookingsQuery)
  mentorUserId: string;
  mentorName: string;
  mentorAvatar?: string;
  studentUserId: string;
  studentName: string;
  studentAvatar?: string;
  startAt: string;
  endAt: string;
  durationMin: number;
  status: BookingStatus;
  price: number;
  currency: string;
  hasPendingReschedule: boolean;
}

export interface BookingQuestionResponseDetail {
  questionId: string;
  questionText: string;
  answerText: string;
  isRequired: boolean;
}

export interface BookingDetail {
  id: string;
  // Backend'den gelen alanlar (GetBookingByIdQuery)
  studentUserId: string;
  studentName: string;
  mentorUserId: string;
  mentorName: string;
  mentorAvatar?: string;
  offeringId: string;
  startAt: string;
  endAt: string;
  durationMin: number;
  status: BookingStatus;
  offeringTitle: string;
  price: number;
  currency: string;
  cancellationReason?: string;
  hasReview?: boolean;
  // Reschedule bilgileri
  rescheduleCountStudent: number;
  rescheduleCountMentor: number;
  pendingRescheduleStartAt?: string;
  pendingRescheduleEndAt?: string;
  pendingRescheduleRequestedBy?: string;
  createdAt: string;
  questionResponses?: BookingQuestionResponseDetail[];
}

export interface GroupClass {
  id: string;
  mentorUserId: string;
  mentorName: string;
  mentorAvatar?: string;
  title: string;
  description?: string;
  category: string;
  coverImageUrl?: string;
  startAt: string;
  endAt: string;
  capacity: number;
  enrolledCount: number;
  pricePerSeat: number;
  currency: string;
  status: ClassStatus;
  currentUserEnrollmentStatus?: string;
}

export interface GroupClassDetail extends GroupClass {
  enrollments?: ClassEnrollmentDto[];
}

export interface ClassEnrollmentDto {
  id: string;
  studentUserId: string;
  studentName: string;
  studentAvatar?: string;
  status: string;
  createdAt: string;
}

export interface MyEnrollment {
  enrollmentId: string;
  classId: string;
  classTitle: string;
  classDescription?: string;
  category: string;
  coverImageUrl?: string;
  startAt: string;
  endAt: string;
  pricePerSeat: number;
  currency: string;
  classStatus: string;
  enrollmentStatus: string;
  mentorName: string;
  mentorAvatar?: string;
  mentorUserId: string;
  enrolledAt: string;
}

export interface Review {
  id: string;
  authorUserId: string;
  authorName: string;
  authorAvatar?: string;
  mentorUserId: string;
  rating: number;
  comment?: string;
  resourceType: string;
  resourceId: string;
  createdAt: string;
}

export interface Order {
  id: string;
  buyerUserId: string;
  type: OrderType;
  resourceId: string;
  amountTotal: number;
  currency: string;
  status: string;
  paymentProvider?: string;
  providerPaymentId?: string;
  createdAt: string;
}

// ===== Course Models =====

export interface MentorCourseDto {
  id: string;
  title: string;
  shortDescription?: string;
  coverImageUrl?: string;
  coverImagePosition?: string;
  coverImageTransform?: string;
  price: number;
  currency: string;
  status: CourseStatus;
  level: CourseLevel;
  totalLectures: number;
  totalDurationSec: number;
  enrollmentCount: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseAdminNoteEditDto {
  id: string;
  noteType: string;
  flag: string | null;
  content: string;
  lectureId: string | null;
  lectureTitle: string | null;
  createdAt: string;
}

export interface CourseEditDto {
  id: string;
  title: string;
  shortDescription?: string;
  description?: string;
  coverImageUrl?: string;
  coverImagePosition?: string;
  coverImageTransform?: string;
  promoVideoKey?: string;
  price: number;
  currency: string;
  status: CourseStatus;
  level: CourseLevel;
  language: string;
  category?: string;
  whatYouWillLearn: string[];
  requirements: string[];
  targetAudience: string[];
  totalDurationSec: number;
  totalLectures: number;
  sections: CourseSectionEditDto[];
  adminNotes?: CourseAdminNoteEditDto[];
}

export interface CourseSectionEditDto {
  id: string;
  title: string;
  sortOrder: number;
  lectures: CourseLectureEditDto[];
}

export interface CourseLectureEditDto {
  id: string;
  title: string;
  description?: string;
  videoKey?: string;
  durationSec: number;
  sortOrder: number;
  isPreview: boolean;
  type: LectureType;
  textContent?: string;
  isActive?: boolean;
}

export interface PublicCourseDto {
  id: string;
  title: string;
  shortDescription?: string;
  coverImageUrl?: string;
  coverImagePosition?: string;
  coverImageTransform?: string;
  price: number;
  currency: string;
  level: CourseLevel;
  category?: string;
  mentorName: string;
  mentorAvatar?: string;
  totalLectures: number;
  totalDurationSec: number;
  ratingAvg: number;
  ratingCount: number;
  enrollmentCount: number;
}

export interface PublicCoursesResponse {
  items: PublicCourseDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface CourseDetailDto {
  id: string;
  title: string;
  shortDescription?: string;
  description?: string;
  coverImageUrl?: string;
  coverImagePosition?: string;
  coverImageTransform?: string;
  promoVideoKey?: string;
  price: number;
  currency: string;
  level: CourseLevel;
  language: string;
  category?: string;
  whatYouWillLearn: string[];
  requirements: string[];
  targetAudience: string[];
  totalLectures: number;
  totalDurationSec: number;
  ratingAvg: number;
  ratingCount: number;
  enrollmentCount: number;
  mentorId: string;
  mentorName: string;
  mentorAvatar?: string;
  mentorBio?: string;
  isEnrolled: boolean;
  isOwnCourse: boolean;
  sections: CourseDetailSectionDto[];
}

export interface CourseDetailSectionDto {
  id: string;
  title: string;
  sortOrder: number;
  lectures: CourseDetailLectureDto[];
}

export interface CourseDetailLectureDto {
  id: string;
  title: string;
  durationSec: number;
  isPreview: boolean;
  type: LectureType;
}

export interface PreviewLectureDto {
  lectureId: string;
  title: string;
  description?: string;
  type: string;
  videoUrl?: string;
  textContent?: string;
  durationSec: number;
}

export interface CoursePlayerDto {
  courseId: string;
  courseTitle: string;
  currentLecture: CoursePlayerLectureDto;
  sections: CoursePlayerSectionDto[];
}

export interface CoursePlayerLectureDto {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  type: LectureType;
  textContent?: string;
  durationSec: number;
  watchedSec: number;
  lastPositionSec: number;
  isCompleted: boolean;
}

export interface CoursePlayerSectionDto {
  id: string;
  title: string;
  lectures: CoursePlayerSectionLectureDto[];
}

export interface CoursePlayerSectionLectureDto {
  id: string;
  title: string;
  durationSec: number;
  isCompleted: boolean;
  isActive: boolean;
  type: LectureType;
}

export interface EnrolledCourseDto {
  courseId: string;
  courseTitle: string;
  coverImageUrl?: string;
  coverImagePosition?: string;
  coverImageTransform?: string;
  mentorName: string;
  completionPercentage: number;
  lastAccessedAt?: string;
  totalLectures: number;
  completedLectures: number;
}

export interface CourseProgressDto {
  courseId: string;
  courseTitle: string;
  completionPercentage: number;
  totalLectures: number;
  completedLectures: number;
  sections: CourseProgressSectionDto[];
}

export interface CourseProgressSectionDto {
  id: string;
  title: string;
  lectures: CourseProgressLectureDto[];
}

export interface CourseProgressLectureDto {
  id: string;
  title: string;
  isCompleted: boolean;
  watchedSec: number;
  durationSec: number;
}

export interface LectureNoteDto {
  id: string;
  lectureId: string;
  timestampSec: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ===== Messaging Models =====

export interface ConversationDto {
  bookingId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  offeringTitle: string;
  bookingStartAt: string;
  bookingEndAt: string;
  bookingStatus: string;
  lastMessageContent: string | null;
  lastMessageAt: string | null;
  lastMessageIsOwn: boolean;
  unreadCount: number;
}

export interface VideoUploadUrlResponse {
  uploadUrl: string;
  videoKey: string;
  expiresInSeconds: number;
}