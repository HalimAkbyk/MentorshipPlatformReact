export type PendingVerificationDto = {
  id: string;
  mentorUserId: string;
  mentorName?: string;
  type: string;      // "University" | "Ranking" | ...
  status: string;    // "Pending" | "Approved" | "Rejected"
  documentUrl?: string | null;
  createdAt?: string;
};

export type VerificationDto = {
  id: string;
  type: string;
  status: string;
  documentUrl?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  notes?: string | null;
};

export type PendingMentorDto = {
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
  email: string;
  university?: string | null;
  department?: string | null;
  graduationYear?: number | null;
  headline?: string | null;
  bio?: string | null;
  hourlyRate?: number | null;
  isListed: boolean;
  createdAt: string;
  city?: string | null;
  educationStatus?: string | null;
  categories?: string | null;
  subtopics?: string | null;
  languages?: string | null;
  certifications?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  sessionFormats?: string | null;
  offeringCount: number;
  hasAvailability: boolean;
  verifications: VerificationDto[];
};

export type PendingRefundDto = {
  id: string;                // OrderId
  bookingId?: string;        // Order.ResourceId
  requesterUserId?: string;  // BuyerUserId
  amount?: number;
  currency?: string;
  status: string;            // "Pending" (biz backend'te böyle döndüreceğiz)
  createdAt?: string;
};