import { NextResponse } from 'next/server';
import { logEvent } from '@/lib/services/analytics.service';
import { z } from 'zod';

const EventSchema = z.object({
  eventType: z.enum(['store-view', 'listing-view', 'whatsapp-click']),
  storeId: z.string().uuid(),
  listingId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  meta: z.any().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = EventSchema.parse(body);

    await logEvent(
      validatedData.eventType,
      validatedData.storeId,
      validatedData.listingId,
      validatedData.userId,
      validatedData.sessionId,
      validatedData.meta
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error('Error processing event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
