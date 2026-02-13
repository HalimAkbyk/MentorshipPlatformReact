const ERROR_MAP: Record<string, string> = {
  // Auth
  'Invalid email or password': 'E-posta veya şifre hatalı.',
  'User is suspended': 'Hesabınız askıya alınmış.',
  'Email already exists': 'Bu e-posta adresi zaten kayıtlı.',
  'Password is too weak': 'Şifre yeterince güçlü değil.',

  // Authorization
  'Unauthorized': 'Bu işlem için giriş yapmanız gerekiyor.',
  'Forbidden': 'Bu işlem için yetkiniz yok.',

  // General
  'Validation failed': 'Girilen bilgiler geçersiz.',
  'An error occurred': 'Bir hata oluştu. Lütfen tekrar deneyin.',

  // Availability
  'No availability template found': 'Henüz müsaitlik programı oluşturulmamış. Müsaitlik sayfasından programınızı belirleyin.',
  'Offering not found': 'Paket bulunamadı.',
};
const DEFAULT_ERROR_MESSAGE =
  'Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
export function localizeErrorMessage(message: string): string {
    if (!message) return DEFAULT_ERROR_MESSAGE;
    if (ERROR_MAP[message]) return ERROR_MAP[message];
  // Tanımsız tüm hatalar
  return DEFAULT_ERROR_MESSAGE;
}
