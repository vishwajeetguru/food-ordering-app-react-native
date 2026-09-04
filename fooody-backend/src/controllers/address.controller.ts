import { Request, Response, NextFunction } from 'express';
import { addressRepository } from '../repositories/address.repository';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../utils/errors';
import { ERROR_CODES } from '../config/constants';

export const addressController = {
  async list(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const addrs = await addressRepository.listForUser(userId);
      sendSuccess(res, addrs, 'Addresses retrieved');
    }catch(err){ next(err); }
  },
  async create(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const addr = await addressRepository.create(userId, req.body);
      sendSuccess(res, addr, 'Address created', 201);
    }catch(err){ next(err); }
  },
  async update(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const updated = await addressRepository.update(req.params.id, userId, req.body);
      if(!updated) throw new NotFoundError('Address not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, updated, 'Address updated');
    }catch(err){ next(err); }
  },
  async delete(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const ok = await addressRepository.delete(req.params.id, userId);
      if(!ok) throw new NotFoundError('Address not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, null, 'Address deleted');
    }catch(err){ next(err); }
  }
};
