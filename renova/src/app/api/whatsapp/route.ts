import { NextResponse } from 'next/server';
import { generateWhatsAppLink } from '@/lib/services/whatsapp.service';
import { z } from 'zod';
import { logEvent } from '@/lib/services/analytics.service';

const WhatsAppSchema = z.object({
  storeId: z.string().uuid(),
  listingId: z.string().uuid(),
  phoneNumber: z.string(),
  listingTitle: z.string(),
  listingUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = WhatsAppSchema.parse(body);

    // Fire and forget logging
    logEvent('whatsapp-click', validatedData.storeId, validatedData.listingId).catch(console.error);

    // Generate link
    const link = generateWhatsAppLink(
      validatedData.phoneNumber,
      validatedData.listingTitle,
      validatedData.listingUrl
    );

    return NextResponse.json({ link });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error('Error generating WhatsApp link:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
