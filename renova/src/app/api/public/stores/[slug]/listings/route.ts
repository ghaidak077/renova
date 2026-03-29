import { NextRequest, NextResponse } from 'next/server';
import { getStoreBySlug } from '@/lib/services/store.service';
import { getPublicListingsByStore } from '@/lib/services/listing.service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    const slug = params.slug;
    const store = await getStoreBySlug(slug);

    if (!store || store.status !== 'published') {
      return NextResponse.json({ error: 'Store not found or not published' }, { status: 404 });
    }

    const listings = await getPublicListingsByStore(store.id);

    return NextResponse.json(listings);
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
