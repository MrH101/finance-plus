import api from './api';

export interface Batch {
  id: number;
  product: number;
  product_name: string;
  batch_number: string;
  expiry_date: string | null;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  manufacturing_date: string | null;
  supplier: number | null;
  supplier_name: string | null;
  cost_price: number | null;
  is_expired: boolean;
  days_to_expiry: number | null;
  created_at: string;
  updated_at: string;
}

export interface BatchFormData {
  product: number;
  batch_number: string;
  expiry_date?: string;
  quantity: number;
  manufacturing_date?: string;
  supplier?: number;
  cost_price?: number;
}

export class BatchService {
  // Get all batches
  static async getBatches(params?: {
    page?: number;
    search?: string;
    product?: number;
    supplier?: number;
  }): Promise<{ results: Batch[]; count: number }> {
    const response = await api.get('/batches/', { params });
    return response.data;
  }

  // Get single batch
  static async getBatch(id: number): Promise<Batch> {
    const response = await api.get(`/batches/${id}/`);
    return response.data;
  }

  // Create batch
  static async createBatch(data: BatchFormData): Promise<Batch> {
    const response = await api.post('/batches/', data);
    return response.data;
  }

  // Update batch
  static async updateBatch(id: number, data: Partial<BatchFormData>): Promise<Batch> {
    const response = await api.patch(`/batches/${id}/`, data);
    return response.data;
  }

  // Delete batch
  static async deleteBatch(id: number): Promise<void> {
    await api.delete(`/batches/${id}/`);
  }

  // Get batches expiring soon
  static async getExpiringSoon(days: number = 30): Promise<Batch[]> {
    const response = await api.get('/batches/expiring_soon/', { params: { days } });
    return response.data;
  }

  // Get expired batches
  static async getExpired(): Promise<Batch[]> {
    const response = await api.get('/batches/expired/');
    return response.data;
  }

  // Reserve quantity for a batch
  static async reserveQuantity(batchId: number, quantity: number): Promise<Batch> {
    const response = await api.post(`/batches/${batchId}/reserve/`, { quantity });
    return response.data;
  }

  // Release reserved quantity
  static async releaseReservation(batchId: number, quantity: number): Promise<Batch> {
    const response = await api.post(`/batches/${batchId}/release/`, { quantity });
    return response.data;
  }
}

export default BatchService; 