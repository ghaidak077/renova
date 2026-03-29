import { z } from 'zod';

export const StoreSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  short_description: z.string().max(500).optional(),
  whatsapp_number: z.string().min(8).max(50).optional(), // Required for publish, but optional on draft
  city: z.string().max(100).optional(),
});

export const PublishStoreSchema = StoreSchema.extend({
  whatsapp_number: z.string().min(8).max(50), // Required for publish
});
