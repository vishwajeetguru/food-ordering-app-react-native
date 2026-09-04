import { COLLECTIONS } from '../config/constants';
import { getFirestore, isFirebaseConfigured } from '../config/firebase';
import { logger } from '../utils/logger';

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

const memory = new Map<string, WishlistItem>();
function shouldUseMemory(): boolean { return !isFirebaseConfigured() || process.env.NODE_ENV === 'test'; }
function nowISO(){ return new Date().toISOString(); }
function makeId(userId: string, productId: string){ return `${userId}_${productId}`; }

export const wishlistRepository = {
  _clearMemory(){ memory.clear(); },
  async listForUser(userId: string): Promise<WishlistItem[]>{
    if(shouldUseMemory()){
      return Array.from(memory.values()).filter(w=>w.userId===userId).sort((a,b)=> new Date(b.createdAt).getTime()- new Date(a.createdAt).getTime());
    }
    try{
      const snap = await getFirestore().collection(COLLECTIONS.WISHLISTS).where('userId','==',userId).get();
      if(snap.empty){
        return Array.from(memory.values()).filter(w=>w.userId===userId);
      }
      const list = snap.docs.map(d=> d.data() as WishlistItem);
      // merge memory
      const ids = new Set(list.map(i=>i.id));
      for(const m of memory.values()) if(m.userId===userId && !ids.has(m.id)) list.push(m);
      return list.sort((a,b)=> new Date(b.createdAt).getTime()- new Date(a.createdAt).getTime());
    }catch(e:any){
      logger.warn('wishlist.list fallback', {error:e.message});
      return Array.from(memory.values()).filter(w=>w.userId===userId);
    }
  },
  async exists(userId: string, productId: string): Promise<boolean>{
    const id = makeId(userId, productId);
    if(memory.has(id)) return true;
    if(shouldUseMemory()) return false;
    try{
      const snap = await getFirestore().collection(COLLECTIONS.WISHLISTS).doc(id).get();
      return snap.exists;
    }catch{ return memory.has(id); }
  },
  async add(userId: string, productId: string): Promise<WishlistItem>{
    const id = makeId(userId, productId);
    const item: WishlistItem = { id, userId, productId, createdAt: nowISO() };
    if(memory.has(id)) return memory.get(id)!;
    memory.set(id, item);
    if(shouldUseMemory()) return item;
    try{
      await getFirestore().collection(COLLECTIONS.WISHLISTS).doc(id).set(item);
      return item;
    }catch(e:any){
      logger.warn('wishlist.add fallback', {error:e.message});
      return item;
    }
  },
  async remove(userId: string, productId: string): Promise<boolean>{
    const id = makeId(userId, productId);
    const existed = memory.has(id);
    memory.delete(id);
    if(shouldUseMemory()) return existed || true;
    try{
      await getFirestore().collection(COLLECTIONS.WISHLISTS).doc(id).delete();
      return true;
    }catch(e:any){
      logger.warn('wishlist.remove fallback', {error:e.message});
      return true;
    }
  },
  async toggle(userId: string, productId: string): Promise<{ added: boolean; item?: WishlistItem }>{
    const exists = await this.exists(userId, productId);
    if(exists){
      await this.remove(userId, productId);
      return { added: false };
    }
    const item = await this.add(userId, productId);
    return { added: true, item };
  },
  async clearForUser(userId: string): Promise<void>{
    const list = await this.listForUser(userId);
    for(const it of list) await this.remove(userId, it.productId);
  }
};
