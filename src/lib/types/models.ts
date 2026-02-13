import { UserRole,VerificationType,BookingStatus,ClassStatus,OrderType } from './enums';

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
  startAt: string;
  endAt: string;
  durationMin: number;
  status: BookingStatus;
  price: number;
  currency: string;
  // NOT: Backend'de studentName yok, sadece detail'de var
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
  startAt: string;
  endAt: string;
  durationMin: number;
  status: BookingStatus;
  offeringTitle: string;
  price: number;
  currency: string;
  cancellationReason?: string;
  hasReview?: boolean;
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
  startAt: string;
  endAt: string;
  capacity: number;
  enrolledCount: number;
  pricePerSeat: number;
  currency: string;
  status: ClassStatus;
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