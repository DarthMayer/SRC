import { create } from 'zustand';
import type { Asset, ServiceRecord } from '../types';
import type { InventoryItem } from '../services/api';

interface MaintenanceStore {
  assets: Asset[];
  serviceRecords: ServiceRecord[];
  selectedAsset: Asset | null;
  isLoading: boolean;
  error: string | null;
  
  setAssets: (assets: Asset[]) => void;
  setServiceRecords: (records: ServiceRecord[]) => void;
  setSelectedAsset: (asset: Asset | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useMaintenanceStore = create<MaintenanceStore>((set) => ({
  assets: [],
  serviceRecords: [],
  selectedAsset: null,
  isLoading: false,
  error: null,
  
  setAssets: (assets) => set({ assets }),
  setServiceRecords: (records) => set({ serviceRecords: records }),
  setSelectedAsset: (asset) => set({ selectedAsset: asset }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));

// Inventory data store - caches data between tab switches
interface InventoryStore {
  items: InventoryItem[];
  isLoaded: boolean;
  isLoading: boolean;
  lastFetchTime: number | null;
  
  setItems: (items: InventoryItem[]) => void;
  setLoading: (loading: boolean) => void;
  setLoaded: (loaded: boolean) => void;
  invalidateCache: () => void;
}

const CACHE_DURATION = 30000; // 30 seconds cache

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  items: [],
  isLoaded: false,
  isLoading: false,
  lastFetchTime: null,
  
  setItems: (items) => set({ items, isLoaded: true, lastFetchTime: Date.now() }),
  setLoading: (isLoading) => set({ isLoading }),
  setLoaded: (isLoaded) => set({ isLoaded }),
  invalidateCache: () => set({ isLoaded: false, lastFetchTime: null }),
}));

// Helper hook to check if cache is valid
export const useIsCacheValid = () => {
  const { lastFetchTime, isLoaded } = useInventoryStore();
  if (!isLoaded || !lastFetchTime) return false;
  return Date.now() - lastFetchTime < CACHE_DURATION;
};
