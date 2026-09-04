import { Router } from 'express';
import { ticketController } from '../controllers/ticket.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createTicketSchema, ticketIdParamSchema, ticketStatusSchema, ticketMessageSchema } from '../validators/ticket.validator';
import { noCache } from '../middleware/cache.middleware';

const router = Router();
router.use(authenticate, noCache);

// User ticket ops
router.post('/', validate(createTicketSchema), ticketController.create);
router.get('/', ticketController.listMine);
router.get('/:id', validate(ticketIdParamSchema, 'params'), ticketController.getById);
router.post('/:id/messages', validate(ticketIdParamSchema, 'params'), validate(ticketMessageSchema), ticketController.addMessage);

// Admin ops (also require admin)
router.get('/admin/all', requireRole('admin'), ticketController.adminList);
router.patch('/admin/:id/status', requireRole('admin'), validate(ticketIdParamSchema, 'params'), validate(ticketStatusSchema), ticketController.adminUpdateStatus);
router.delete('/admin/:id', requireRole('admin'), validate(ticketIdParamSchema, 'params'), ticketController.adminDelete);

// Legacy: admin routes via same router with /:id/status for admin convenience
router.patch('/:id/status', requireRole('admin'), validate(ticketIdParamSchema, 'params'), validate(ticketStatusSchema), ticketController.adminUpdateStatus);

export default router;
