import { Request, Response, NextFunction } from 'express';
import { ticketRepository } from '../repositories/ticket.repository';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { ERROR_CODES } from '../config/constants';

export const ticketController = {
  async create(req: Request, res: Response, next: NextFunction){
    try{
      const user = (req as any).user;
      const { subject, description, category, priority, orderId } = req.body;
      const ticket = await ticketRepository.create({
        userId: user.id,
        userName: user.name || null,
        userEmail: user.email,
        userPhone: user.phone || null,
        subject, description, category, priority, orderId: orderId || null
      });
      // auto-create notification for admin? Could add but skip
      sendSuccess(res, ticket, 'Ticket created', 201);
    }catch(e){ next(e); }
  },
  async listMine(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const list = await ticketRepository.listForUser(userId);
      sendSuccess(res, list, 'Tickets retrieved');
    }catch(e){ next(e); }
  },
  async getById(req: Request, res: Response, next: NextFunction){
    try{
      const user = (req as any).user;
      const ticket = await ticketRepository.getById(req.params.id);
      if(!ticket) throw new NotFoundError('Ticket not found', ERROR_CODES.NOT_FOUND);
      if(ticket.userId !== user.id && user.role !== 'admin') throw new ForbiddenError('Forbidden', ERROR_CODES.FORBIDDEN);
      sendSuccess(res, ticket, 'Ticket retrieved');
    }catch(e){ next(e); }
  },
  async addMessage(req: Request, res: Response, next: NextFunction){
    try{
      const user = (req as any).user;
      const ticket = await ticketRepository.getById(req.params.id);
      if(!ticket) throw new NotFoundError('Ticket not found', ERROR_CODES.NOT_FOUND);
      if(ticket.userId !== user.id && user.role !== 'admin') throw new ForbiddenError('Forbidden', ERROR_CODES.FORBIDDEN);
      const msg = {
        by: (user.role === 'admin' ? 'admin' : 'user') as 'admin'|'user',
        byId: user.id,
        byName: user.name || user.email,
        message: req.body.message,
        at: new Date().toISOString(),
      };
      const updated = await ticketRepository.addMessage(ticket.id, msg);
      sendSuccess(res, updated, 'Message added');
    }catch(e){ next(e); }
  },
  // Admin only
  async adminList(req: Request, res: Response, next: NextFunction){
    try{
      const status = req.query.status as any;
      const list = await ticketRepository.listAll(100, status);
      sendSuccess(res, list, 'All tickets');
    }catch(e){ next(e); }
  },
  async adminUpdateStatus(req: Request, res: Response, next: NextFunction){
    try{
      const admin = (req as any).user;
      const updated = await ticketRepository.updateStatus(req.params.id, req.body.status, req.body.adminNote, { byId: admin.id, byName: admin.name || admin.email });
      if(!updated) throw new NotFoundError('Ticket not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, updated, 'Ticket updated');
    }catch(e){ next(e); }
  },
  async adminDelete(req: Request, res: Response, next: NextFunction){
    try{
      await ticketRepository.delete(req.params.id);
      sendSuccess(res, null, 'Deleted');
    }catch(e){ next(e); }
  }
};
