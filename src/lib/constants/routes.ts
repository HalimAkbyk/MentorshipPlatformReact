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
  MENTOR_DASHBOARD: '/mentor/dashboard',
  MENTOR_AVAILABILITY: '/mentor/availability',
  MENTOR_EARNINGS: '/mentor/earnings',
  MENTOR_BOOKINGS: '/mentor/bookings',
  MENTOR_OFFERINGS: '/mentor/offerings',
  MENTOR_SETTINGS: '/mentor/settings',
  
  // Mentor Courses
  MENTOR_COURSES: '/mentor/courses',
  MENTOR_COURSE_NEW: '/mentor/courses/new',
  MENTOR_COURSE_EDIT: (id: string) => `/mentor/courses/${id}/edit`,

  // Student Courses
  STUDENT_COURSES: '/student/courses',
  COURSE_CATALOG: '/public/courses',
  COURSE_DETAIL: (id: string) => `/public/courses/${id}`,
  COURSE_PLAYER: (courseId: string) => `/student/courses/${courseId}/learn`,

  // Classroom
  CLASSROOM: (sessionId: string) => `/student/classroom/${sessionId}`,

  // Onboarding
  MENTOR_ONBOARDING: '/auth/onboarding/mentor',
  STUDENT_ONBOARDING: '/auth/onboarding/student',
} as const;