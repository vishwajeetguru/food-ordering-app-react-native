import { Request, Response, NextFunction } from 'express';
import { wishlistRepository } from '../repositories/wishlist.repository';
import { productRepository } from '../repositories/product.repository';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../utils/errors';
import { ERROR_CODES } from '../config/constants';

export const wishlistController = {
  async list(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const items = await wishlistRepository.listForUser(userId);
      // enrich with product details if available
      const enriched = await Promise.all(items.map(async (w)=>{
        const p = await productRepository.getById(w.productId).catch(()=>null);
        return { ...w, product: p || null };
      }));
      sendSuccess(res, enriched, 'Wishlist retrieved');
    }catch(e){ next(e); }
  },
  async add(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const { productId } = req.body;
      const product = await productRepository.getById(productId);
      if(!product) throw new NotFoundError('Product not found', ERROR_CODES.NOT_FOUND);
      const item = await wishlistRepository.add(userId, productId);
      sendSuccess(res, { ...item, product }, 'Added to wishlist', 201);
    }catch(e){ next(e); }
  },
  async remove(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const { productId } = req.params;
      await wishlistRepository.remove(userId, productId);
      sendSuccess(res, null, 'Removed from wishlist');
    }catch(e){ next(e); }
  },
  async toggle(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const { productId } = req.body;
      const product = await productRepository.getById(productId);
      if(!product) throw new NotFoundError('Product not found', ERROR_CODES.NOT_FOUND);
      const result = await wishlistRepository.toggle(userId, productId);
      sendSuccess(res, result, result.added ? 'Added to wishlist' : 'Removed from wishlist');
    }catch(e){ next(e); }
  },
  async check(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const { productId } = req.params;
      const exists = await wishlistRepository.exists(userId, productId);
      sendSuccess(res, { productId, wishlisted: exists }, 'Check done');
    }catch(e){ next(e); }
  }
};
