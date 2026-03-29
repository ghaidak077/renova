import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-inter)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start text-center sm:text-right font-[family-name:var(--font-noto-arabic)]">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-gray-900">
          منصة رينوفا
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          الحل الأمثل لإنشاء متاجرك الإلكترونية الاحترافية للسوق السوري والشرق الأوسط.
          ابدأ تجارتك الآن بدون تعقيدات الدفع الإلكتروني.
        </p>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-gray-900 text-white gap-2 hover:bg-gray-800 text-sm sm:text-base h-10 sm:h-12 px-8 sm:px-10"
            href="/login"
          >
            تسجيل الدخول
          </Link>
          <a
            className="rounded-full border border-solid border-gray-200 transition-colors flex items-center justify-center hover:bg-gray-100 text-gray-900 text-sm sm:text-base h-10 sm:h-12 px-8 sm:px-10"
            href="https://wa.me/963991151968"
            target="_blank"
            rel="noopener noreferrer"
          >
            تواصل معنا
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center text-gray-500 font-[family-name:var(--font-noto-arabic)]">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="#"
        >
          الشروط والأحكام
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="#"
        >
          سياسة الخصوصية
        </a>
      </footer>
    </div>
  );
}
