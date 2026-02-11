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
}

export enum VerificationType {
  Basic = 'Basic',
  University = 'University',
  Ranking = 'Ranking',
  Identity = 'Identity',
}

export enum OrderType {
  Booking = 'Booking',
  ClassSeat = 'ClassSeat',
}

export enum ClassStatus {
  Draft = 'Draft',
  Published = 'Published',
  Cancelled = 'Cancelled',
  Completed = 'Completed',
}