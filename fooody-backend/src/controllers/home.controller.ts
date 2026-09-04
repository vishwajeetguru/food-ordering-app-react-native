import { Request, Response, NextFunction } from 'express';
import { restaurantRepository } from '../repositories/restaurant.repository';
import { categoryRepository } from '../repositories/category.repository';
import { productRepository } from '../repositories/product.repository';
import { offerRepository } from '../repositories/offer.repository';
import { sendSuccess } from '../utils/response';

export const homeController = {
  async get(_req: Request, res: Response, next: NextFunction) {
    try {
      // Performance: filtered queries use Firestore where (no in-memory 100 fetch) + parallel
      const [restaurant, categories, popular, recommended, allProducts, offers] = await Promise.all([
        restaurantRepository.getDefault(),
        categoryRepository.list(),
        productRepository.list({ isPopular: true, limit: 6 }),
        productRepository.list({ isRecommended: true, limit: 6 }),
        productRepository.list({ limit: 20 }),
        offerRepository.list(true),
      ]);

      sendSuccess(res, {
        restaurant,
        categories,
        products: {
          popular: popular.length ? popular : allProducts.slice(0, 6),
          recommended: recommended.length ? recommended : allProducts.slice(0, 6),
          all: allProducts,
        },
        offers,
      }, 'Home data retrieved');
    } catch (err) { next(err); }
  },
};
