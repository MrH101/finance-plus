import { api } from './api';

// ==================== ENHANCED INVENTORY INTERFACES ====================

export interface Warehouse {
  id: number;
  business: number;
  business_name: string;
  name: string;
  code: string;
  address: string;
  manager: number | null;
  manager_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: number;
  business: number;
  business_name: string;
  name: string;
  code: string;
  description: string;
  parent_category: number | null;
  parent_name: string;
  is_active: boolean;
  created_at: string;
}

export interface InventoryItem {
  id: number;
  business: number;
  business_name: string;
  name: string;
  sku: string;
  barcode: string;
  item_type: 'PRODUCT' | 'SERVICE' | 'RAW_MATERIAL' | 'FINISHED_GOOD';
  category: number | null;
  category_name: string;
  unit_of_measure: string;
  purchase_price: number;
  selling_price: number;
  minimum_stock_level: number;
  maximum_stock_level: number;
  reorder_point: number;
  valuation_method: 'FIFO' | 'LIFO' | 'WEIGHTED_AVERAGE' | 'STANDARD_COST';
  track_batches: boolean;
  track_serial_numbers: boolean;
  current_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockRecord {
  id: number;
  item: number;
  item_name: string;
  warehouse: number;
  warehouse_name: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  last_updated: string;
}

export interface StockMovement {
  id: number;
  item: number;
  item_name: string;
  warehouse: number;
  warehouse_name: string;
  movement_type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT' | 'DAMAGE' | 'EXPIRED';
  quantity: number;
  unit_cost: number;
  total_cost: number;
  reference: string;
  notes: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
}

// ==================== MANUFACTURING INTERFACES ====================

export interface BOMItem {
  id: number;
  material: number;
  material_name: string;
  quantity: number;
  unit_cost: number;
  scrap_percentage: number;
  total_cost: number;
}

export interface BillOfMaterials {
  id: number;
  business: number;
  business_name: string;
  finished_product: number;
  finished_product_name: string;
  name: string;
  version: string;
  quantity: number;
  items: BOMItem[];
  total_cost: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkOrder {
  id: number;
  business: number;
  business_name: string;
  work_order_number: string;
  bom: number;
  product_name: string;
  quantity_to_produce: number;
  quantity_produced: number;
  status: 'DRAFT' | 'RELEASED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date: string | null;
  actual_end_date: string | null;
  completion_percentage: number;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

// ==================== ENHANCED INVENTORY SERVICE ====================

class EnhancedInventoryService {
  // Warehouse Management
  async getWarehouses(): Promise<Warehouse[]> {
    const response = await api.get('/warehouses/');
    return response.data.results || response.data;
  }

  async createWarehouse(data: Partial<Warehouse>): Promise<Warehouse> {
    const response = await api.post('/warehouses/', data);
    return response.data;
  }

  async updateWarehouse(id: number, data: Partial<Warehouse>): Promise<Warehouse> {
    const response = await api.patch(`/warehouses/${id}/`, data);
    return response.data;
  }

  async deleteWarehouse(id: number): Promise<void> {
    await api.delete(`/warehouses/${id}/`);
  }

  // Product Categories
  async getProductCategories(): Promise<ProductCategory[]> {
    const response = await api.get('/product-categories/');
    return response.data.results || response.data;
  }

  async createProductCategory(data: Partial<ProductCategory>): Promise<ProductCategory> {
    const response = await api.post('/product-categories/', data);
    return response.data;
  }

  async updateProductCategory(id: number, data: Partial<ProductCategory>): Promise<ProductCategory> {
    const response = await api.patch(`/product-categories/${id}/`, data);
    return response.data;
  }

  async deleteProductCategory(id: number): Promise<void> {
    await api.delete(`/product-categories/${id}/`);
  }

  // Enhanced Inventory Items
  async getInventoryItems(): Promise<InventoryItem[]> {
    const response = await api.get('/inventory-items/');
    return response.data.results || response.data;
  }

  async getInventoryItem(id: number): Promise<InventoryItem> {
    const response = await api.get(`/inventory-items/${id}/`);
    return response.data;
  }

  async createInventoryItem(data: Partial<InventoryItem>): Promise<InventoryItem> {
    const response = await api.post('/inventory-items/', data);
    return response.data;
  }

  async updateInventoryItem(id: number, data: Partial<InventoryItem>): Promise<InventoryItem> {
    const response = await api.patch(`/inventory-items/${id}/`, data);
    return response.data;
  }

  async deleteInventoryItem(id: number): Promise<void> {
    await api.delete(`/inventory-items/${id}/`);
  }

  async getLowStockAlerts(): Promise<InventoryItem[]> {
    const response = await api.get('/inventory-items/low_stock_alerts/');
    return response.data;
  }

  async getStockByWarehouse(itemId: number): Promise<StockRecord[]> {
    const response = await api.get(`/inventory-items/${itemId}/stock_by_warehouse/`);
    return response.data;
  }

  // Stock Movements
  async getStockMovements(): Promise<StockMovement[]> {
    const response = await api.get('/stock-movements/');
    return response.data.results || response.data;
  }

  async createStockMovement(data: Partial<StockMovement>): Promise<StockMovement> {
    const response = await api.post('/stock-movements/', data);
    return response.data;
  }

  // Utility Functions
  generateSKU(categoryCode: string, sequence: number): string {
    return `${categoryCode}-${sequence.toString().padStart(6, '0')}`;
  }

  generateBarcode(): string {
    return Math.random().toString().substr(2, 13);
  }

  calculateStockValue(items: InventoryItem[]): number {
    return items.reduce((total, item) => {
      return total + (item.current_stock * item.purchase_price);
    }, 0);
  }

  getStockStatus(item: InventoryItem): 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK' {
    if (item.current_stock === 0) return 'OUT_OF_STOCK';
    if (item.current_stock <= item.reorder_point) return 'LOW_STOCK';
    if (item.current_stock > item.maximum_stock_level) return 'OVERSTOCK';
    return 'IN_STOCK';
  }

  getStockStatusColor(status: string): string {
    const colors = {
      IN_STOCK: 'text-green-600',
      LOW_STOCK: 'text-yellow-600',
      OUT_OF_STOCK: 'text-red-600',
      OVERSTOCK: 'text-blue-600'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600';
  }
}

// ==================== MANUFACTURING SERVICE ====================

class ManufacturingService {
  // Bill of Materials
  async getBillsOfMaterials(): Promise<BillOfMaterials[]> {
    const response = await api.get('/bills-of-materials/');
    return response.data.results || response.data;
  }

  async getBillOfMaterials(id: number): Promise<BillOfMaterials> {
    const response = await api.get(`/bills-of-materials/${id}/`);
    return response.data;
  }

  async createBillOfMaterials(data: Partial<BillOfMaterials>): Promise<BillOfMaterials> {
    const response = await api.post('/bills-of-materials/', data);
    return response.data;
  }

  async updateBillOfMaterials(id: number, data: Partial<BillOfMaterials>): Promise<BillOfMaterials> {
    const response = await api.patch(`/bills-of-materials/${id}/`, data);
    return response.data;
  }

  async deleteBillOfMaterials(id: number): Promise<void> {
    await api.delete(`/bills-of-materials/${id}/`);
  }

  // Work Orders
  async getWorkOrders(): Promise<WorkOrder[]> {
    const response = await api.get('/work-orders/');
    return response.data.results || response.data;
  }

  async getWorkOrder(id: number): Promise<WorkOrder> {
    const response = await api.get(`/work-orders/${id}/`);
    return response.data;
  }

  async createWorkOrder(data: Partial<WorkOrder>): Promise<WorkOrder> {
    const response = await api.post('/work-orders/', data);
    return response.data;
  }

  async updateWorkOrder(id: number, data: Partial<WorkOrder>): Promise<WorkOrder> {
    const response = await api.patch(`/work-orders/${id}/`, data);
    return response.data;
  }

  async deleteWorkOrder(id: number): Promise<void> {
    await api.delete(`/work-orders/${id}/`);
  }

  async startProduction(id: number): Promise<{ message: string; start_date: string }> {
    const response = await api.post(`/work-orders/${id}/start_production/`);
    return response.data;
  }

  async completeProduction(id: number, quantityProduced: number): Promise<{ message: string; quantity_produced: number; completion_date: string }> {
    const response = await api.post(`/work-orders/${id}/complete_production/`, {
      quantity_produced: quantityProduced
    });
    return response.data;
  }

  // Utility Functions
  generateWorkOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    return `WO-${timestamp}`;
  }

  calculateMaterialRequirements(bom: BillOfMaterials, quantity: number): { material: number; required_quantity: number }[] {
    return bom.items.map(item => ({
      material: item.material,
      required_quantity: item.quantity * quantity * (1 + item.scrap_percentage / 100)
    }));
  }

  getStatusColor(status: string): string {
    const colors = {
      DRAFT: 'text-gray-600',
      RELEASED: 'text-blue-600',
      IN_PROGRESS: 'text-yellow-600',
      COMPLETED: 'text-green-600',
      CANCELLED: 'text-red-600'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600';
  }
}

export const enhancedInventoryService = new EnhancedInventoryService();
export const manufacturingService = new ManufacturingService();
export default { enhancedInventoryService, manufacturingService };
