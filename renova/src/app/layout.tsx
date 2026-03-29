import type { Metadata } from "next";
import { Inter, Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoKufiArabic = Noto_Kufi_Arabic({ subsets: ["arabic"], variable: "--font-noto-arabic" });

export const metadata: Metadata = {
  title: "Renova",
  description: "Create premium Arabic storefronts fast.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${inter.variable} ${notoKufiArabic.variable}`}>
      <body className="font-arabic antialiased text-gray-900 bg-gray-50">
        {children}
      </body>
    </html>
  );
}
