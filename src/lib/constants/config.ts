export const APP_CONFIG = {
  APP_NAME: 'MentorHub',
  APP_DESCRIPTION: 'Derece yapmış öğrencilerden mentorluk al',
  SUPPORT_EMAIL: 'support@mentorhub.com',
  ITEMS_PER_PAGE: 20,
  MAX_UPLOAD_SIZE_MB: 5,
  MIN_BOOKING_ADVANCE_HOURS: 2,
  SESSION_REMINDER_TIMES: [24, 1, 0.166], // hours
} as const;