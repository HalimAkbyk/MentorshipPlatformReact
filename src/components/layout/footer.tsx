'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Phone, MapPin, Mail } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { UserRole } from '@/lib/types/enums';

export function Footer() {
  const { user, isAuthenticated } = useAuthStore();
  const isMentor = isAuthenticated && user?.roles.includes(UserRole.Mentor);
  const isStudent = isAuthenticated && user?.roles.includes(UserRole.Student);

  const mentorOlHref = isMentor
    ? '/mentor/dashboard'
    : isStudent
      ? '/auth/onboarding/mentor?source=student'
      : '/auth/signup?role=mentor';
  const mentorOlLabel = isMentor ? 'Mentör Panelim' : 'Mentör Ol';

  return (
    <footer className="bg-[var(--bg-dark)] border-t border-navy-700">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Contact */}
          <div>
            <h4 className="font-bold font-heading text-sm uppercase tracking-wider text-lime-400 mb-4">İletişime Geçin</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-navy-300">
                <Phone className="w-4 h-4 text-lime-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-navy-400">Bizi Arayın</div>
                  <div>0 533 140 88 19</div>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm text-navy-300">
                <MapPin className="w-4 h-4 text-lime-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-navy-400">Adres</div>
                  <div>Sancaktepe/İstanbul</div>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm text-navy-300">
                <Mail className="w-4 h-4 text-lime-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-navy-400">E-posta</div>
                  <div>destek@degisimmentorluk.com</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-bold font-heading text-sm uppercase tracking-wider text-lime-400 mb-4">Yardıma mı ihtiyacınız var?</h4>
            <ul className="space-y-2 text-sm text-navy-300">
              <li><Link href="/public/faq" className="hover:text-lime-400 transition-colors">SSS</Link></li>
              <li><Link href="/public/support" className="hover:text-lime-400 transition-colors">İletişim</Link></li>
            </ul>
          </div>

          {/* Pages */}
          <div>
            <h4 className="font-bold font-heading text-sm uppercase tracking-wider text-lime-400 mb-4">Sayfalar</h4>
            <ul className="space-y-2 text-sm text-navy-300">
              <li><Link href="/public/courses" className="hover:text-lime-400 transition-colors">Eğitimler</Link></li>
              <li><Link href="/public/pricing" className="hover:text-lime-400 transition-colors">Fiyatlandırma</Link></li>
              <li><Link href="/public/how-it-works" className="hover:text-lime-400 transition-colors">Nasıl Çalışır</Link></li>
              <li><Link href="/public/mentors" className="hover:text-lime-400 transition-colors">Mentörler</Link></li>
              <li><Link href={mentorOlHref} className="hover:text-lime-400 transition-colors">{mentorOlLabel}</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-bold font-heading text-sm uppercase tracking-wider text-lime-400 mb-4">Bizi Takip Et</h4>
            <ul className="space-y-3 text-sm text-navy-300">
              <li>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-lime-400 transition-colors">
                  <span className="w-8 h-8 bg-red-500/90 rounded-full flex items-center justify-center text-white text-xs">YT</span>
                  Youtube
                </a>
              </li>
              <li>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-lime-400 transition-colors">
                  <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs">IG</span>
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-lime-400 transition-colors">
                  <span className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white text-xs">X</span>
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-navy-700 bg-navy-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/">
            <Image
              src="/images/logo.svg"
              alt="Değişim Mentorluk"
              width={160}
              height={40}
              className="h-8 w-auto brightness-0 invert opacity-70"
            />
          </Link>
          <div className="flex gap-4 text-xs text-navy-400">
            <Link href="/public/terms" className="hover:text-lime-400 transition-colors">Kullanım Şartları</Link>
            <Link href="/public/privacy" className="hover:text-lime-400 transition-colors">Gizlilik ve KVKK</Link>
          </div>
          <div className="text-xs text-navy-400">
            &copy; {new Date().getFullYear()} degisimmentorluk.com Tüm hakları saklıdır.
          </div>
        </div>
      </div>
    </footer>
  );
}
