import { supabaseAdmin } from '../db/supabase';
import { ListingSchema, PublishListingSchema } from '../validators/listing';
import { slugify } from '../utils/slugify';

export async function getPublicListingsByStore(storeId: string) {
  const { data, error } = await supabaseAdmin
    .from('listings')
    .select('id, slug, title, price, currency, city, condition_label, listing_images(image_url)')
    .eq('store_id', storeId)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getListingBySlug(storeId: string, slug: string) {
  const { data, error } = await supabaseAdmin
    .from('listings')
    .select('*, listing_images(*), listing_attributes(*), category:category_id(*)')
    .eq('store_id', storeId)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function createListing(storeId: string, userId: string, data: any) {
  const validatedData = ListingSchema.parse(data);
  let slug = slugify(validatedData.title);
  
  // if Arabic title generates empty slug, fallback to random string
  if (!slug) {
      slug = 'listing';
  }
  slug = slug + '-' + Math.random().toString(36).substring(2, 6); // Unique slug

  const { data: newListing, error } = await supabaseAdmin
    .from('listings')
    .insert([
      {
        store_id: storeId,
        category_id: validatedData.category_id,
        title: validatedData.title,
        slug,
        price: validatedData.price,
        currency: validatedData.currency,
        city: validatedData.city,
        condition_label: validatedData.condition_label,
        short_description: validatedData.short_description,
        description: validatedData.description,
        status: 'draft',
      },
    ])
    .select()
    .single();

  if (error) throw error;

  // Insert Images
  if (validatedData.images && validatedData.images.length > 0) {
      const imageInserts = validatedData.images.map((url: string, index: number) => ({
          listing_id: newListing.id,
          image_url: url,
          sort_order: index
      }));
      await supabaseAdmin.from('listing_images').insert(imageInserts);
  }

  // Insert Attributes
  if (validatedData.attributes && validatedData.attributes.length > 0) {
      const attrInserts = validatedData.attributes.map((attr: any, index: number) => ({
          listing_id: newListing.id,
          attribute_key: attr.key,
          attribute_label_ar: attr.label_ar,
          attribute_value: attr.value,
          sort_order: index
      }));
      await supabaseAdmin.from('listing_attributes').insert(attrInserts);
  }

  return newListing;
}
