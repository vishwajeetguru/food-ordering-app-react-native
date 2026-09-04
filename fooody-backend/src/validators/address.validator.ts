import { z } from 'zod';

export const createAddressSchema = z.object({
  label: z.enum(['Home','Work','Other']),
  address: z.string().min(5).max(300),
  details: z.string().max(300).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export const updateAddressSchema = z.object({
  label: z.enum(['Home','Work','Other']).optional(),
  address: z.string().min(5).max(300).optional(),
  details: z.string().max(300).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
}).refine(data => Object.keys(data).length > 0, { message: 'At least one field required' });

export const addressIdParamSchema = z.object({
  id: z.string().min(1).max(128),
});
