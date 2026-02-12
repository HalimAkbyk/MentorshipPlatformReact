import Link from 'next/link';
import Image from 'next/image';
import { Phone, MapPin, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-primary-50 border-t border-primary-100">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Contact */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Iletisime Gecin</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-500">Bizi Arayin</div>
                  <div>0 533 140 88 19</div>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-500">Adres</div>
                  <div>Sancaktepe/Istanbul</div>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-500">Eposta</div>
                  <div>destek@degisimmentorluk.com</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Yardima mi ihtiyaciniz var?</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/public/faq" className="hover:text-primary-500 transition-colors">SSS</Link></li>
              <li><Link href="/public/support" className="hover:text-primary-500 transition-colors">Iletisim</Link></li>
            </ul>
          </div>

          {/* Pages */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Sayfalar</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/public/pricing" className="hover:text-primary-500 transition-colors">Fiyatlandirma</Link></li>
              <li><Link href="/public/how-it-works" className="hover:text-primary-500 transition-colors">Nasil Calisir</Link></li>
              <li><Link href="/public/mentors" className="hover:text-primary-500 transition-colors">Mentorler</Link></li>
              <li><Link href="/auth/signup?role=mentor" className="hover:text-primary-500 transition-colors">Mentor Ol</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Bizi Takip Et</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary-500 transition-colors">
                  <span className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">YT</span>
                  Youtube
                </a>
              </li>
              <li>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary-500 transition-colors">
                  <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs">IG</span>
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary-500 transition-colors">
                  <span className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs">X</span>
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-100 bg-white">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/">
            <Image
              src="/images/logo.svg"
              alt="Degisim Mentorluk"
              width={160}
              height={40}
              className="h-8 w-auto"
            />
          </Link>
          <div className="flex gap-4 text-xs text-gray-500">
            <Link href="/public/terms" className="hover:text-primary-500">Kullanim Sartlari</Link>
            <Link href="/public/privacy" className="hover:text-primary-500">Gizlilik ve KVKK</Link>
          </div>
          <div className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} degisimmentorluk.com Tum haklari saklidir.
          </div>
        </div>
      </div>
    </footer>
  );
}
