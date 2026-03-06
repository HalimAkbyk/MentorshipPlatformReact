'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { MermaidDiagram } from '@/components/admin/mermaid-diagram';
import {
  Map,
  Users,
  GraduationCap,
  CreditCard,
  Video,
  Bell,
  TrendingUp,
  ShieldCheck,
  Workflow,
  Package,
} from 'lucide-react';

// ─── Section definitions ────────────────────────────────

interface WikiSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  diagram: string;
  notes?: string[];
}

const SECTIONS: WikiSection[] = [
  {
    id: 'overview',
    label: 'Genel Bakis',
    icon: <Map className="h-4 w-4" />,
    title: 'Platform Genel Bakis',
    description: 'Degisim Mentorluk platformunun 3 temel rolu ve ana modulleri.',
    diagram: `flowchart TB
      PLATFORM["<b>DEGISIM MENTORLUK</b><br/>TYT/AYT Egitim Platformu v1.2"]

      PLATFORM --> ADMIN["<b>ADMIN</b><br/>Yonetici"]
      PLATFORM --> EGITMEN["<b>EGITMEN</b><br/>Instructor"]
      PLATFORM --> OGRENCI["<b>OGRENCI</b><br/>Student"]

      ADMIN --> A1["Kullanici Yonetimi"]
      ADMIN --> A2["Egitim Yonetimi"]
      ADMIN --> A3["Finans & Paketler"]
      ADMIN --> A4["CMS & Ayarlar"]
      ADMIN --> A5["Performans & Hakedis"]

      EGITMEN --> E1["1:1 Ders Paketleri"]
      EGITMEN --> E2["Grup Dersleri"]
      EGITMEN --> E3["Video Egitimler"]
      EGITMEN --> E4["Kazanc & Performans"]

      OGRENCI --> S1["Ders Rezervasyonu"]
      OGRENCI --> S2["Paket & Kredi"]
      OGRENCI --> S3["Video Izleme"]
      OGRENCI --> S4["Mesajlasma"]

      style PLATFORM fill:#84cc16,color:#0f172a,stroke:#65a30d
      style ADMIN fill:#3b82f6,color:#fff,stroke:#2563eb
      style EGITMEN fill:#f59e0b,color:#0f172a,stroke:#d97706
      style OGRENCI fill:#8b5cf6,color:#fff,stroke:#7c3aed`,
    notes: [
      'Admin: Tum platform yonetimi, kullanici rolleri, icerik onaylari',
      'Egitmen: Admin tarafindan atanir (EXTERNAL_MENTOR_REGISTRATION kapali)',
      'Ogrenci: Kayit olur, onboarding tamamlar, ders/paket satin alir',
    ],
  },
  {
    id: 'auth',
    label: 'Kimlik Dogrulama',
    icon: <Users className="h-4 w-4" />,
    title: 'Kayit & Giris Akisi',
    description: 'Kullanici kayit, onboarding ve rol bazli yonlendirme akisi.',
    diagram: `flowchart TD
      START["Anasayfa"] --> CHOICE{Kayit / Giris}

      CHOICE -->|Yeni Kayit| SIGNUP["Email + Sifre<br/>Varsayilan Rol: Student"]
      CHOICE -->|Mevcut Kullanici| LOGIN["Email + Sifre"]

      SIGNUP --> VERIFY["Email Dogrulama"]
      VERIFY --> JWT["JWT Token Olustur"]
      LOGIN --> JWT

      JWT --> ROLE_CHECK{Rol Kontrolu}

      ROLE_CHECK -->|Admin| ADMIN_PANEL["/admin/dashboard"]
      ROLE_CHECK -->|Mentor| MENTOR_CHECK{Onboarding<br/>Tamamlandi?}
      ROLE_CHECK -->|Student| STUDENT_CHECK{Onboarding<br/>Tamamlandi?}

      MENTOR_CHECK -->|Hayir| MENTOR_ONB["Mentor Onboarding<br/>Bio, Deneyim, Sertifika,<br/>Kategoriler, Seans Tipleri"]
      MENTOR_CHECK -->|Evet| MENTOR_PANEL["/mentor/panel"]
      MENTOR_ONB --> ADMIN_REVIEW["Admin Incelemesi"]
      ADMIN_REVIEW -->|Onay| MENTOR_PANEL
      ADMIN_REVIEW -->|Red| REJECTED["Geri Bildirim"]

      STUDENT_CHECK -->|Hayir| STUDENT_ONB["Ogrenci Onboarding<br/>Sehir, Cinsiyet, Hedefler,<br/>Kategoriler, Butce, Musaitlik"]
      STUDENT_CHECK -->|Evet| STUDENT_PANEL["/student/panel"]
      STUDENT_ONB --> STUDENT_PANEL

      style JWT fill:#84cc16,color:#0f172a
      style ADMIN_PANEL fill:#3b82f6,color:#fff
      style MENTOR_PANEL fill:#f59e0b,color:#0f172a
      style STUDENT_PANEL fill:#8b5cf6,color:#fff`,
    notes: [
      'Feature Flag: EXTERNAL_MENTOR_REGISTRATION — Aciksa mentorler kendileri kayit olabilir, kapaliysa sadece admin atar',
      'JWT token icinde roller, userId, displayName bilgisi bulunur',
      'Ogrenci onboarding: 7 adimli wizard (sehir, hedefler, TYT/AYT kategorileri, butce vb.)',
    ],
  },
  {
    id: 'booking',
    label: '1:1 Ders Akisi',
    icon: <GraduationCap className="h-4 w-4" />,
    title: 'Bire Bir Ders Rezervasyon Akisi',
    description: 'Ogrencinin egitmen secimi, saat secimi, odeme ve ders sureci.',
    diagram: `flowchart TD
      BROWSE["Egitmen Listesi<br/>/public/mentors"] --> PROFILE["Egitmen Profili<br/>Bio, Rating, Paketler"]
      PROFILE --> SELECT["Paket Sec<br/>(Offering)"]
      SELECT --> TIMESLOT["Musait Saat Sec<br/>(Computed Slots)"]

      TIMESLOT --> QUESTIONS["Ders Sorularini<br/>Doldur"]
      QUESTIONS --> ORDER["Siparis Olustur<br/>OrderType: Booking"]

      ORDER --> PAY_CHECK{Odeme<br/>Yontemi}
      PAY_CHECK -->|Kredi| CREDIT_DEDUCT["Kredi Dus<br/>CreditType: PrivateLesson"]
      PAY_CHECK -->|Iyzico| IYZICO["Iyzico Odeme<br/>Formu"]

      CREDIT_DEDUCT --> CONFIRMED
      IYZICO --> CALLBACK["Iyzico Callback<br/>Vercel → Backend"]
      CALLBACK --> CONFIRMED["Booking Onaylandi<br/>Status: Confirmed"]

      CONFIRMED --> NOTIF["Bildirim Gonder<br/>(Egitmen + Ogrenci)"]
      NOTIF --> WAIT["Planlanan Saatte"]
      WAIT --> CLASSROOM["Video Sinif<br/>(Twilio Group Room)"]

      CLASSROOM --> END_SESSION["Ders Bitis"]
      END_SESSION --> REVIEW["Degerlendirme<br/>(1-5 Yildiz)"]
      END_SESSION --> LOG["InstructorSessionLog<br/>Kaydedilir"]

      style CONFIRMED fill:#84cc16,color:#0f172a
      style CLASSROOM fill:#06b6d4,color:#0f172a
      style IYZICO fill:#f59e0b,color:#0f172a`,
    notes: [
      'Musait saatler: AvailabilityTemplate (haftalik kurallar) + Override + mevcut booking\'ler hesaplanir',
      'Her offering kendi AvailabilityTemplate\'ine sahip olabilir, yoksa mentor default template kullanilir',
      'Slot booking lifecycle: CreateBooking → Odeme bekle → Odeme sonrasi slot IsBooked=true',
      'BookingStatus: PendingPayment → Confirmed → Completed/Cancelled/NoShow/Disputed',
    ],
  },
  {
    id: 'packages',
    label: 'Paket & Kredi',
    icon: <Package className="h-4 w-4" />,
    title: 'Paket Satin Alma & Kredi Sistemi',
    description: 'Ogrenci paket satin alir, kredi olarak dagitilir, dersler icin kullanilir.',
    diagram: `flowchart TD
      BROWSE["Paket Listesi<br/>/public/packages"] --> SELECT["Paket Sec<br/>Fiyat, Kredi Miktari, Sure"]
      SELECT --> ORDER["Siparis Olustur<br/>OrderType: Package"]
      ORDER --> IYZICO["Iyzico Odeme"]
      IYZICO --> VERIFY["Odeme Dogrulama"]

      VERIFY --> PURCHASE["PackagePurchase<br/>Olusturuldu"]

      PURCHASE --> CREDIT_PL["StudentCredit<br/>PrivateLesson<br/>+N Kredi"]
      PURCHASE --> CREDIT_GL["StudentCredit<br/>GroupLesson<br/>+N Kredi"]
      PURCHASE --> CREDIT_VA["StudentCredit<br/>VideoAccess<br/>+N Kredi"]

      CREDIT_PL --> USE_PL["1:1 Ders<br/>Rezervasyonu"]
      CREDIT_GL --> USE_GL["Grup Dersine<br/>Kayit"]
      CREDIT_VA --> USE_VA["Video Kursa<br/>Erisim"]

      USE_PL --> TX_PL["CreditTransaction<br/>Type: Deduction"]
      USE_GL --> TX_GL["CreditTransaction<br/>Type: Deduction"]
      USE_VA --> TX_VA["CreditTransaction<br/>Type: Deduction"]

      PURCHASE --> EXPIRE["ExpireCreditJob<br/>(Gunluk 03:00 UTC)<br/>Sure doldu → Expiration"]

      style PURCHASE fill:#84cc16,color:#0f172a
      style CREDIT_PL fill:#3b82f6,color:#fff
      style CREDIT_GL fill:#f59e0b,color:#0f172a
      style CREDIT_VA fill:#8b5cf6,color:#fff
      style EXPIRE fill:#ef4444,color:#fff`,
    notes: [
      'Her paket 3 tip kredi icerir: PrivateLesson, GroupLesson, VideoAccess',
      'Kredi suresi: Paket ValidityDays kadar gecerli',
      'CreditTransaction ile tum hareketler izlenir: Purchase, Deduction, Expiration, Refund',
      'Hangfire Job: ExpireCreditJob her gun 03:00 UTC de suresi dolan kredileri sifirlar',
    ],
  },
  {
    id: 'payment',
    label: 'Odeme Akisi',
    icon: <CreditCard className="h-4 w-4" />,
    title: 'Iyzico Odeme Entegrasyonu',
    description: 'Tum odeme tipleri icin ortak Iyzico odeme akisi.',
    diagram: `flowchart TD
      TRIGGER{Odeme Tetikleyici}

      TRIGGER -->|"1:1 Ders"| OT1["OrderType: Booking"]
      TRIGGER -->|"Grup Dersi"| OT2["OrderType: GroupClass"]
      TRIGGER -->|"Video Kurs"| OT3["OrderType: Course"]
      TRIGGER -->|"Kredi Paketi"| OT4["OrderType: Package"]

      OT1 --> CREATE_ORDER
      OT2 --> CREATE_ORDER
      OT3 --> CREATE_ORDER
      OT4 --> CREATE_ORDER

      CREATE_ORDER["Siparis Olustur<br/>Status: Pending"] --> IYZICO_FORM["Iyzico Checkout<br/>Form Olustur"]
      IYZICO_FORM --> USER_PAY["Kullanici Odeme<br/>Bilgilerini Girer"]

      USER_PAY --> RESULT{Sonuc}
      RESULT -->|Basarili| CALLBACK["Iyzico Callback"]
      RESULT -->|Basarisiz| FAILED["Order: Failed"]

      CALLBACK --> VERCEL["Vercel route.ts<br/>(Frontend Relay)"]
      VERCEL --> BACKEND["Backend<br/>verify-callback"]

      BACKEND --> PAID["Order: Paid"]
      PAID --> POST{Post-Payment}

      POST -->|Booking| PP1["Booking → Confirmed<br/>Slot → IsBooked<br/>Ledger Entry"]
      POST -->|GroupClass| PP2["Enrollment → Confirmed<br/>Ledger Entry"]
      POST -->|Course| PP3["CourseEnrollment → Active<br/>Ledger Entry"]
      POST -->|Package| PP4["PackagePurchase<br/>StudentCredits<br/>CreditTransactions"]

      style PAID fill:#84cc16,color:#0f172a
      style FAILED fill:#ef4444,color:#fff
      style VERCEL fill:#06b6d4,color:#0f172a`,
    notes: [
      'Iyzico callback Koyeb yerine Vercel frontend e gelir (Koyeb edge network dis callback lari duser)',
      'Vercel route.ts callback i alir, backend verify-callback endpoint ine iletir',
      'Platform komisyonu: 1:1 Ders %7, Grup Dersi %7, Video Kurs %7, Paket %0 (tum gelir platforma)',
      'OrderStatus: Pending → Paid / Failed / Abandoned / Refunded / PartiallyRefunded',
    ],
  },
  {
    id: 'video',
    label: 'Video Sinif',
    icon: <Video className="h-4 w-4" />,
    title: 'Twilio Video Oturumu',
    description: 'Canli ders icin Twilio video entegrasyonu ve oda yonetimi.',
    diagram: `flowchart TD
      START_1["Egitmen: Dersi Baslat"] --> CREATE["CreateVideoSession<br/>Twilio Room Olustur<br/>(Group Type)"]
      CREATE --> ROOM["Room Name:<br/>booking-{bookingId}<br/>veya group-class-{classId}"]

      ROOM --> TOKEN_M["JWT Token Olustur<br/>Identity: userId|displayName"]
      TOKEN_M --> JOIN_M["Egitmen Katilir"]

      ROOM --> TOKEN_S["JWT Token Olustur<br/>Identity: userId|displayName"]
      TOKEN_S --> JOIN_S["Ogrenci Katilir"]

      JOIN_M --> SESSION["Canli Ders<br/>Video + Audio + Chat"]
      JOIN_S --> SESSION

      SESSION --> CHAT["Chat: Twilio DataTrack<br/>JSON: type CHAT_MESSAGE"]

      SESSION --> END["Ders Bitis"]
      END --> WEBHOOK["Twilio Webhook<br/>participant-disconnected<br/>room-ended"]

      WEBHOOK --> DB_UPDATE["DB Guncelle:<br/>VideoSession → Ended<br/>VideoParticipant → LeftAt<br/>InstructorSessionLog"]

      WEBHOOK --> SIGNALR["SignalR Bildirim<br/>Room Status Degisti"]

      style SESSION fill:#06b6d4,color:#0f172a
      style SIGNALR fill:#84cc16,color:#0f172a
      style WEBHOOK fill:#f59e0b,color:#0f172a`,
    notes: [
      'Twilio rooms: Group type (coklu katilimci destegi)',
      'Identity format: userId|displayName (pipe ile ayrilir)',
      'Chat: Twilio LocalDataTrack uzerinden JSON mesajlar',
      'SignalR: Room durumu degisince anlik bildirim (polling kaldirildi)',
      'Webhook: Localhost ta calismaz, production da Koyeb URL ine gelir',
    ],
  },
  {
    id: 'notifications',
    label: 'Bildirimler',
    icon: <Bell className="h-4 w-4" />,
    title: 'Bildirim Sistemi',
    description: '3 kanalda bildirim: In-App, SignalR real-time, Email.',
    diagram: `flowchart LR
      EVENT["Platform Olaylari"] --> DISPATCH{Dagitim}

      DISPATCH --> INAPP["In-App<br/>UserNotification"]
      DISPATCH --> SIGNALR["SignalR<br/>Real-time"]
      DISPATCH --> EMAIL["Email<br/>(Hangfire Job)"]

      INAPP --> BELL["Bildirim Zili<br/>(Header)"]
      BELL --> DROPDOWN["Dropdown Liste<br/>Okundu/Okunmadi"]

      SIGNALR --> MSG_DELIVER["Mesaj Teslimi<br/>& Okundu Bilgisi"]
      SIGNALR --> ROOM_STATUS["Oda Durumu<br/>Degisikligi"]
      SIGNALR --> CACHE["React Query<br/>Cache Guncelle"]

      EMAIL --> UNREAD_JOB["SendUnreadMessageNotificationJob<br/>(Her 2dk kontrol)<br/>10dk okunmamis → Email"]
      EMAIL --> COOLDOWN["Spam Koruma<br/>MessageNotificationLog<br/>24 saat bekleme"]

      style INAPP fill:#8b5cf6,color:#fff
      style SIGNALR fill:#84cc16,color:#0f172a
      style EMAIL fill:#f59e0b,color:#0f172a`,
    notes: [
      'SignalR Hub: /hubs/chat — JWT auth via query string access_token',
      'Online kullanici takibi: ConcurrentDictionary ile',
      'Email job: Hangfire ile her 2 dakikada kontrol, 10dk okunmamis mesaj varsa email gonder',
      'Spam koruma: Ayni booking+alici icin 24 saat iceinde tekrar email gonderilmez',
    ],
  },
  {
    id: 'performance',
    label: 'Performans',
    icon: <TrendingUp className="h-4 w-4" />,
    title: 'Egitmen Performans & Hakedis',
    description: 'Egitmen aktivite takibi, performans ozeti ve hakedis hesaplama sureci.',
    diagram: `flowchart TD
      subgraph DATA_COLLECTION["Veri Toplama"]
        SESSION["1:1 / Grup Ders<br/>→ InstructorSessionLog"]
        VIDEO["Video Izleme<br/>→ VideoWatchLog"]
      end

      SESSION --> PERF_JOB["CalculatePerformanceSummaryJob<br/>(Gunluk 02:00 UTC)"]
      VIDEO --> PERF_JOB

      PERF_JOB --> SUMMARY["InstructorPerformanceSummary<br/>Aylik / Ceyreklik / Yillik"]
      SUMMARY --> METRICS["Metrikler:<br/>Toplam Ders, Video Izleme,<br/>Canli Sure, Ogrenci Sayisi,<br/>Kredi Tuketimi, Gelir"]

      SUMMARY --> ACCRUAL_JOB["CalculateAccrualJob<br/>(Ayin 1 i 04:00 UTC)"]
      ACCRUAL_JOB --> ACCRUAL["InstructorAccrual<br/>Status: Draft"]

      ACCRUAL --> ADMIN_REVIEW{Admin Inceleme}
      ADMIN_REVIEW -->|Onayla| APPROVED["Status: Approved"]
      ADMIN_REVIEW -->|Iptal| CANCELLED["Status: Cancelled"]

      APPROVED --> PAYMENT["Odeme Yapildi<br/>Status: Paid"]

      subgraph PARAMS["Hakedis Parametreleri"]
        P1["Birebir Ders Birim Fiyat"]
        P2["Grup Ders Birim Fiyat"]
        P3["Video Icerik Birim Fiyat"]
        P4["Minimum Hakedis Tutari"]
      end

      PARAMS --> ACCRUAL_JOB

      style APPROVED fill:#84cc16,color:#0f172a
      style CANCELLED fill:#ef4444,color:#fff
      style PAYMENT fill:#3b82f6,color:#fff
      style PERF_JOB fill:#f59e0b,color:#0f172a
      style ACCRUAL_JOB fill:#f59e0b,color:#0f172a`,
    notes: [
      'InstructorSessionLog: Her ders katiliminda otomatik kaydedilir (Twilio webhook)',
      'VideoWatchLog: Ogrenci video izledikce UpdateLectureProgress uzerinden kaydedilir',
      'Performans ozeti: Gunluk job ile hesaplanir (Monthly, Quarterly, Yearly period tipleri)',
      'Hakedis: Aylik job ile olusturulur → Admin onaylar → Odeme yapilir',
      'AccrualStatus: Draft → Approved → Paid / Cancelled',
    ],
  },
  {
    id: 'admin',
    label: 'Admin Paneli',
    icon: <ShieldCheck className="h-4 w-4" />,
    title: 'Admin Yonetim Modulleri',
    description: 'Admin panelindeki tum yonetim alanlari ve is akislari.',
    diagram: `flowchart TD
      ADMIN["Admin Paneli"] --> USERS["Kullanici Yonetimi"]
      ADMIN --> EDU["Egitim Yonetimi"]
      ADMIN --> FIN["Finans"]
      ADMIN --> PERF["Performans & Hakedis"]
      ADMIN --> CMS["CMS"]
      ADMIN --> SYS["Sistem"]

      USERS --> U1["Kullanici Listesi<br/>Arama, Filtreleme"]
      USERS --> U2["Egitmen Atama<br/>assign-instructor"]
      USERS --> U3["Rol Degistir<br/>Student/Mentor/Admin"]
      USERS --> U4["Askiya Al / Aktif Et"]
      USERS --> U5["Owner Belirle"]

      EDU --> E1["Kurs Olustur<br/>(Admin-created)"]
      EDU --> E2["Egitmen Ata<br/>set-instructor"]
      EDU --> E3["Kurs Inceleme<br/>Onayla / Reddet"]
      EDU --> E4["TYT/AYT Kategorileri<br/>(17 adet seed)"]

      FIN --> F1["Siparisler"]
      FIN --> F2["Iade Talepleri<br/>Onayla / Reddet"]
      FIN --> F3["Mentor Odemeleri"]
      FIN --> F4["Paket Yonetimi<br/>CRUD + Toggle"]

      PERF --> P1["Tum Egitmen Ozetleri"]
      PERF --> P2["Hakedis Parametreleri"]
      PERF --> P3["Hakedis Onayla / Iptal"]

      CMS --> C1["Anasayfa Modulleri"]
      CMS --> C2["Banner & Duyurular"]
      CMS --> C3["Statik Sayfalar"]

      SYS --> S1["Feature Flags"]
      SYS --> S2["Sistem Sagligi"]
      SYS --> S3["Hangfire Jobs"]

      style ADMIN fill:#3b82f6,color:#fff
      style USERS fill:#8b5cf6,color:#fff
      style EDU fill:#84cc16,color:#0f172a
      style FIN fill:#f59e0b,color:#0f172a
      style PERF fill:#06b6d4,color:#0f172a`,
    notes: [
      'Admin Dashboard: Bekleyen onaylar, kurs incelemeleri, iade talepleri sayilari',
      'Egitmen atama: Admin kullaniciya Mentor rolu + InstructorStatus atar',
      'Kurs inceleme: CourseReviewRound ile tur bazli inceleme, LectureReviewComment ile ders bazli geri bildirim',
      'Feature Flags: 12 adet pivot flag — platform davranisini dinamik degistirir',
    ],
  },
  {
    id: 'e2e',
    label: 'Uctan Uca',
    icon: <Workflow className="h-4 w-4" />,
    title: 'Uctan Uca Kullanici Yolculuklari',
    description: 'Ogrenci ve egitmen icin tam kullanici yolculugu.',
    diagram: `flowchart LR
      subgraph STUDENT_JOURNEY["Ogrenci Yolculugu"]
        direction TB
        SJ1["1. Kayit Ol"] --> SJ2["2. Onboarding"]
        SJ2 --> SJ3["3. Egitmen/Ders Ara"]
        SJ3 --> SJ4["4. Paket Satin Al"]
        SJ4 --> SJ5["5. Kredi ile<br/>Ders Rezerve Et"]
        SJ5 --> SJ6["6. Video Derse<br/>Katil"]
        SJ6 --> SJ7["7. Degerlendirme<br/>Yap"]
        SJ7 --> SJ8["8. Ilerleme<br/>Takip Et"]
        SJ8 --> SJ9["9. Yeni Ders /<br/>Paket Al"]
        SJ9 --> SJ5
      end

      subgraph INSTRUCTOR_JOURNEY["Egitmen Yolculugu"]
        direction TB
        IJ1["1. Admin Atar"] --> IJ2["2. Profil Doldur"]
        IJ2 --> IJ3["3. Ders Paketi<br/>Olustur"]
        IJ3 --> IJ4["4. Musaitlik<br/>Ayarla"]
        IJ4 --> IJ5["5. Ogrenci<br/>Rezervasyon Yapar"]
        IJ5 --> IJ6["6. Video Dersi<br/>Yonet"]
        IJ6 --> IJ7["7. Performans<br/>Izle"]
        IJ7 --> IJ8["8. Hakedis<br/>Al"]
        IJ8 --> IJ9["9. Icerik<br/>Gelistir"]
        IJ9 --> IJ3
      end

      style SJ1 fill:#8b5cf6,color:#fff
      style SJ6 fill:#06b6d4,color:#0f172a
      style IJ1 fill:#f59e0b,color:#0f172a
      style IJ6 fill:#06b6d4,color:#0f172a`,
    notes: [
      'Ogrenci dongusu: Paket al → Kredi kullan → Ders al → Tekrarla',
      'Egitmen dongusu: Icerik olustur → Ders ver → Performans izle → Hakedis al → Tekrarla',
      'Her iki taraf da mesajlasma ile surekli iletisimde',
    ],
  },
];

// ─── Feature Flags reference ────────────────────────────

const FEATURE_FLAGS = [
  { key: 'MARKETPLACE_MODE', desc: 'Marketplace ozellikleri (acik pazar)', default: 'OFF' },
  { key: 'EXTERNAL_MENTOR_REGISTRATION', desc: 'Dis mentor kaydi', default: 'OFF' },
  { key: 'MENTOR_SELF_COURSE_CREATION', desc: 'Mentor kendi kursunu olusturabilir', default: 'ON' },
  { key: 'MULTI_CATEGORY_MODE', desc: 'Coklu kategori secimi', default: 'ON' },
  { key: 'COMMISSION_PAYMENT_MODEL', desc: 'Komisyon bazli odeme modeli', default: 'OFF' },
  { key: 'PACKAGE_SYSTEM_ENABLED', desc: 'Paket & Kredi sistemi', default: 'ON' },
  { key: 'PRIVATE_LESSON_ENABLED', desc: '1:1 ders modulu', default: 'ON' },
  { key: 'INSTRUCTOR_SELF_SCHEDULING', desc: 'Egitmen kendi musaitligini ayarlar', default: 'ON' },
  { key: 'INSTRUCTOR_PERFORMANCE_TRACKING', desc: 'Performans takip sistemi', default: 'ON' },
  { key: 'INSTRUCTOR_PERFORMANCE_SELF_VIEW', desc: 'Egitmen kendi performansini gorur', default: 'ON' },
  { key: 'INSTRUCTOR_ACCRUAL_SELF_VIEW', desc: 'Egitmen kendi hakedisini gorur', default: 'ON' },
  { key: 'INSTRUCTOR_COMPARISON_REPORT', desc: 'Egitmenler arasi karsilastirma', default: 'OFF' },
];

// ─── Hangfire Jobs reference ────────────────────────────

const HANGFIRE_JOBS = [
  { name: 'ExpirePendingOrdersJob', schedule: 'Her 5 dk', desc: 'Suresi dolan bekleyen siparisleri iptal eder' },
  { name: 'SendUnreadMessageNotificationJob', schedule: 'Her 2 dk', desc: '10dk okunmamis mesaj → email bildirimi' },
  { name: 'ExpireCreditJob', schedule: 'Gunluk 03:00', desc: 'Suresi dolan kredileri sifirlar' },
  { name: 'CalculatePerformanceSummaryJob', schedule: 'Gunluk 02:00', desc: 'Egitmen performans ozetlerini hesaplar' },
  { name: 'CalculateAccrualJob', schedule: 'Ayin 1\'i 04:00', desc: 'Aylik egitmen hakedislerini olusturur' },
];

// ─── Tech Stack reference ───────────────────────────────

const TECH_STACK = [
  { layer: 'Frontend', items: ['Next.js 14', 'React 18', 'TailwindCSS', 'React Query', 'SignalR Client', 'Twilio Video SDK'] },
  { layer: 'Backend', items: ['.NET 8', 'EF Core 8', 'MediatR (CQRS)', 'FluentValidation', 'Hangfire', 'SignalR Hub'] },
  { layer: 'Database', items: ['PostgreSQL (Neon)', 'Redis (Cache)'] },
  { layer: 'Dis Servisler', items: ['Iyzico (Odeme)', 'Twilio (Video)', 'MinIO (Depolama)', 'SMTP (Email)'] },
  { layer: 'Deploy', items: ['Koyeb (Backend)', 'Vercel (Frontend)', 'Docker Hub (Image)'] },
];

// ─── Page Component ─────────────────────────────────────

export default function WikiPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const currentSection = SECTIONS.find((s) => s.id === activeSection);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Platform Wiki</h1>
        <p className="text-slate-400 mt-1">
          Degisim Mentorluk — TYT/AYT Egitim Platformu v1.2 akis diyagramlari ve teknik dokumantasyon
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeSection === section.id
                ? 'bg-lime-500/20 text-lime-400 border border-lime-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-slate-200'
            )}
          >
            {section.icon}
            {section.label}
          </button>
        ))}
      </div>

      {/* Active Section Content */}
      {currentSection && (
        <div className="space-y-6">
          {/* Section Header */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-100">{currentSection.title}</h2>
            <p className="text-slate-400 mt-1">{currentSection.description}</p>
          </div>

          {/* Mermaid Diagram */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 overflow-x-auto">
            <MermaidDiagram
              chart={currentSection.diagram}
              className="flex justify-center [&_svg]:max-w-full"
            />
          </div>

          {/* Notes */}
          {currentSection.notes && currentSection.notes.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Notlar
              </h3>
              <ul className="space-y-2">
                {currentSection.notes.map((note, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-lime-500 shrink-0" />
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Reference Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Feature Flags */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-100 mb-4">Feature Flags</h3>
          <div className="space-y-2">
            {FEATURE_FLAGS.map((flag) => (
              <div
                key={flag.key}
                className="flex items-center justify-between text-sm bg-slate-900/50 rounded-lg px-3 py-2"
              >
                <div>
                  <code className="text-lime-400 text-xs">{flag.key}</code>
                  <p className="text-slate-500 text-xs mt-0.5">{flag.desc}</p>
                </div>
                <span
                  className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded',
                    flag.default === 'ON'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  )}
                >
                  {flag.default}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hangfire Jobs */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-100 mb-4">Hangfire Background Jobs</h3>
          <div className="space-y-2">
            {HANGFIRE_JOBS.map((job) => (
              <div
                key={job.name}
                className="bg-slate-900/50 rounded-lg px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <code className="text-cyan-400 text-xs">{job.name}</code>
                  <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    {job.schedule}
                  </span>
                </div>
                <p className="text-slate-500 text-xs mt-1">{job.desc}</p>
              </div>
            ))}
          </div>

          {/* Tech Stack */}
          <h3 className="text-lg font-bold text-slate-100 mb-4 mt-8">Teknoloji Stack</h3>
          <div className="space-y-3">
            {TECH_STACK.map((layer) => (
              <div key={layer.layer}>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  {layer.layer}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {layer.items.map((item) => (
                    <span
                      key={item}
                      className="text-xs bg-slate-700/50 text-slate-300 px-2 py-1 rounded"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
