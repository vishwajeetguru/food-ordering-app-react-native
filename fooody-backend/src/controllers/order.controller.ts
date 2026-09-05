import { Request, Response, NextFunction } from 'express';
import { orderRepository } from '../repositories/order.repository';
import { sendSuccess } from '../utils/response';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';
import { ERROR_CODES } from '../config/constants';

export const orderController = {
  async list(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string,10) : 20;
      const orders = await orderRepository.listForUser(userId, limit);
      sendSuccess(res, orders, 'Orders retrieved');
    }catch(err){ next(err); }
  },
  async getById(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const order = await orderRepository.getById(req.params.id);
      if(!order) throw new NotFoundError('Order not found', ERROR_CODES.NOT_FOUND);
      if(order.userId !== userId && userRole !== 'admin') throw new ForbiddenError('Forbidden', ERROR_CODES.FORBIDDEN);
      sendSuccess(res, order, 'Order retrieved');
    }catch(err){ next(err); }
  },
  async create(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      // Maintenance gate: block non-admin orders when enabled
      try {
        const { settingsRepository } = await import('../repositories/settings.repository');
        const s = await settingsRepository.get();
        if ((s as any).maintenanceMode && userRole !== 'admin') {
          throw new BadRequestError((s as any).maintenanceMessage || 'Foody is under maintenance. Please check back soon.', ERROR_CODES.BAD_REQUEST);
        }
      } catch {}
      const { items, deliveryFee, tax, discount, paymentMethod, address } = req.body;
      let { subtotal, total } = req.body;
      if(!items || !Array.isArray(items) || items.length===0) throw new BadRequestError('Items required', ERROR_CODES.BAD_REQUEST);
      if (items.length > 50) throw new BadRequestError('Too many items (max 50)', ERROR_CODES.BAD_REQUEST);
      const allowedMethods = ['cod','online'];
      const method = allowedMethods.includes(paymentMethod) ? paymentMethod : 'cod';
      // Server-side price verification — prevent price tampering
      const { productRepository } = await import('../repositories/product.repository');
      let serverSubtotal = 0;
      const verifiedItems: typeof items = [];
      for (const it of items) {
        if (!it.productId || typeof it.quantity !== 'number' || it.quantity < 1 || it.quantity > 99) {
          throw new BadRequestError('Invalid item quantity (1-99)', ERROR_CODES.BAD_REQUEST);
        }
        const prod = await productRepository.getById(it.productId);
        if (!prod) throw new BadRequestError(`Product ${it.productId} not found`, ERROR_CODES.NOT_FOUND);
        const serverPrice = prod.price;
        // Use server price, ignore client price
        serverSubtotal += serverPrice * it.quantity;
        verifiedItems.push({
          productId: prod.id,
          name: prod.name,
          price: serverPrice,
          quantity: it.quantity,
          image: prod.image,
        });
      }
      // Recompute totals server-side — ignore client subtotal/total to prevent tampering
      const serverDeliveryFee = typeof deliveryFee === 'number' && deliveryFee >= 0 && deliveryFee <= 200 ? deliveryFee : 40;
      const serverTax = typeof tax === 'number' && tax >= 0 ? tax : Math.round(serverSubtotal * 0.05);
      const serverDiscount = typeof discount === 'number' && discount >= 0 && discount <= serverSubtotal ? discount : 0;
      const serverTotal = serverSubtotal + serverDeliveryFee + serverTax - serverDiscount;
      // If client sent subtotal/total, log mismatch for fraud monitoring (don't fail, just correct)
      if (typeof subtotal === 'number' && subtotal !== serverSubtotal) {
        const { logger } = await import('../utils/logger');
        logger.warn('Order subtotal mismatch — client tampering corrected', { userId, clientSubtotal: subtotal, serverSubtotal });
      }
      if (typeof total === 'number' && total !== serverTotal) {
        const { logger } = await import('../utils/logger');
        logger.warn('Order total mismatch — corrected', { userId, clientTotal: total, serverTotal });
      }
      const order = await orderRepository.create({
        userId,
        items: verifiedItems,
        subtotal: serverSubtotal,
        deliveryFee: serverDeliveryFee,
        tax: serverTax,
        discount: serverDiscount,
        total: serverTotal,
        paymentMethod: method,
        address,
      });
      // Realtime: notify admins + user. Firestore listeners will pick it up instantly.
      try {
        const { notificationRepository } = await import('../repositories/notification.repository');
        const { userRepository } = await import('../repositories/user.repository');
        // User confirmation
        await notificationRepository.create({ userId, title: 'Order placed', body: `Your order ${order.orderNumber} for ₹${order.total} is ${order.status}`, type: 'order', data: { orderId: order.id, status: order.status } });
        // Admin broadcast (all admins)
        const admins = (await userRepository.list(100)).filter((u: any) => u.role === 'admin');
        if (admins.length) await notificationRepository.createForUsers(admins.map((a: any) => a.id), { title: 'New order received', body: `${order.orderNumber} • ₹${order.total} • ${order.items.length} item(s)`, type: 'order', data: { orderId: order.id } });
        else await notificationRepository.create({ userId: null as any, title: 'New order received', body: `${order.orderNumber} • ₹${order.total}`, type: 'order', data: { orderId: order.id } });
      } catch {}
      sendSuccess(res, order, 'Order created', 201);
    }catch(err){ next(err); }
  },
  async updateStatus(req: Request, res: Response, next: NextFunction){
    try{
      const { status } = req.body;
      const allowed = ['pending','preparing','out_for_delivery','delivered','cancelled'];
      if(!allowed.includes(status)) throw new BadRequestError('Invalid status', ERROR_CODES.BAD_REQUEST);
      const order = await orderRepository.updateStatus(req.params.id, status);
      if(!order) throw new NotFoundError('Order not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, order, 'Order status updated');
    }catch(err){ next(err); }
  }
};
