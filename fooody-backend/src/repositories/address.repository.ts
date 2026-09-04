import { COLLECTIONS } from '../config/constants';
import { getFirestore, isFirebaseConfigured } from '../config/firebase';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export interface Address {
  id: string;
  userId: string;
  label: 'Home'|'Work'|'Other';
  address: string;
  details?: string;
  lat?: number;
  lng?: number;
  createdAt: string;
  updatedAt: string;
}

const memoryAddresses = new Map<string, Address>();
function shouldUseMemory(): boolean { return !isFirebaseConfigured() || process.env.NODE_ENV === 'test'; }
function nowISO(){ return new Date().toISOString(); }

export const addressRepository = {
  async listForUser(userId:string): Promise<Address[]>{
    if(shouldUseMemory()){
      return Array.from(memoryAddresses.values()).filter(a=>a.userId===userId);
    }
    try{
      const snap= await getFirestore().collection(COLLECTIONS.ADDRESSES).where('userId','==',userId).get();
      if(snap.empty) return Array.from(memoryAddresses.values()).filter(a=>a.userId===userId);
      return snap.docs.map(d=> d.data() as Address);
    }catch(e:any){
      logger.warn('addressRepository.list fallback', {error:e.message});
      return Array.from(memoryAddresses.values()).filter(a=>a.userId===userId);
    }
  },
  async create(userId:string, data: Omit<Address,'id'|'userId'|'createdAt'|'updatedAt'>): Promise<Address>{
    const id = crypto.randomUUID();
    const addr: Address = { id, userId, ...data, createdAt: nowISO(), updatedAt: nowISO() } as Address;
    if(shouldUseMemory()){ memoryAddresses.set(id, addr); return addr; }
    try{
      await getFirestore().collection(COLLECTIONS.ADDRESSES).doc(id).set(addr);
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
    const updated = { ...existing, ...patch, updatedAt: nowISO() } as Address;
    if(shouldUseMemory()){ memoryAddresses.set(id, updated); return updated; }
    try{
      await getFirestore().collection(COLLECTIONS.ADDRESSES).doc(id).set(updated, {merge:true});
      memoryAddresses.set(id, updated);
      return updated;
    }catch(e:any){
      logger.warn('addressRepository.update fallback', {error:e.message});
      memoryAddresses.set(id, updated);
      return updated;
    }
  },
  async delete(id:string, userId:string): Promise<boolean>{
    const existing = await this.getById(id);
    if(!existing || existing.userId!==userId) return false;
    if(shouldUseMemory()){ memoryAddresses.delete(id); return true; }
    try{
      await getFirestore().collection(COLLECTIONS.ADDRESSES).doc(id).delete();
      memoryAddresses.delete(id);
      return true;
    }catch(e:any){
      logger.warn('addressRepository.delete fallback', {error:e.message});
      memoryAddresses.delete(id);
      return true;
    }
  }
};
