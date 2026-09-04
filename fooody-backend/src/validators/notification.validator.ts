import { z } from 'zod';

export const createNotificationSchema = z.object({
  title: z.string().min(2).max(120),
  body: z.string().min(2).max(500),
  type: z.enum(['promo','order','system','support','general']).optional().default('general'),
  data: z.record(z.any()).optional(),
  userId: z.string().min(1).max(128).optional().nullable(),
  broadcast: z.boolean().optional().default(false),
});

export const fcmTokenSchema = z.object({
  token: z.string().min(10).max(500),
  platform: z.enum(['android','ios','web']).optional(),
});

export const notificationIdParamSchema = z.object({
  id: z.string().min(1).max(128),
});
