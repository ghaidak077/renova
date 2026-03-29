import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/lib/services/store.service";
import { getListingBySlug } from "@/lib/services/listing.service";
import { logEvent } from "@/lib/services/analytics.service";
import { generateWhatsAppLink } from "@/lib/services/whatsapp.service";
import Image from "next/image";

export default async function ListingPage({ params }: { params: { slug: string; listingSlug: string } }) {
  const paramsResolved = await params;
  const store = await getStoreBySlug(paramsResolved.slug);
  
  if (!store || store.status !== "published") {
    notFound();
  }

  const listing = await getListingBySlug(store.id, paramsResolved.listingSlug);

  if (!listing || listing.status !== "published") {
    notFound();
  }

  // Fire and forget log view
  logEvent("listing-view", store.id, listing.id).catch(console.error);

  const whatsappNumber = store.whatsapp_number || store.merchant_profile?.whatsapp_number;
  const whatsappLink = whatsappNumber 
      ? generateWhatsAppLink(whatsappNumber, listing.title, `https://yourdomain.com/${store.slug}/${listing.slug}`)
      : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
       {/* Breadcrumb */}
       <div className="text-sm text-gray-500 mb-6 flex gap-2">
           <a href={`/${store.slug}`} className="hover:text-blue-600 transition-colors">{store.name}</a>
           <span>/</span>
           <span className="text-gray-900 truncate">{listing.title}</span>
       </div>

       {/* Gallery (Simple MVP: Just shows the first image large, others small) */}
       <div className="mb-12">
           <div className="aspect-[16/9] w-full bg-gray-100 rounded-2xl overflow-hidden relative shadow-sm border border-gray-100 mb-4">
              {listing.listing_images?.[0]?.image_url ? (
                  <Image src={listing.listing_images[0].image_url} alt={listing.title} fill className="object-cover" />
              ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">بدون صورة</div>
              )}
           </div>
           
           {listing.listing_images && listing.listing_images.length > 1 && (
               <div className="flex gap-4 overflow-x-auto pb-4">
                   {listing.listing_images.slice(1).map((img: { image_url: string }, i: number) => (
                       <div key={i} className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden relative border border-gray-200">
                           <Image src={img.image_url} alt="" fill className="object-cover" />
                       </div>
                   ))}
               </div>
           )}
       </div>

       {/* Content & Action */}
       <div className="flex flex-col md:flex-row gap-12">
           <div className="flex-1">
               <div className="flex justify-between items-start mb-4">
                   <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>
                   {listing.condition_label && (
                      <span className="bg-gray-100 text-gray-800 text-sm font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                          {listing.condition_label}
                      </span>
                   )}
               </div>
               
               <div className="text-3xl font-bold text-blue-600 mb-8">
                   {Number(listing.price).toLocaleString()} <span className="text-xl font-normal text-gray-500">{listing.currency}</span>
               </div>

               {listing.description && (
                   <div className="prose prose-blue max-w-none text-gray-700 mb-8 whitespace-pre-line">
                       {listing.description}
                   </div>
               )}

               {listing.listing_attributes && listing.listing_attributes.length > 0 && (
                   <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                       <h3 className="text-lg font-semibold mb-4">المواصفات</h3>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                           {listing.listing_attributes.map((attr: { attribute_label_ar: string, attribute_value: string }, i: number) => (
                               <div key={i} className="flex justify-between border-b border-gray-200 pb-2">
                                   <span className="text-gray-500">{attr.attribute_label_ar}</span>
                                   <span className="font-medium text-gray-900">{attr.attribute_value}</span>
                               </div>
                           ))}
                       </div>
                   </div>
               )}
           </div>

           {/* Sticky Sidebar CTA */}
           <div className="w-full md:w-80 flex-shrink-0">
               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
                   <div className="flex items-center gap-4 mb-6">
                       <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden relative">
                           {store.logo_url && <Image src={store.logo_url} alt={store.name} fill className="object-cover" />}
                       </div>
                       <div>
                           <div className="font-semibold text-gray-900">{store.name}</div>
                           <div className="text-sm text-gray-500">البائع</div>
                       </div>
                   </div>

                   {whatsappLink ? (
                       <a 
                         href={whatsappLink} 
                         target="_blank" 
                         rel="noreferrer"
                         className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 mb-4"
                       >
                         تواصل عبر واتساب
                       </a>
                   ) : (
                       <div className="w-full bg-gray-100 text-gray-500 font-medium py-4 px-6 rounded-xl text-center mb-4 cursor-not-allowed">
                           رقم التواصل غير متاح
                       </div>
                   )}
                   
                   <p className="text-xs text-gray-400 text-center">
                       عند التواصل، يرجى ذكر أنك وجدت الإعلان على Renova.
                   </p>
               </div>
           </div>
       </div>
    </div>
  );
}
