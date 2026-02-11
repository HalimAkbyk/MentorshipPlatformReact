
import Link from 'next/link';
export function Footer() {
  return (
   <footer className="border-t bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold mb-4">MentorHub</h3>
              <p className="text-sm text-gray-600">
                Üniversite sınavına hazırlık sürecinde yanında olan platform
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/public/mentors">Mentörler</Link></li>
                <li><Link href="/public/how-it-works">Nasıl Çalışır</Link></li>
                <li><Link href="/public/pricing">Ücretlendirme</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Destek</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/public/faq">SSS</Link></li>
                <li><Link href="/public/support">İletişim</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Yasal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/public/terms">Kullanım Şartları</Link></li>
                <li><Link href="/public/privacy">Gizlilik Politikası</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
            © {new Date().getFullYear()} MentorHub. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    
  );
}
