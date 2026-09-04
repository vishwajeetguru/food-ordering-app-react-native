import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createOrderSchema, updateOrderStatusSchema, orderIdParamSchema, orderListQuerySchema } from '../validators/order.validator';
import { noCache } from '../middleware/cache.middleware';

const router = Router();
router.use(authenticate, noCache);
router.get('/', validate(orderListQuerySchema, 'query'), orderController.list);
router.post('/', validate(createOrderSchema), orderController.create);
router.get('/:id', validate(orderIdParamSchema, 'params'), orderController.getById);
// Admin only status update
router.patch('/:id/status', validate(orderIdParamSchema, 'params'), requireRole('admin'), validate(updateOrderStatusSchema), orderController.updateStatus);
export default router;
