import { Request, Response, NextFunction } from 'express';
import { notificationRepository } from '../repositories/notification.repository';
import { userRepository } from '../repositories/user.repository';
import { sendSuccess } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { ERROR_CODES } from '../config/constants';
import { getFirestore, isFirebaseConfigured } from '../config/firebase';
import { logger } from '../utils/logger';

export const notificationController = {
  async listForMe(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const list = await notificationRepository.listForUser(userId, isNaN(limit)?50:Math.min(limit,100));
      const unread = list.filter(n=>!n.read).length;
      sendSuccess(res, { notifications: list, unreadCount: unread }, 'Notifications retrieved');
    }catch(e){ next(e); }
  },
  async unreadCount(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const count = await notificationRepository.unreadCount(userId);
      sendSuccess(res, { count }, 'Unread count');
    }catch(e){ next(e); }
  },
  async markRead(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const updated = await notificationRepository.markRead(req.params.id, userId);
      if(!updated) throw new NotFoundError('Notification not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, updated, 'Marked as read');
    }catch(e){ next(e); }
  },
  async markAllRead(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const count = await notificationRepository.markAllRead(userId);
      sendSuccess(res, { count }, 'All marked as read');
    }catch(e){ next(e); }
  },
  async registerFcmToken(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const { token } = req.body;
      if(!token) throw new BadRequestError('token required');
      const user = await userRepository.findById(userId);
      if(!user) throw new NotFoundError('User not found', ERROR_CODES.NOT_FOUND);
      const tokens = new Set<string>(user.fcmTokens || []);
      tokens.add(token);
      const updated = await userRepository.update(userId, { fcmTokens: Array.from(tokens) } as any);
      sendSuccess(res, { fcmTokens: updated.fcmTokens }, 'FCM token registered');
    }catch(e){ next(e); }
  },
  // Admin
  async adminList(req: Request, res: Response, next: NextFunction){
    try{
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const list = await notificationRepository.listAll(isNaN(limit)?100:Math.min(limit,200));
      sendSuccess(res, list, 'All notifications');
    }catch(e){ next(e); }
  },
  async adminSend(req: Request, res: Response, next: NextFunction){
    try{
      const { title, body, type, data, userId, broadcast } = req.body;
      if(!title || !body) throw new BadRequestError('title and body required');
      let created: any[] = [];
      if(broadcast){
        // create broadcast notification (userId null) - will show to all
        const n = await notificationRepository.create({ userId: null, title, body, type: type||'general', data });
        created = [n];
        // also attempt FCM broadcast if firebase configured
        try{
          if(isFirebaseConfigured()){
            const { getMessaging } = await import('firebase-admin/messaging');
            // get all users with tokens -> simple: fetch users 100
            const users = await userRepository.list(100);
            const tokens = users.flatMap(u=> u.fcmTokens || []);
            if(tokens.length){
              const messaging = getMessaging();
              // send multicast in chunks of 500
              for(let i=0;i<tokens.length;i+=500){
                const chunk = tokens.slice(i,i+500);
                await messaging.sendEachForMulticast({ tokens: chunk, notification: { title, body }, data: data ? Object.fromEntries(Object.entries(data).map(([k,v])=>[k,String(v)])) : undefined });
              }
            }
          }
        }catch(e:any){ logger.warn('FCM broadcast failed', {error:e.message}); }
      } else if(userId){
        const user = await userRepository.findById(userId);
        if(!user) throw new NotFoundError('Target user not found', ERROR_CODES.NOT_FOUND);
        const n = await notificationRepository.create({ userId, title, body, type: type||'general', data });
        created = [n];
        // try FCM to that user
        try{
          if(isFirebaseConfigured() && user.fcmTokens?.length){
            const { getMessaging } = await import('firebase-admin/messaging');
            const messaging = getMessaging();
            await messaging.sendEachForMulticast({ tokens: user.fcmTokens, notification: { title, body }, data: data ? Object.fromEntries(Object.entries(data).map(([k,v])=>[k,String(v)])) : undefined });
          }
        }catch(e:any){ logger.warn('FCM send failed', {error:e.message}); }
      } else {
        throw new BadRequestError('Provide userId or broadcast=true');
      }
      sendSuccess(res, created, 'Notification sent', 201);
    }catch(e){ next(e); }
  },
  async adminDelete(req: Request, res: Response, next: NextFunction){
    try{
      await notificationRepository.delete(req.params.id);
      sendSuccess(res, null, 'Deleted');
    }catch(e){ next(e); }
  }
};
