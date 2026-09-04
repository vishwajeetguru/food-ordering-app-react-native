import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Address } from '@/types';

type AddressState = {
  addresses: Address[];
  selectedId: string | null;
  selectedAddress: Address | null;
  hydrated: boolean;
  setAddresses: (list: Address[]) => void;
  setSelectedId: (id: string | null) => void;
  hydrateFromApi: (list: Address[]) => void;
  getDefault: () => Address | null;
  clear: () => void;
};

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [],
      selectedId: null,
      selectedAddress: null,
      hydrated: false,
      setAddresses: (addresses) => {
        const selectedId = get().selectedId;
        let selectedAddress: Address | null = null;
        if (selectedId) selectedAddress = addresses.find((a) => a.id === selectedId) || null;
        if (!selectedAddress) selectedAddress = addresses.find((a) => a.isDefault) || addresses[0] || null;
        set({ addresses, selectedAddress, selectedId: selectedAddress?.id || null });
      },
      setSelectedId: (id) => {
        const addr = get().addresses.find((a) => a.id === id) || null;
        set({ selectedId: id, selectedAddress: addr });
      },
      hydrateFromApi: (list) => {
        const selectedId = get().selectedId;
        let selected = list.find((a) => a.id === selectedId) || list.find((a) => a.isDefault) || list[0] || null;
        set({ addresses: list, selectedAddress: selected, selectedId: selected?.id || null, hydrated: true });
      },
      getDefault: () => {
        const list = get().addresses;
        return list.find((a) => a.isDefault) || list[0] || null;
      },
      clear: () => set({ addresses: [], selectedId: null, selectedAddress: null, hydrated: false }),
    }),
    {
      name: 'foody-address',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ selectedId: s.selectedId, addresses: s.addresses }),
    }
  )
);
