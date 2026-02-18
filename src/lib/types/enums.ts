export enum UserRole {
  Student = 'Student',
  Mentor = 'Mentor',
  Admin = 'Admin',
}

export enum BookingStatus {
  PendingPayment = 'PendingPayment',
  Confirmed = 'Confirmed',
  Cancelled = 'Cancelled',
  Completed = 'Completed',
  NoShow = 'NoShow',
  Disputed = 'Disputed',
  Expired = 'Expired',
}

export enum VerificationType {
  Basic = 'Basic',
  University = 'University',
  Ranking = 'Ranking',
  Identity = 'Identity',
}

export enum OrderType {
  Booking = 'Booking',
  GroupClass = 'GroupClass',
  Course = 'Course',
}

export enum EnrollmentStatus {
  PendingPayment = 'PendingPayment',
  Confirmed = 'Confirmed',
  Cancelled = 'Cancelled',
  Attended = 'Attended',
  NoShow = 'NoShow',
  Refunded = 'Refunded',
}

export enum CourseStatus {
  Draft = 'Draft',
  PendingReview = 'PendingReview',
  RevisionRequested = 'RevisionRequested',
  Rejected = 'Rejected',
  Published = 'Published',
  Archived = 'Archived',
}

export enum CourseLevel {
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced',
  AllLevels = 'AllLevels',
}

export enum LectureType {
  Video = 'Video',
  Text = 'Text',
}

export enum CourseEnrollmentStatus {
  PendingPayment = 'PendingPayment',
  Active = 'Active',
  Refunded = 'Refunded',
}

export enum ClassStatus {
  Draft = 'Draft',
  Published = 'Published',
  Cancelled = 'Cancelled',
  Completed = 'Completed',
}