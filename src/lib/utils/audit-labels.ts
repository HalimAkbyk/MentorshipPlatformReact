export const ENTITY_TYPE_LABELS: Record<string, string> = {
  Booking: 'Birebir Ders',
  VideoSession: 'Video Oturumu',
  Order: 'Siparis',
  CourseEnrollment: 'Kurs Kaydi',
  Course: 'Kurs',
  ClassEnrollment: 'Sinif Kaydi',
  GroupClass: 'Grup Dersi',
};

export const ACTION_LABELS: Record<string, string> = {
  StatusChanged: 'Durum Degisikligi',
  ParticipantJoined: 'Katilimci Katildi',
  ParticipantConnected: 'Katilimci Baglandi',
  ParticipantDisconnected: 'Katilimci Ayrildi',
  Created: 'Olusturuldu',
  RescheduleRequested: 'Erteleme Talep Edildi',
  RescheduleApproved: 'Erteleme Onaylandi',
  RescheduleRejected: 'Erteleme Reddedildi',
  Rescheduled: 'Ertelendi',
  EarlyEndAttempt: 'Erken Bitirme Girisimi',
  Cancelled: 'Iptal Edildi',
  Completed: 'Tamamlandi',
  DisputeResolved: 'Ihtilaf Cozuldu',
  Reconciled: 'Mutabakat',
  PaymentProcessingFailed: 'Odeme Basarisiz',
  Error: 'Hata',
  SubmittedForReview: 'Incelemeye Gonderildi',
};

export const ROLE_LABELS: Record<string, string> = {
  Mentor: 'Mentor',
  Student: 'Ogrenci',
  Admin: 'Yonetici',
  System: 'Sistem',
};

export function localizeEntityType(val: string): string {
  return ENTITY_TYPE_LABELS[val] || val;
}

export function localizeAction(val: string): string {
  return ACTION_LABELS[val] || val;
}

export function localizeRole(val: string): string {
  return ROLE_LABELS[val] || val;
}
