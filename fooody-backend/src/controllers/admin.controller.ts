import { Request, Response, NextFunction } from 'express';
import { productRepository } from '../repositories/product.repository';
import { orderRepository } from '../repositories/order.repository';
import { categoryRepository } from '../repositories/category.repository';
import { userRepository } from '../repositories/user.repository';
import { restaurantRepository } from '../repositories/restaurant.repository';
import { addressRepository } from '../repositories/address.repository';
import { wishlistRepository } from '../repositories/wishlist.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { ticketRepository } from '../repositories/ticket.repository';
import { sendSuccess } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { ERROR_CODES } from '../config/constants';

export const adminController = {
  async analytics(_req: Request, res: Response, next: NextFunction) {
    try {
      const [products, orders, users, categories] = await Promise.all([
        productRepository.list({ limit: 100 }),
        orderRepository.listAll(100),
        userRepository.list(100),
        categoryRepository.list(),
      ]);

      const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayOrders = orders.filter((o) => (o.createdAt || '').slice(0, 10) === todayStr);
      const todayRevenue = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
      const pendingOrders = orders.filter((o) => o.status === 'pending').length;
      const unavailableProducts = products.filter((p) => (p as any).available === false).length;

      const days: { date: string; revenue: number; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const dayOrders = orders.filter((o) => (o.createdAt || '').slice(0, 10) === key);
        days.push({ date: key.slice(5), revenue: dayOrders.reduce((s, o) => s + (o.total || 0), 0), count: dayOrders.length });
      }

      sendSuccess(res, {
        totalRevenue,
        totalOrders: orders.length,
        totalProducts: products.length,
        totalCustomers: users.length,
        totalCategories: categories.length,
        todayOrders: todayOrders.length,
        todayRevenue,
        pendingOrders,
        unavailableProducts,
        revenueLast7Days: days.map((d) => ({ date: d.date, revenue: d.revenue })),
        ordersLast7Days: days.map((d) => ({ date: d.date, count: d.count })),
        recentOrders: orders.slice(0, 5),
        popularProducts: products.filter((p) => p.isPopular).slice(0, 5),
      }, 'Analytics retrieved');
    } catch (err) { next(err); }
  },

  async listUsers(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userRepository.list(100);
      sendSuccess(res, users, 'Users retrieved');
    } catch (err) { next(err); }
  },

  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userRepository.findById(req.params.id);
      if (!user) throw new NotFoundError('User not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, user, 'User retrieved');
    } catch (err) { next(err); }
  },

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await userRepository.update(req.params.id, req.body);
      sendSuccess(res, updated, 'User updated');
    } catch (err) { next(err); }
  },

  async listAllOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const orders = await orderRepository.listAll(limit);
      sendSuccess(res, orders, 'Orders retrieved');
    } catch (err) { next(err); }
  },

  async deleteUser(req: Request, res: Response, next: NextFunction){
    try{
      const u = await userRepository.findById(req.params.id);
      if(!u) throw new NotFoundError('User not found', ERROR_CODES.NOT_FOUND);
      await userRepository.delete(req.params.id);
      sendSuccess(res, null, 'User deleted (soft)');
    }catch(e){ next(e); }
  },

  async getOrderAsAdmin(req: Request, res: Response, next: NextFunction){
    try{
      const order = await orderRepository.getById(req.params.id);
      if(!order) throw new NotFoundError('Order not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, order, 'Order retrieved');
    }catch(e){ next(e); }
  },

  async updateOrderAsAdmin(req: Request, res: Response, next: NextFunction){
    try{
      const existing = await orderRepository.getById(req.params.id);
      if(!existing) throw new NotFoundError('Order not found', ERROR_CODES.NOT_FOUND);
      // allow updating status, address, items meta via generic update (use status if present)
      if(req.body.status){
        const updated = await orderRepository.updateStatus(req.params.id, req.body.status);
        return sendSuccess(res, updated, 'Order updated');
      }
      // fallback: merge body onto order via direct repo hack (memory fallback)
      const merged = { ...existing, ...req.body, updatedAt: new Date().toISOString() } as any;
      // persist via private memory if no dedicated method
      if((orderRepository as any)._clearMemory){
        // Use firestore set if exists
        const { getFirestore, isFirebaseConfigured } = await import('../config/firebase');
        if(!isFirebaseConfigured() || process.env.NODE_ENV==='test'){
          (orderRepository as any)._getMemoryMap?.set?.(req.params.id, merged);
        } else {
          try{ await getFirestore().collection('orders').doc(req.params.id).set(merged, {merge:true}); }catch{}
        }
      }
      sendSuccess(res, merged, 'Order updated');
    }catch(e){ next(e); }
  },

  async updateOrderStatus(req: Request, res: Response, next: NextFunction){
    try{
      const { status } = req.body;
      if(!status) throw new BadRequestError('status required');
      const updated = await orderRepository.updateStatus(req.params.id, status);
      if(!updated) throw new NotFoundError('Order not found', ERROR_CODES.NOT_FOUND);
      // create notification for user about status change
      try{
        await notificationRepository.create({ userId: updated.userId, title: 'Order update', body: `Your order ${updated.orderNumber} is now ${status}`, type: 'order', data: { orderId: updated.id, status } });
      }catch{}
      sendSuccess(res, updated, 'Status updated');
    }catch(e){ next(e); }
  },

  // Addresses
  async listAddresses(req: Request, res: Response, next: NextFunction){
    try{
      const userId = req.query.userId as string;
      if(userId){
        const list = await addressRepository.listForUser(userId);
        return sendSuccess(res, list, 'Addresses for user');
      }
      // all addresses: gather from users
      const users = await userRepository.list(100);
      const all: any[] = [];
      for(const u of users){
        const list = await addressRepository.listForUser(u.id);
        all.push(...list.map(a=> ({ ...a, userEmail: u.email, userName: u.name })));
      }
      sendSuccess(res, all.slice(0,200), 'All addresses');
    }catch(e){ next(e); }
  },
  async listUserAddresses(req: Request, res: Response, next: NextFunction){
    try{
      const list = await addressRepository.listForUser(req.params.id);
      sendSuccess(res, list, 'User addresses');
    }catch(e){ next(e); }
  },
  async createUserAddress(req: Request, res: Response, next: NextFunction){
    try{
      const addr = await addressRepository.create(req.params.id, req.body);
      sendSuccess(res, addr, 'Address created for user', 201);
    }catch(e){ next(e); }
  },
  async deleteAnyAddress(req: Request, res: Response, next: NextFunction){
    try{
      // find owner by scanning? Try delete with unknown user - need to locate address first
      const { id } = req.params;
      const addr = await addressRepository.getById(id);
      if(!addr) throw new NotFoundError('Address not found', ERROR_CODES.NOT_FOUND);
      await addressRepository.delete(id, addr.userId);
      sendSuccess(res, null, 'Address deleted');
    }catch(e){ next(e); }
  },

  // Wishlists
  async listWishlists(req: Request, res: Response, next: NextFunction){
    try{
      const userId = req.query.userId as string;
      if(userId){
        const list = await wishlistRepository.listForUser(userId);
        return sendSuccess(res, list, 'Wishlist for user');
      }
      const users = await userRepository.list(50);
      const all:any[]=[];
      for(const u of users){
        const l = await wishlistRepository.listForUser(u.id);
        all.push(...l.map(i=> ({ ...i, userEmail: u.email })));
      }
      sendSuccess(res, all.slice(0,200), 'All wishlists');
    }catch(e){ next(e); }
  },

  // Notifications
  async listNotifications(req: Request, res: Response, next: NextFunction){
    try{
      const limit = req.query.limit ? parseInt(req.query.limit as string,10):100;
      const list = await notificationRepository.listAll(limit);
      sendSuccess(res, list, 'Notifications');
    }catch(e){ next(e); }
  },
  async sendNotification(req: Request, res: Response, next: NextFunction){
    try{
      const { title, body, type, data, userId, broadcast } = req.body;
      if(!title || !body) throw new BadRequestError('title and body required');
      // reuse notification controller logic
      const { notificationController } = await import('./notification.controller');
      // call adminSend directly
      return notificationController.adminSend(req, res, next);
    }catch(e){ next(e); }
  },
  async deleteNotification(req: Request, res: Response, next: NextFunction){
    try{
      await notificationRepository.delete(req.params.id);
      sendSuccess(res, null, 'Deleted');
    }catch(e){ next(e); }
  },

  // Tickets
  async listTickets(req: Request, res: Response, next: NextFunction){
    try{
      const status = req.query.status as any;
      const list = await ticketRepository.listAll(100, status);
      sendSuccess(res, list, 'Tickets');
    }catch(e){ next(e); }
  },
  async getTicket(req: Request, res: Response, next: NextFunction){
    try{
      const t = await ticketRepository.getById(req.params.id);
      if(!t) throw new NotFoundError('Ticket not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, t, 'Ticket');
    }catch(e){ next(e); }
  },
  async updateTicketStatus(req: Request, res: Response, next: NextFunction){
    try{
      const updated = await ticketRepository.updateStatus(req.params.id, req.body.status, req.body.adminNote, { byId: (req as any).user.id, byName: (req as any).user.name || (req as any).user.email });
      if(!updated) throw new NotFoundError('Ticket not found', ERROR_CODES.NOT_FOUND);
      // notify user
      try{ await notificationRepository.create({ userId: updated.userId, title: 'Support update', body: `Ticket "${updated.subject}" status: ${req.body.status}`, type: 'support', data: { ticketId: updated.id } }); }catch{}
      sendSuccess(res, updated, 'Ticket status updated');
    }catch(e){ next(e); }
  },
  async replyToTicket(req: Request, res: Response, next: NextFunction){
    try{
      const { message } = req.body;
      if(!message) throw new BadRequestError('message required');
      const t = await ticketRepository.getById(req.params.id);
      if(!t) throw new NotFoundError('Ticket not found', ERROR_CODES.NOT_FOUND);
      const msg = { by: 'admin' as const, byId: (req as any).user.id, byName: (req as any).user.name || (req as any).user.email, message, at: new Date().toISOString() };
      const updated = await ticketRepository.addMessage(t.id, msg);
      try{ await notificationRepository.create({ userId: t.userId, title: 'New reply on ticket', body: message.slice(0,120), type: 'support', data: { ticketId: t.id } }); }catch{}
      sendSuccess(res, updated, 'Replied');
    }catch(e){ next(e); }
  },
};
