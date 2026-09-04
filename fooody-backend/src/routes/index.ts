import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import productRoutes from './product.routes';
import categoryRoutes from './category.routes';
import orderRoutes from './order.routes';
import addressRoutes from './address.routes';
import restaurantRoutes from './restaurant.routes';
import offerRoutes from './offer.routes';
import homeRoutes from './home.routes';
import seedRoutes from './seed.routes';
import adminRoutes from './admin.routes';
import wishlistRoutes from './wishlist.routes';
import notificationRoutes from './notification.routes';
import ticketRoutes from './ticket.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/addresses', addressRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/restaurant', restaurantRoutes); // singular alias for frontend convenience
router.use('/offers', offerRoutes);
router.use('/home', homeRoutes);
router.use('/seed', seedRoutes);
router.use('/admin', adminRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/notifications', notificationRoutes);
router.use('/support', ticketRoutes); // /support/tickets -> ticket.routes handles /

// About - static info
router.get('/about', (_req, res) => res.json({
  success: true,
  message: 'About Foody',
  data: {
    name: 'Foody',
    version: '1.0.0',
    description: 'Foody - Good food. Delivered simply. Single kitchen, curated menu, fast delivery across your city.',
    features: ['Fresh ingredients', '30-40 min delivery', 'Zomato-style address', 'Wishlist & notifications', 'In-app support'],
    contact: { email: 'hello@foody.app', phone: '+91 98765 43210', address: 'Food Street, Culinary City' },
    links: { privacy: 'https://foody.app/privacy', terms: 'https://foody.app/terms', support: '/support' },
  }
}));

// Cart is client-side persisted (Zustand + AsyncStorage) — server sync placeholder
router.use('/cart', (_req, res) =>
  res.status(200).json({ success: true, message: 'Cart is client-persisted; no server sync required', data: null })
);
router.use('/payments', (_req, res) =>
  res.status(501).json({ success: false, message: 'Payments module not implemented yet', error: { code: 'NOT_IMPLEMENTED' } })
);

export default router;
