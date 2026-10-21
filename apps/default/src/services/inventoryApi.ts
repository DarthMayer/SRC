import axios from 'axios';

const INVENTORY_PROJECT_ID = '5ZVc4Wadk2xBUB33';

export interface InventoryItem {
  id: string;
  fieldValues: {
    '/text': string;
    '/attributes/@inv01'?: string; // Category
    '/attributes/@inv02'?: number; // Quantity
    '/attributes/@inv03'?: number; // Reorder Level
    '/attributes/@inv04'?: 'stock-good' | 'stock-low' | 'stock-out'; // Status
    '/attributes/@inv05'?: string; // SKU
    '/attributes/note'?: string;
  };
  parentId: string | null;
}

export const inventoryApi = {
  async getAll(): Promise<InventoryItem[]> {
    const response = await axios.get(`/api/taskade/projects/${INVENTORY_PROJECT_ID}/nodes`);
    return response.data.payload.nodes;
  },

  async create(item: Partial<InventoryItem['fieldValues']>): Promise<void> {
    await axios.post(`/api/taskade/projects/${INVENTORY_PROJECT_ID}/nodes`, item);
  },

  async update(nodeId: string, item: Partial<InventoryItem['fieldValues']>): Promise<void> {
    await axios.patch(`/api/taskade/projects/${INVENTORY_PROJECT_ID}/nodes/${nodeId}`, item);
  },

  async delete(nodeId: string): Promise<void> {
    await axios.delete(`/api/taskade/projects/${INVENTORY_PROJECT_ID}/nodes/${nodeId}`);
  },
};
