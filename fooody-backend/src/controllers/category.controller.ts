import { Request, Response, NextFunction } from 'express';
import { categoryRepository } from '../repositories/category.repository';
import { sendSuccess } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { ERROR_CODES } from '../config/constants';

export const categoryController = {
  async list(_req: Request, res: Response, next: NextFunction){
    try{
      const cats = await categoryRepository.list();
      sendSuccess(res, cats, 'Categories retrieved');
    }catch(err){ next(err); }
  },
  async getById(req: Request, res: Response, next: NextFunction){
    try{
      const cat = await categoryRepository.getById(req.params.id);
      if(!cat) throw new NotFoundError('Category not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, cat, 'Category retrieved');
    }catch(err){ next(err); }
  },
  async create(req: Request, res: Response, next: NextFunction){
    try{
      const data = req.body;
      if(!data.id) data.id = `${Date.now()}`;
      if(!data.slug) data.slug = data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-');
      const created = await categoryRepository.create(data);
      sendSuccess(res, created, 'Category created', 201);
    }catch(err){ next(err); }
  },
  async update(req: Request, res: Response, next: NextFunction){
    try{
      const updated = await categoryRepository.update(req.params.id, req.body);
      if(!updated) throw new NotFoundError('Category not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, updated, 'Category updated');
    }catch(err){ next(err); }
  },
  async delete(req: Request, res: Response, next: NextFunction){
    try{
      const { productRepository } = await import('../repositories/product.repository');
      const using = await productRepository.list({ categoryId: req.params.id, limit: 1 });
      if(using.length > 0) throw new BadRequestError('Cannot delete category with existing products. Move or delete products first.', ERROR_CODES.CONFLICT);
      const ok = await categoryRepository.delete(req.params.id);
      if(!ok) throw new NotFoundError('Category not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, null, 'Category deleted');
    }catch(err){ next(err); }
  }
};
