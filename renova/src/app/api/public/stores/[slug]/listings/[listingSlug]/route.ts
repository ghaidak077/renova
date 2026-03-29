import { NextRequest, NextResponse } from 'next/server';
import { getStoreBySlug } from '@/lib/services/store.service';
import { getListingBySlug } from '@/lib/services/listing.service';
import { logEvent } from '@/lib/services/analytics.service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string; listingSlug: string }> }
) {
  try {
    const params = await context.params;
    const { slug, listingSlug } = params;
    
    const store = await getStoreBySlug(slug);
    if (!store || store.status !== 'published') {
      return NextResponse.json({ error: 'Store not found or not published' }, { status: 404 });
    }

    const listing = await getListingBySlug(store.id, listingSlug);
    if (!listing || listing.status !== 'published') {
      return NextResponse.json({ error: 'Listing not found or not published' }, { status: 404 });
    }

    // Log listing view event
    await logEvent('listing-view', store.id, listing.id);

    return NextResponse.json(listing);
  } catch (error) {
    console.error('Error fetching listing details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
