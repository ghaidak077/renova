export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start text-center sm:text-left max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight">Renova</h1>
        <p className="text-xl text-gray-500">The premium Arabic storefront platform.</p>
        <div className="flex gap-4">
           <a href="/login" className="rounded-full bg-black text-white px-6 py-3 font-medium hover:bg-gray-800 transition-colors">Get Started</a>
        </div>
      </main>
    </div>
  );
}
