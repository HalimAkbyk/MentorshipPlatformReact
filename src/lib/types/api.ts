import { Booking, MentorListItem, Review } from './models';
import { UserRole, BookingStatus, VerificationType, OrderType} from './enums';
export interface ApiResponse<T> {
  data?: T;
  errors?: string[];
  isSuccess: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Auth
export interface AuthResponse {
  userId: string;
  accessToken: string;
  refreshToken: string;
  roles: UserRole[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  displayName: string;
  initialRole: UserRole;
}

// Mentors
export interface MentorFilters {
  searchTerm?: string;
  university?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
}
export type MentorOffering = {
  id: string;
  title: string;
  durationMin: number;   
  price: number;         
  currency: string;
};


export interface CreateMentorProfileRequest {
  university: string;
  department: string;
  bio: string;
  graduationYear?: number;
  headline?: string;
}

export interface UpdateMentorProfileRequest {
  bio: string;
  headline?: string;
  graduationYear?: number;
}

// Bookings
export interface CreateBookingRequest {
  mentorUserId: string;
  offeringId: string;
  startAt: string;
  durationMin: number;
  notes?: string;
}

export interface CancelBookingRequest {
  reason: string;
}

// Orders & Payments
export interface CreateOrderRequest {
  type: OrderType;
  resourceId: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  paymentUrl?: string;
}

// Reviews
export interface CreateReviewRequest {
  bookingId: string;
  rating: number;
  comment?: string;
}

export interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// Availability
export interface CreateAvailabilitySlotRequest {
  startAt: string;
  endAt: string;
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly';
    endDate: string;
  };
}

// Group Classes
export interface CreateGroupClassRequest {
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  capacity: number;
  pricePerSeat: number;
}

// Video
export interface VideoTokenRequest {
  roomName: string;
  isHost?: boolean;
}

export interface VideoTokenResponse {
  token: string;
  roomName: string;
  expiresInSeconds: number;
}

export interface CreateVideoSessionRequest {
  resourceType: string;
  resourceId: string;
}

export interface VideoSessionResponse {
  sessionId: string;
  roomName: string;
}

// Settings
export interface UpdateProfileRequest {
  displayName?: string;
  email?: string;
  phone?: string;
  birthYear?: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  marketingNotifications: boolean;
}

// Admin
export interface VerificationApprovalRequest {
  verificationId: string;
  isApproved: boolean;
  notes?: string;
}

export interface RefundApprovalRequest {
  refundId: string;
  isApproved: boolean;
  reason?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
}

export interface ProfileFormData {
  displayName: string;
  email: string;
  phone?: string;
}

export interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface BookingFormData {
  startAt: string;
  notes?: string;
}

export interface ReviewFormData {
  rating: number;
  comment?: string;
}

export interface MentorProfileFormData {
  university: string;
  department: string;
  graduationYear?: number;
  bio: string;
  headline?: string;
}

export interface PricingFormData {
  hourlyRate: number;
  duration30?: boolean;
  duration60?: boolean;
  duration90?: boolean;
}

export interface VerificationFormData {
  studentCard?: File;
  transcriptOrResult?: File;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface FilterState {
  searchTerm: string;
  university: string;
  minPrice?: number;
  maxPrice?: number;
  page: number;
  pageSize: number;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface MentorCardProps {
  mentor: MentorListItem;
  onClick?: () => void;
}

export interface BookingCardProps {
  booking: Booking;
  onCancel?: (id: string) => void;
  onReview?: (id: string) => void;
}

export interface ReviewModalProps {
  bookingId: string;
  mentorName: string;
  onClose: () => void;
  onSubmit: () => void;
}

export interface RatingSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface ReviewListProps {
  reviews: Review[];
  isLoading?: boolean;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isBookingStatus(value: string): value is BookingStatus {
  return Object.values(BookingStatus).includes(value as BookingStatus);
}

export function isUserRole(value: string): value is UserRole {
  return Object.values(UserRole).includes(value as UserRole);
}

export function isOrderType(value: string): value is OrderType {
  return Object.values(OrderType).includes(value as OrderType);
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  [BookingStatus.PendingPayment]: 'Ödeme Bekleniyor',
  [BookingStatus.Confirmed]: 'Onaylandı',
  [BookingStatus.Cancelled]: 'İptal Edildi',
  [BookingStatus.Completed]: 'Tamamlandı',
  [BookingStatus.NoShow]: 'Katılım Yok',
  [BookingStatus.Disputed]: 'İtirazlı',
};

export const VERIFICATION_TYPE_LABELS: Record<VerificationType, string> = {
  [VerificationType.Basic]: 'Temel Doğrulama',
  [VerificationType.University]: 'Üniversite Doğrulaması',
  [VerificationType.Ranking]: 'Sıralama Doğrulaması',
  [VerificationType.Identity]: 'Kimlik Doğrulaması',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.Student]: 'Danışan',
  [UserRole.Mentor]: 'Mentör',
  [UserRole.Admin]: 'Yönetici',
};