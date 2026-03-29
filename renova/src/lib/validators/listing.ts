import { z } from 'zod';

export const ListingSchema = z.object({
  title: z.string().min(2).max(255),
  category_id: z.string().uuid(),
  price: z.number().positive(),
  currency: z.string().default('SAR'),
  city: z.string().max(100).optional(),
  condition_label: z.string().max(100).optional(),
  short_description: z.string().max(500).optional(),
  description: z.string().optional(),
  images: z.array(z.string().url()).min(0), // URLs of uploaded images
  attributes: z.array(z.object({
    key: z.string(),
    label_ar: z.string(),
    value: z.string()
  })).optional(),
});

export const PublishListingSchema = ListingSchema.extend({
  images: z.array(z.string().url()).min(1), // At least 1 image for publish
});
