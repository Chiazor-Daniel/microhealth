import { api } from "./api";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  unitCost: number;
  status: string;
}

export const inventoryService = {
  list: () => api.get<InventoryItem[]>("/inventory"),
  getLowStock: () => api.get<InventoryItem[]>("/inventory/low-stock"),
  create: (data: Partial<InventoryItem>) => api.post<InventoryItem>("/inventory", data),
  adjustStock: (id: string, delta: number) => api.patch<InventoryItem>(`/inventory/${id}/stock`, { delta }),
  remove: (id: string) => api.delete(`/inventory/${id}`),
};
