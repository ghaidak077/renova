import { supabaseAdmin } from '../db/supabase';
import { StoreSchema, PublishStoreSchema } from '../validators/store';

export async function getStoreBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('stores')
    .select('*, merchant_profile:merchant_profile_id(*)')
    .eq('slug', slug)
    .single();

  if (error) {
      if (error.code === 'PGRST116') return null; // PostgREST code for "not found"
      throw error;
  }
  return data;
}

export async function getStoresByOwner(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('stores')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

export async function createStore(userId: string, data: any) {
  const validatedData = StoreSchema.parse(data);
  const { data: profile } = await supabaseAdmin.from('merchant_profiles').select('id').eq('user_id', userId).single();
  
  const { data: newStore, error } = await supabaseAdmin
    .from('stores')
    .insert([
      {
        user_id: userId,
        merchant_profile_id: profile?.id,
        ...validatedData,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return newStore;
}

export async function updateStore(storeId: string, userId: string, data: any) {
    // Basic validation
    const validatedData = StoreSchema.partial().parse(data);
    
    // Authorization check
    const { data: store, error: fetchError } = await supabaseAdmin.from('stores').select('user_id').eq('id', storeId).single();
    if (fetchError || store?.user_id !== userId) {
        throw new Error("Unauthorized to update this store.");
    }

    const { data: updatedStore, error } = await supabaseAdmin
        .from('stores')
        .update(validatedData)
        .eq('id', storeId)
        .select()
        .single();
        
    if (error) throw error;
    return updatedStore;
}
