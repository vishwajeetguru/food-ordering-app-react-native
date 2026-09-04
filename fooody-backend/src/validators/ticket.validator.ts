import { z } from 'zod';

export const createTicketSchema = z.object({
  subject: z.string().min(5).max(150),
  description: z.string().min(10).max(2000),
  category: z.enum(['order','payment','delivery','general','account','other']).optional().default('general'),
  priority: z.enum(['low','medium','high']).optional().default('medium'),
  orderId: z.string().min(1).max(128).optional().nullable(),
});

export const ticketIdParamSchema = z.object({
  id: z.string().min(1).max(128),
});

export const ticketStatusSchema = z.object({
  status: z.enum(['open','in_progress','resolved','closed']),
  adminNote: z.string().min(1).max(1000).optional(),
});

export const ticketMessageSchema = z.object({
  message: z.string().min(1).max(1000),
});
