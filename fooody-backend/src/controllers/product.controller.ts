import { Request, Response, NextFunction } from 'express';
import { productRepository } from '../repositories/product.repository';
import { sendSuccess } from '../utils/response';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { ERROR_CODES } from '../config/constants';

export const productController = {
  async list(req: Request, res: Response, next: NextFunction){
    try{
      const categoryId = req.query.categoryId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string,10) : 20;
      const search = req.query.search as string | undefined;
      const parseBool = (v: any) => v === 'true' ? true : v === 'false' ? false : undefined;
      const isPopular = parseBool(req.query.isPopular);
      const isRecommended = parseBool(req.query.isRecommended);
      const isVeg = parseBool(req.query.isVeg);
      const products = await productRepository.list({ categoryId, limit, search, isPopular, isRecommended, isVeg });
      sendSuccess(res, products, 'Products retrieved');
    }catch(err){ next(err); }
  },
  async getById(req: Request, res: Response, next: NextFunction){
    try{
      const product = await productRepository.getById(req.params.id);
      if(!product) throw new NotFoundError('Product not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, product, 'Product retrieved');
    }catch(err){ next(err); }
  },
  async create(req: Request, res: Response, next: NextFunction){
    try{
      const data = req.body;
      if(!data.id) data.id = `p_${Date.now()}`;
      const created = await productRepository.create(data);
      sendSuccess(res, created, 'Product created', 201);
    }catch(err){ next(err); }
  },
  async update(req: Request, res: Response, next: NextFunction){
    try{
      const updated = await productRepository.update(req.params.id, req.body);
      if(!updated) throw new NotFoundError('Product not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, updated, 'Product updated');
    }catch(err){ next(err); }
  }
};
