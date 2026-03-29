import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/lib/services/store.service";
import { getPublicListingsByStore } from "@/lib/services/listing.service";
import { logEvent } from "@/lib/services/analytics.service";
import Link from "next/link";
import Image from "next/image";

export default async function StorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const paramsResolved = await params;
  const store = await getStoreBySlug(paramsResolved.slug);

  if (!store || store.status !== "published") {
    notFound();
  }

  // Fire and forget view logging
  logEvent("store-view", store.id).catch(console.error);

  const listings = await getPublicListingsByStore(store.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Store Header */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden relative">
            {store.logo_url ? (
               <Image src={store.logo_url} alt={store.name} fill className="object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-2xl">
                    {store.name.charAt(0)}
                </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{store.name}</h1>
            <p className="text-gray-500 mt-2 max-w-xl">{store.short_description}</p>
            {store.city && <p className="text-sm text-gray-400 mt-1">{store.city}</p>}
          </div>
        </div>
        {store.whatsapp_number && (
           <a 
             href={`https://wa.me/${store.whatsapp_number.replace(/\D/g, '')}`} 
             target="_blank" 
             rel="noreferrer"
             className="mt-6 md:mt-0 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
           >
             تواصل معنا
           </a>
        )}
      </div>

      {/* Listings Grid */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">الإعلانات ({listings?.length || 0})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings?.map((listing: any) => (
            <Link key={listing.id} href={`/${store.slug}/${listing.slug}`} className="group block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
               <div className="aspect-[4/3] w-full bg-gray-100 relative">
                  {listing.listing_images?.[0]?.image_url ? (
                      <Image src={listing.listing_images[0].image_url} alt={listing.title} fill className="object-cover" />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">بدون صورة</div>
                  )}
                  {listing.condition_label && (
                      <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold px-2 py-1 rounded">
                          {listing.condition_label}
                      </span>
                  )}
               </div>
               <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{listing.title}</h3>
                  <div className="mt-2 flex items-baseline gap-1 text-xl font-bold text-gray-900">
                     {Number(listing.price).toLocaleString()} <span className="text-sm font-normal text-gray-500">{listing.currency}</span>
                  </div>
                  {listing.city && <p className="text-sm text-gray-500 mt-2">{listing.city}</p>}
               </div>
            </Link>
          ))}
          {(!listings || listings.length === 0) && (
              <div className="col-span-full text-center py-12 text-gray-500">لا توجد إعلانات منشورة بعد.</div>
          )}
        </div>
      </div>
    </div>
  );
}
