import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/providers";

const urbanist = Urbanist({ subsets: ["latin"], variable: "--font-urbanist" });

export const metadata: Metadata = {
  title: "Degisim Mentorluk - YKS'ye Hazirlanmanin En Iyi Yolu",
  description: "Derece yapmis universite ogrencilerinden bire bir mentorluk al. Birebir danismanlik, strateji ve motivasyon destegi.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={urbanist.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
