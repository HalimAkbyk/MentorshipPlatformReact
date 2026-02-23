import { apiClient } from './client';

// ===== Student Onboarding Types =====
export interface StudentOnboardingData {
  id?: string;
  city?: string | null;
  gender?: string | null;
  status?: string | null;
  statusDetail?: string | null;
  goals?: string | null;
  categories?: string | null;
  subtopics?: string | null;
  level?: string | null;
  preferences?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  availability?: string | null;
  sessionFormats?: string | null;
}

// ===== Mentor Onboarding Types =====
export interface MentorOnboardingData {
  id?: string;
  mentorType?: string | null;
  city?: string | null;
  timezone?: string | null;
  languages?: string | null;
  categories?: string | null;
  subtopics?: string | null;
  targetAudience?: string | null;
  experienceLevels?: string | null;
  yearsOfExperience?: string | null;
  currentRole?: string | null;
  currentCompany?: string | null;
  previousCompanies?: string | null;
  education?: string | null;
  certifications?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  yksExamType?: string | null;
  yksScore?: string | null;
  yksRanking?: string | null;
  mentoringTypes?: string | null;
  sessionFormats?: string | null;
  offerFreeIntro?: boolean;
}

// ===== API =====
export const onboardingApi = {
  // Student
  getStudentOnboarding: async (): Promise<StudentOnboardingData | null> => {
    const res = await apiClient.get<StudentOnboardingData | null>('/onboarding/student');
    return res;
  },

  saveStudentOnboarding: async (data: StudentOnboardingData): Promise<StudentOnboardingData> => {
    const res = await apiClient.put<StudentOnboardingData>('/onboarding/student', data);
    return res;
  },

  // Mentor
  getMentorOnboarding: async (): Promise<MentorOnboardingData | null> => {
    const res = await apiClient.get<MentorOnboardingData | null>('/onboarding/mentor');
    return res;
  },

  saveMentorOnboarding: async (data: MentorOnboardingData): Promise<MentorOnboardingData> => {
    const res = await apiClient.put<MentorOnboardingData>('/onboarding/mentor', data);
    return res;
  },
};
