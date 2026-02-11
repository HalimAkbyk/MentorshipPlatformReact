export type MyMentorProfile = {
  university: string;
  department: string;
  bio: string;
  graduationYear?: number | null;
  headline?: string | null;
  isListed: boolean;
  isApprovedForBookings: boolean; // ✅ En az bir verification onaylıysa true
  verifications: MentorVerification[]; // ✅ Doğrulama belgelerinin durumu
};

export type MyMentorOffering = {
  id: string;
  type: string;
  title: string;
  durationMinDefault: number;
  priceAmount: number;
  currency: string;
  isActive: boolean;
};

export type MentorVerificationStatus = 'Pending' | 'Approved' | 'Rejected';

export type MentorVerification = {
  id: string;
  type: string;
  status: MentorVerificationStatus;
  documentUrl?: string;
  reviewedAt?: string;
  notes?: string;
};

export type MentorProfileDetail = MyMentorProfile & {
  verifications: MentorVerification[];
};