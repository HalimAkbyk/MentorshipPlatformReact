import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Mentorship Platform - Üniversite Öğrencilerinden Mentorluk",
  description: "Derece yapmış üniversite öğrencilerinden bire bir mentorluk al",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}