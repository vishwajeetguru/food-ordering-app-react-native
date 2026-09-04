import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { bannerController } from '../controllers/banner.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { noCache } from '../middleware/cache.middleware';
import { z } from 'zod';

const router = Router();

// All admin routes require admin role — never cache
router.use(authenticate, requireRole('admin'), noCache);

// Analytics
router.get('/analytics', adminController.analytics);

// Users
router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUser);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Orders (all) + admin order ops
router.get('/orders', adminController.listAllOrders);
router.get('/orders/:id', adminController.getOrderAsAdmin);
router.patch('/orders/:id', adminController.updateOrderAsAdmin);
router.patch('/orders/:id/status', adminController.updateOrderStatus);

// Addresses - admin can view/manage any user's addresses
router.get('/addresses', adminController.listAddresses);
router.get('/users/:id/addresses', adminController.listUserAddresses);
router.post('/users/:id/addresses', adminController.createUserAddress);
router.delete('/addresses/:id', adminController.deleteAnyAddress);

// Wishlist admin
router.get('/wishlists', adminController.listWishlists);

// Notifications admin
router.get('/notifications', adminController.listNotifications);
router.post('/notifications/send', adminController.sendNotification);
router.delete('/notifications/:id', adminController.deleteNotification);

// Support tickets admin
router.get('/tickets', adminController.listTickets);
router.get('/tickets/:id', adminController.getTicket);
router.patch('/tickets/:id/status', adminController.updateTicketStatus);
router.post('/tickets/:id/reply', adminController.replyToTicket);

// Banners
router.get('/banners', bannerController.list);
router.get('/banners/:id', bannerController.getById);
router.post('/banners', validate(z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  subtitle: z.string().min(2),
  buttonText: z.string().optional(),
  couponCode: z.string().optional(),
  image: z.string().url(),
  order: z.number().int().min(0).optional().default(0),
  active: z.boolean().optional().default(true),
}), 'body'), bannerController.create);
router.patch('/banners/:id', bannerController.update);
router.delete('/banners/:id', bannerController.delete);

// Home settings
router.get('/home-settings', bannerController.getHomeSettings);
router.patch('/home-settings', bannerController.updateHomeSettings);

// Global settings
router.get('/settings', bannerController.getSettings);
router.patch('/settings', bannerController.updateSettings);

// Restaurant update via admin
router.patch('/restaurant', async (req, res, next) => {
  try {
    const { restaurantRepository } = await import('../repositories/restaurant.repository');
    const updated = await restaurantRepository.update('default', req.body);
    const { sendSuccess } = await import('../utils/response');
    sendSuccess(res, updated, 'Restaurant updated');
  } catch (e) { next(e); }
});

export default router;
