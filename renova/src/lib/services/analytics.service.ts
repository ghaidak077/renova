import { supabaseAdmin } from '../db/supabase';

export async function logEvent(
  eventType: 'store-view' | 'listing-view' | 'whatsapp-click',
  storeId: string,
  listingId?: string,
  userId?: string,
  sessionId?: string,
  meta?: Record<string, unknown>
) {
  const { error } = await supabaseAdmin
    .from('analytics_events')
    .insert([
      {
        event_type: eventType,
        store_id: storeId,
        listing_id: listingId,
        user_id: userId,
        session_id: sessionId,
        meta: meta,
      },
    ]);

  if (error) console.error("Error logging analytics event", error);
}
