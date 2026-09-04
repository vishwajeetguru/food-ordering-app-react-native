import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createNotificationSchema, fcmTokenSchema, notificationIdParamSchema } from '../validators/notification.validator';
import { noCache } from '../middleware/cache.middleware';

const router = Router();
router.use(authenticate, noCache);
router.get('/', notificationController.listForMe);
router.get('/unread-count', notificationController.unreadCount);
router.post('/fcm-token', validate(fcmTokenSchema), notificationController.registerFcmToken);
router.patch('/:id/read', validate(notificationIdParamSchema, 'params'), notificationController.markRead);
router.patch('/read-all', notificationController.markAllRead);
export default router;
