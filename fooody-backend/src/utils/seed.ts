import { getFirestore, isFirebaseConfigured } from '../config/firebase';
import { logger } from './logger';
import { productRepository } from '../repositories/product.repository';
import { categoryRepository } from '../repositories/category.repository';
import { restaurantRepository } from '../repositories/restaurant.repository';
import { offerRepository } from '../repositories/offer.repository';
import { COLLECTIONS } from '../config/constants';

/**
 * Seed Firestore collections with frontend mock data if empty.
 * Idempotent: only writes when collection has no documents.
 * Works for both local dev (Firestore emulator / real) and prod.
 * For mock-memory mode (no Firebase) seeding already happens via ensureSeed() in repos.
 */
export async function seedDatabase(opts: { force?: boolean } = {}): Promise<{
  products: number;
  categories: number;
  restaurants: number;
  offers: number;
  skippedReason?: string;
}> {
  if (!isFirebaseConfigured() && !opts.force) {
    return { products: 0, categories: 0, restaurants: 0, offers: 0, skippedReason: 'Firebase not configured — using in-memory seed (no Firestore write needed)' };
  }

  const db = getFirestore();
  let seeded = { products: 0, categories: 0, restaurants: 0, offers: 0 };

  // Helper to seed — ensures all frontend mock docs exist (idempotent).
  // If force=true, overwrites all seeds. Otherwise only inserts missing ids.
  async function seedCollection<T extends { id: string }>(
    collection: string,
    repoGetSeed: () => T[]
  ): Promise<number> {
    try {
      const seeds = repoGetSeed();
      if (seeds.length === 0) return 0;
      // Fetch existing ids (lightweight)
      let existingIds = new Set<string>();
      try {
        const snap = await db.collection(collection).get();
        snap.forEach(d => existingIds.add(d.id));
        if (!opts.force && existingIds.size >= seeds.length) {
          // Check if all seed ids already present — if so, skip
          const allPresent = seeds.every(s => existingIds.has(s.id));
          if (allPresent) {
            logger.info(`Seed skip: ${collection} already has all ${seeds.length} seeds`);
            return 0;
          }
        }
      } catch (e: any) {
        // If get fails, fall back to seeding all
        logger.warn(`Seed ${collection} existing check failed, will upsert all`, { error: e.message });
      }
      const batch = db.batch();
      let toWrite = 0;
      for (const item of seeds) {
        if (!opts.force && existingIds.has(item.id)) continue; // skip existing unless forced
        const docRef = db.collection(collection).doc(item.id);
        batch.set(docRef, item, { merge: true });
        toWrite++;
      }
      if (toWrite === 0) {
        // If not forced and some ids missing but also some present, we already handled partial;
        // However if force and we skipped due to early return, we wouldn't be here.
        // For idempotent full check without force, we may need to handle case where collection has some but not all:
        // Re-check: if we skipped due to existingIds size < seeds.length, we still need to write missing.
        // Our early return only when allPresent, so here toWrite>0 if missing. If toWrite==0 and not allPresent, it means batch empty due to logic — just return 0.
        logger.info(`Seed skip: ${collection} no new docs to write`);
        return 0;
      }
      await batch.commit();
      logger.info(`Seeded ${toWrite}/${seeds.length} docs into ${collection}${opts.force ? ' (forced)' : ''}`);
      return toWrite;
    } catch (e: any) {
      logger.warn(`Seed ${collection} failed, will rely on memory fallback`, { error: e.message });
      return 0;
    }
  }

  seeded.products = await seedCollection(COLLECTIONS.PRODUCTS, () => productRepository._getSeed());
  seeded.categories = await seedCollection(COLLECTIONS.CATEGORIES, () => categoryRepository._getSeed());
  seeded.restaurants = await seedCollection(COLLECTIONS.RESTAURANTS, () => restaurantRepository._getSeed());
  seeded.offers = await seedCollection(COLLECTIONS.OFFERS, () => offerRepository._getSeed());

  return seeded;
}

// CLI support: node dist/utils/seed.js --force
if (require.main === module) {
  (async () => {
    const force = process.argv.includes('--force') || process.argv.includes('-f');
    const result = await seedDatabase({ force });
    console.log('Seed result:', result);
    process.exit(0);
  })();
}
