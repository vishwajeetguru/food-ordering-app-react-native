import { COLLECTIONS } from '../config/constants';
import { getFirestore, isFirebaseConfigured } from '../config/firebase';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export interface Address {
  id: string;
  userId: string;
  label: 'Home'|'Work'|'Other';
  customLabel?: string;
  address: string;
  fullAddress?: string;
  houseFlat?: string;
  floor?: string;
  landmark?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  details?: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
  receiverName?: string;
  receiverPhone?: string;
  createdAt: string;
  updatedAt: string;
}

const memoryAddresses = new Map<string, Address>();
function shouldUseMemory(): boolean { return !isFirebaseConfigured() || process.env.NODE_ENV === 'test'; }
function nowISO(){ return new Date().toISOString(); }
function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

function sortAddresses(list: Address[]): Address[] {
  return list.sort((a,b) => {
    if(a.isDefault && !b.isDefault) return -1;
    if(!a.isDefault && b.isDefault) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

async function clearDefaultForUser(userId: string, exceptId?: string): Promise<void> {
  // memory
  for(const [id, addr] of memoryAddresses.entries()){
    if(addr.userId===userId && addr.isDefault && id!==exceptId){
      memoryAddresses.set(id, { ...addr, isDefault: false, updatedAt: nowISO() });
    }
  }
  if(shouldUseMemory()) return;
  try{
    const snap = await getFirestore().collection(COLLECTIONS.ADDRESSES).where('userId','==',userId).where('isDefault','==',true).get();
    if(snap.empty) return;
    const batch = getFirestore().batch();
    let hasWrites = false;
    snap.docs.forEach(doc=>{
      if(doc.id !== exceptId){
        batch.update(doc.ref, { isDefault: false, updatedAt: nowISO() });
        hasWrites = true;
      }
    });
    if(hasWrites) await batch.commit();
  }catch(e:any){
    logger.warn('addressRepository.clearDefault failed', { error: e.message });
  }
}

export const addressRepository = {
  // For testing
  _clearMemory(){ memoryAddresses.clear(); },
  _getMemoryMap(){ return memoryAddresses; },

  async listForUser(userId:string): Promise<Address[]>{
    let list: Address[] = [];
    if(shouldUseMemory()){
      list = Array.from(memoryAddresses.values()).filter(a=>a.userId===userId);
      return sortAddresses(list);
    }
    try{
      const snap= await getFirestore().collection(COLLECTIONS.ADDRESSES).where('userId','==',userId).get();
      if(snap.empty){
        list = Array.from(memoryAddresses.values()).filter(a=>a.userId===userId);
      } else {
        list = snap.docs.map(d=> d.data() as Address);
        // also merge any memory-only that not in snap (dev fallback)
        const snapIds = new Set(list.map(a=>a.id));
        for(const m of memoryAddresses.values()){
          if(m.userId===userId && !snapIds.has(m.id)) list.push(m);
        }
      }
      return sortAddresses(list);
    }catch(e:any){
      logger.warn('addressRepository.list fallback', {error:e.message});
      list = Array.from(memoryAddresses.values()).filter(a=>a.userId===userId);
      return sortAddresses(list);
    }
  },

  async getDefault(userId:string): Promise<Address|null>{
    const list = await this.listForUser(userId);
    if(!list.length) return null;
    return list.find(a=>a.isDefault) || list[0] || null;
  },

  async create(userId:string, data: Omit<Address,'id'|'userId'|'createdAt'|'updatedAt'>): Promise<Address>{
    const id = crypto.randomUUID();
    // Determine isDefault: if explicitly true, else if first address then true
    const existing = await this.listForUser(userId);
    const shouldBeDefault = data.isDefault === true || existing.length === 0;
    const fullAddr = (data as any).fullAddress || data.address;
    const addr: Address = {
      id,
      userId,
      label: data.label,
      customLabel: (data as any).customLabel,
      address: data.address,
      fullAddress: fullAddr,
      houseFlat: (data as any).houseFlat,
      floor: (data as any).floor,
      landmark: (data as any).landmark,
      area: (data as any).area,
      city: (data as any).city,
      state: (data as any).state,
      pincode: (data as any).pincode,
      details: data.details,
      lat: data.lat,
      lng: data.lng,
      isDefault: shouldBeDefault,
      receiverName: (data as any).receiverName,
      receiverPhone: (data as any).receiverPhone,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    } as Address;

    if(shouldBeDefault){
      await clearDefaultForUser(userId);
    }

    if(shouldUseMemory()){ memoryAddresses.set(id, addr); return addr; }
    try{
      await getFirestore().collection(COLLECTIONS.ADDRESSES).doc(id).set(stripUndefined(addr as any) as any);
      memoryAddresses.set(id, addr);
      return addr;
    }catch(e:any){
      logger.warn('addressRepository.create fallback', {error:e.message});
      memoryAddresses.set(id, addr);
      return addr;
    }
  },

  async getById(id:string): Promise<Address|null>{
    if(memoryAddresses.has(id)) return memoryAddresses.get(id)!;
    if(shouldUseMemory()) return null;
    try{
      const snap= await getFirestore().collection(COLLECTIONS.ADDRESSES).doc(id).get();
      if(!snap.exists) return null;
      const data=snap.data() as Address;
      // ensure isDefault defaults to false for old docs
      if(typeof (data as any).isDefault !== 'boolean') (data as any).isDefault = false;
      memoryAddresses.set(id,data);
      return data;
    }catch(e:any){
      logger.warn('addressRepository.getById fallback', {error:e.message});
      return memoryAddresses.get(id)||null;
    }
  },

  async update(id:string, userId:string, patch: Partial<Address>): Promise<Address|null>{
    const existing = await this.getById(id);
    if(!existing || existing.userId!==userId) return null;

    // If patch wants to become default, clear others first
    if(patch.isDefault === true){
      await clearDefaultForUser(userId, id);
    }

    const updated = { ...existing, ...patch, fullAddress: (patch as any).fullAddress || patch.address || existing.fullAddress || existing.address, updatedAt: nowISO() } as Address;

    if(shouldUseMemory()){ memoryAddresses.set(id, updated); return updated; }
    try{
      await getFirestore().collection(COLLECTIONS.ADDRESSES).doc(id).set(stripUndefined(updated as any) as any, {merge:true});
      memoryAddresses.set(id, updated);
      return updated;
    }catch(e:any){
      logger.warn('addressRepository.update fallback', {error:e.message});
      memoryAddresses.set(id, updated);
      return updated;
    }
  },

  async setDefault(id:string, userId:string): Promise<Address|null>{
    const existing = await this.getById(id);
    if(!existing || existing.userId!==userId) return null;
    await clearDefaultForUser(userId, id);
    const updated = { ...existing, isDefault: true, updatedAt: nowISO() } as Address;
    if(shouldUseMemory()){ memoryAddresses.set(id, updated); return updated; }
    try{
      await getFirestore().collection(COLLECTIONS.ADDRESSES).doc(id).set({ isDefault: true, updatedAt: updated.updatedAt }, { merge: true });
      memoryAddresses.set(id, updated);
      return updated;
    }catch(e:any){
      logger.warn('addressRepository.setDefault fallback', {error:e.message});
      memoryAddresses.set(id, updated);
      return updated;
    }
  },

  async delete(id:string, userId:string): Promise<boolean>{
    const existing = await this.getById(id);
    if(!existing || existing.userId!==userId) return false;
    const wasDefault = existing.isDefault;
    if(shouldUseMemory()){
      memoryAddresses.delete(id);
      if(wasDefault){
        const remaining = Array.from(memoryAddresses.values()).filter(a=>a.userId===userId);
        if(remaining.length){
          const next = sortAddresses(remaining)[0];
          memoryAddresses.set(next.id, { ...next, isDefault: true, updatedAt: nowISO() });
        }
      }
      return true;
    }
    try{
      await getFirestore().collection(COLLECTIONS.ADDRESSES).doc(id).delete();
      memoryAddresses.delete(id);
      if(wasDefault){
        const remaining = await this.listForUser(userId);
        if(remaining.length && !remaining.some(a=>a.isDefault)){
          await this.setDefault(remaining[0].id, userId);
        }
      }
      return true;
    }catch(e:any){
      logger.warn('addressRepository.delete fallback', {error:e.message});
      memoryAddresses.delete(id);
      if(wasDefault){
        const remaining = Array.from(memoryAddresses.values()).filter(a=>a.userId===userId);
        if(remaining.length){
          const next = sortAddresses(remaining)[0];
          memoryAddresses.set(next.id, { ...next, isDefault: true, updatedAt: nowISO() });
        }
      }
      return true;
    }
  }
};
