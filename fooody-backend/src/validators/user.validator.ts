import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name too long')
    .trim()
    .optional()
    .nullable(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number format (E.164 expected)')
    .optional()
    .nullable(),
  profileImage: z.string().url('Invalid URL').optional().nullable(),
  preferences: z
    .object({
      notifications: z.boolean().optional(),
      language: z.string().optional(),
    })
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
