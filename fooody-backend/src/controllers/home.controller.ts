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
      const [restaurant, categories, popular, recommended, allProducts, offers, settings, banners] = await Promise.all([
        restaurantRepository.getDefault(),
        categoryRepository.list(),
        productRepository.list({ isPopular: true, limit: 6 }),
        productRepository.list({ isRecommended: true, limit: 6 }),
        productRepository.list({ limit: 20 }),
        offerRepository.list(true),
        import('../repositories/settings.repository').then(m => m.settingsRepository.get()).catch(() => null as any),
        import('../repositories/banner.repository').then(m => m.bannerRepository.list()).catch(() => [] as any[]),
      ]);

      const popularLimit = (settings as any)?.home?.popularLimit || 6;
      const popularEnabled = (settings as any)?.home?.popularEnabled !== false;
      const activeBanners = (banners as any[]).filter((b) => b.active !== false).slice(0, 10);

      sendSuccess(res, {
        restaurant,
        categories: (settings as any)?.home?.categoriesEnabled === false ? [] : categories,
        products: {
          popular: popularEnabled ? popular.slice(0, popularLimit) : [],
          recommended: recommended.length ? recommended : allProducts.slice(0, 6),
          all: allProducts,
        },
        offers,
        banners: activeBanners.length ? activeBanners : undefined,
        settings: settings?.home || undefined,
      }, 'Home data retrieved');
    } catch (err) { next(err); }
  },
};
