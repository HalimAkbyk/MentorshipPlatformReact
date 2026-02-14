import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { GoogleOAuthWrapper } from '@/components/auth/google-oauth-wrapper';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GoogleOAuthWrapper>
      <Header />
      <main className="min-h-[calc(100vh-200px)]">{children}</main>
      <Footer />
    </GoogleOAuthWrapper>
  );
}
