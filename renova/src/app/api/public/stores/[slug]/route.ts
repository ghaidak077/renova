import { NextRequest, NextResponse } from 'next/server';
import { getStoreBySlug } from '@/lib/services/store.service';
import { logEvent } from '@/lib/services/analytics.service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    const slug = params.slug;
    const store = await getStoreBySlug(slug);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (store.status !== 'published') {
      return NextResponse.json({ error: 'Store is not published' }, { status: 403 });
    }

    // Log view event
    // In a real app, parse sessionId from cookies or request
    await logEvent('store-view', store.id);

    return NextResponse.json(store);
  } catch (error) {
    console.error('Error fetching store:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
