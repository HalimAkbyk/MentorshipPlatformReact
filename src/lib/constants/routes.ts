export const ROUTES = {
  HOME: '/public',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  MENTORS: '/public/mentors',
  MENTOR_PROFILE: (id: string) => `/public/mentors/${id}`,
  
  // Student
  STUDENT_DASHBOARD: '/student/dashboard',
  BOOKINGS: '/student/bookings',
  BOOKING_DETAIL: (id: string) => `/student/bookings/${id}`,
  NEW_BOOKING: '/student/bookings/new',
  SETTINGS: '/student/settings',
  
  // Mentor
  MENTOR_DASHBOARD: '/public/mentor/dashboard',
  MENTOR_AVAILABILITY: '/public/mentor/availability',
  MENTOR_EARNINGS: '/public/mentor/earnings',
  MENTOR_SETTINGS: '/public/mentor/settings',
  
  // Classroom
  CLASSROOM: (sessionId: string) => `/student/classroom/${sessionId}`,
  
  // Onboarding
  MENTOR_ONBOARDING: '/auth/onboarding/mentor',
  STUDENT_ONBOARDING: '/auth/onboarding/student',
} as const;