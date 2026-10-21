import axios from 'axios';

// Base API client
const api = axios.create({
  baseURL: '/api/taskade',
});

// Project IDs from discovered APIs
export const PROJECT_IDS = {
  INVENTORY: '5ZVc4Wadk2xBUB33',
  SUPPLIERS: 'XozsQb1HgFrf1Ty6',
  MAINTENANCE: 'rSTZShL3yiMDt3Df',
  SERVICE_HISTORY: 'rzRv6ECCm2VeUdNq',
  ASSETS: '9qEbptwmjoYcwpTp',
} as const;

// Agent ID
export const AGENT_ID = '01M21PBWNHSP9E4MNJDGX6TYKB';

// =====================
// INVENTORY ITEMS
// =====================
export interface InventoryItemRaw {
  id: string;
  fieldValues: {
    '/text'?: string;
    '/attributes/@inv01'?: string; // Category
    '/attributes/@inv02'?: number; // Quantity
    '/attributes/@inv03'?: number; // Reorder Level
    '/attributes/@inv04'?: 'stock-good' | 'stock-low' | 'stock-out' | 'stock-ordered'; // Status
    '/attributes/@inv05'?: string; // SKU
    '/attributes/note'?: string;
  };
  parentId: string | null;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  status: 'stock-good' | 'stock-low' | 'stock-out' | 'stock-ordered';
  sku: string;
  note: string;
}

const transformInventoryItem = (raw: InventoryItemRaw): InventoryItem => ({
  id: raw.id,
  name: raw.fieldValues?.['/text'] || 'Unnamed Item',
  category: raw.fieldValues?.['/attributes/@inv01'] || '',
  quantity: raw.fieldValues?.['/attributes/@inv02'] || 0,
  reorderLevel: raw.fieldValues?.['/attributes/@inv03'] || 0,
  status: raw.fieldValues?.['/attributes/@inv04'] || 'stock-good',
  sku: raw.fieldValues?.['/attributes/@inv05'] || '',
  note: raw.fieldValues?.['/attributes/note'] || '',
});

export const inventoryApi = {
  async getAll(): Promise<InventoryItem[]> {
    const response = await api.get(`/projects/${PROJECT_IDS.INVENTORY}/nodes`);
    const rawItems: InventoryItemRaw[] = response.data?.payload?.nodes || [];
    return rawItems.map(transformInventoryItem);
  },

  async create(item: Partial<InventoryItem>): Promise<void> {
    await api.post(`/projects/${PROJECT_IDS.INVENTORY}/nodes`, {
      '/text': item.name,
      '/attributes/@inv01': item.category,
      '/attributes/@inv02': item.quantity,
      '/attributes/@inv03': item.reorderLevel,
      '/attributes/@inv04': item.status,
      '/attributes/@inv05': item.sku,
    });
  },

  async update(nodeId: string, item: Partial<InventoryItem>): Promise<void> {
    const payload: Record<string, unknown> = {};
    if (item.name !== undefined) payload['/text'] = item.name;
    if (item.category !== undefined) payload['/attributes/@inv01'] = item.category;
    if (item.quantity !== undefined) payload['/attributes/@inv02'] = item.quantity;
    if (item.reorderLevel !== undefined) payload['/attributes/@inv03'] = item.reorderLevel;
    if (item.status !== undefined) payload['/attributes/@inv04'] = item.status;
    if (item.sku !== undefined) payload['/attributes/@inv05'] = item.sku;
    
    await api.patch(`/projects/${PROJECT_IDS.INVENTORY}/nodes/${nodeId}`, payload);
  },

  async delete(nodeId: string): Promise<void> {
    await api.delete(`/projects/${PROJECT_IDS.INVENTORY}/nodes/${nodeId}`);
  },
};

// =====================
// SUPPLIERS
// =====================
export interface SupplierRaw {
  id: string;
  fieldValues: {
    '/text'?: string;
    '/attributes/@sup01'?: string; // Email
    '/attributes/@sup02'?: string; // Phone
    '/attributes/@sup03'?: string; // Specialty
    '/attributes/note'?: string;
  };
  parentId: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  note: string;
}

const transformSupplier = (raw: SupplierRaw): Supplier => ({
  id: raw.id,
  name: raw.fieldValues?.['/text'] || 'Unnamed Supplier',
  email: raw.fieldValues?.['/attributes/@sup01'] || '',
  phone: raw.fieldValues?.['/attributes/@sup02'] || '',
  specialty: raw.fieldValues?.['/attributes/@sup03'] || '',
  note: raw.fieldValues?.['/attributes/note'] || '',
});

export const suppliersApi = {
  async getAll(): Promise<Supplier[]> {
    const response = await api.get(`/projects/${PROJECT_IDS.SUPPLIERS}/nodes`);
    const rawItems: SupplierRaw[] = response.data?.payload?.nodes || [];
    return rawItems.map(transformSupplier);
  },

  async create(item: Partial<Supplier>): Promise<void> {
    await api.post(`/projects/${PROJECT_IDS.SUPPLIERS}/nodes`, {
      '/text': item.name,
      '/attributes/@sup01': item.email,
      '/attributes/@sup02': item.phone,
      '/attributes/@sup03': item.specialty,
    });
  },

  async delete(nodeId: string): Promise<void> {
    await api.delete(`/projects/${PROJECT_IDS.SUPPLIERS}/nodes/${nodeId}`);
  },
};

// =====================
// SERVICE HISTORY
// =====================
export interface ServiceHistoryRaw {
  id: string;
  fieldValues: {
    '/text'?: string;
    '/attributes/@srv01'?: string; // Asset Name
    '/attributes/@srv02'?: string; // Service Date
    '/attributes/@srv03'?: string; // Technician
    '/attributes/@srv04'?: 'opt-preventive' | 'opt-repair' | 'opt-inspection'; // Service Type
    '/attributes/@srv05'?: number; // Cost
    '/attributes/note'?: string;
  };
  parentId: string | null;
}

export interface ServiceHistory {
  id: string;
  title: string;
  assetName: string;
  serviceDate: string;
  technician: string;
  serviceType: 'preventive' | 'repair' | 'inspection';
  cost: number;
  note: string;
}

const transformServiceHistory = (raw: ServiceHistoryRaw): ServiceHistory => ({
  id: raw.id,
  title: raw.fieldValues?.['/text'] || 'Service Record',
  assetName: raw.fieldValues?.['/attributes/@srv01'] || '',
  serviceDate: raw.fieldValues?.['/attributes/@srv02'] || '',
  technician: raw.fieldValues?.['/attributes/@srv03'] || '',
  serviceType: (raw.fieldValues?.['/attributes/@srv04']?.replace('opt-', '') as 'preventive' | 'repair' | 'inspection') || 'preventive',
  cost: raw.fieldValues?.['/attributes/@srv05'] || 0,
  note: raw.fieldValues?.['/attributes/note'] || '',
});

export const serviceHistoryApi = {
  async getAll(): Promise<ServiceHistory[]> {
    const response = await api.get(`/projects/${PROJECT_IDS.SERVICE_HISTORY}/nodes`);
    const rawItems: ServiceHistoryRaw[] = response.data?.payload?.nodes || [];
    return rawItems.map(transformServiceHistory);
  },
};

// =====================
// ASSETS
// =====================
export interface AssetRaw {
  id: string;
  fieldValues: {
    '/text'?: string;
    '/attributes/@ast01'?: string; // Asset Type
    '/attributes/@ast02'?: string; // Location
    '/attributes/@ast03'?: string; // Model/Serial
    '/attributes/@ast04'?: string; // Last Service Date
    '/attributes/@ast05'?: string; // Next Service Date
    '/attributes/@ast06'?: 'opt-due' | 'opt-upcoming' | 'opt-completed'; // Status
    '/attributes/@ast07'?: number; // Service Interval (Days)
    '/attributes/note'?: string;
  };
  parentId: string | null;
}

export interface Asset {
  id: string;
  name: string;
  assetType: string;
  location: string;
  modelSerial: string;
  lastServiceDate: string;
  nextServiceDate: string;
  status: 'due' | 'upcoming' | 'completed';
  serviceInterval: number;
  note: string;
}

const transformAsset = (raw: AssetRaw): Asset => ({
  id: raw.id,
  name: raw.fieldValues?.['/text'] || 'Unnamed Asset',
  assetType: raw.fieldValues?.['/attributes/@ast01'] || '',
  location: raw.fieldValues?.['/attributes/@ast02'] || '',
  modelSerial: raw.fieldValues?.['/attributes/@ast03'] || '',
  lastServiceDate: raw.fieldValues?.['/attributes/@ast04'] || '',
  nextServiceDate: raw.fieldValues?.['/attributes/@ast05'] || '',
  status: (raw.fieldValues?.['/attributes/@ast06']?.replace('opt-', '') as 'due' | 'upcoming' | 'completed') || 'upcoming',
  serviceInterval: raw.fieldValues?.['/attributes/@ast07'] || 0,
  note: raw.fieldValues?.['/attributes/note'] || '',
});

export const assetsApi = {
  async getAll(): Promise<Asset[]> {
    const response = await api.get(`/projects/${PROJECT_IDS.ASSETS}/nodes`);
    const rawItems: AssetRaw[] = response.data?.payload?.nodes || [];
    return rawItems.map(transformAsset);
  },
};

// =====================
// AGENT CHAT
// =====================
export const agentApi = {
  async createConversation(): Promise<{ conversationId: string }> {
    const response = await api.post(`/agents/${AGENT_ID}/public-conversations`);
    return { conversationId: response.data.conversationId };
  },

  getStreamUrl(conversationId: string): string {
    return `/api/taskade/agents/${AGENT_ID}/public-conversations/${conversationId}/stream`;
  },

  async sendMessage(conversationId: string, text: string): Promise<{ messageId: string }> {
    const response = await api.post(`/agents/${AGENT_ID}/public-conversations/${conversationId}/messages`, { text });
    return { messageId: response.data.messageId };
  },
};

export default api;
