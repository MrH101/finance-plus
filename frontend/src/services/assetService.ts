import api from './api';

export interface Asset {
  id: number;
  asset_code: string;
  name: string;
  asset_type: string;
  asset_type_display: string;
  description: string;
  purchase_date: string;
  purchase_cost: number;
  current_value: number;
  depreciation_method: string;
  useful_life_years: number;
  salvage_value: number;
  depreciation_rate?: number;
  purchase_currency: string;
  current_currency: string;
  exchange_rate_at_purchase: number;
  current_exchange_rate: number;
  last_revaluation_date?: string;
  revaluation_amount: number;
  accumulated_depreciation: number;
  net_book_value: number;
  location: string;
  assigned_to?: number;
  assigned_to_name?: string;
  department?: number;
  department_name?: string;
  status: string;
  status_display: string;
  warranty_expiry?: string;
  supplier?: number;
  supplier_name?: string;
  serial_number: string;
  model_number: string;
  depreciation_schedule: DepreciationScheduleItem[];
  current_depreciation: number;
  revaluations: AssetRevaluation[];
  disposals: AssetDisposal[];
  created_at: string;
  updated_at: string;
}

export interface DepreciationScheduleItem {
  year: number;
  date: string;
  depreciation: number;
  accumulated_depreciation: number;
  net_book_value: number;
}

export interface AssetRevaluation {
  id: number;
  asset: number;
  asset_name: string;
  revaluation_date: string;
  old_value: number;
  new_value: number;
  revaluation_amount: number;
  currency: string;
  exchange_rate: number;
  reason: string;
  performed_by?: number;
  performed_by_name?: string;
  created_at: string;
}

export interface AssetDisposal {
  id: number;
  asset: number;
  asset_name: string;
  disposal_date: string;
  disposal_type: string;
  disposal_amount?: number;
  disposal_currency: string;
  exchange_rate: number;
  reason: string;
  buyer_name: string;
  buyer_contact: string;
  performed_by?: number;
  performed_by_name?: string;
  created_at: string;
}

export interface AssetFormData {
  asset_code: string;
  name: string;
  asset_type: string;
  description: string;
  purchase_date: string;
  purchase_cost: number;
  current_value: number;
  depreciation_method: string;
  useful_life_years: number;
  salvage_value: number;
  depreciation_rate?: number;
  purchase_currency: string;
  current_currency: string;
  exchange_rate_at_purchase: number;
  current_exchange_rate: number;
  location: string;
  assigned_to?: number;
  department?: number;
  warranty_expiry?: string;
  supplier?: number;
  serial_number: string;
  model_number: string;
}

export interface RevaluationData {
  new_value: number;
  revaluation_date: string;
  currency: string;
  exchange_rate: number;
  reason: string;
}

export interface DisposalData {
  disposal_date: string;
  disposal_type: string;
  disposal_amount?: number;
  disposal_currency: string;
  exchange_rate: number;
  reason: string;
  buyer_name: string;
  buyer_contact: string;
}

export class AssetService {
  // Get all assets
  static async getAssets(params?: {
    page?: number;
    search?: string;
    asset_type?: string;
    status?: string;
    department?: number;
  }): Promise<{ results: Asset[]; count: number }> {
    const response = await api.get('/assets/', { params });
    return response.data;
  }

  // Get single asset
  static async getAsset(id: number): Promise<Asset> {
    const response = await api.get(`/assets/${id}/`);
    return response.data;
  }

  // Create asset
  static async createAsset(data: AssetFormData): Promise<Asset> {
    const response = await api.post('/assets/', data);
    return response.data;
  }

  // Update asset
  static async updateAsset(id: number, data: Partial<AssetFormData>): Promise<Asset> {
    const response = await api.patch(`/assets/${id}/`, data);
    return response.data;
  }

  // Delete asset
  static async deleteAsset(id: number): Promise<void> {
    await api.delete(`/assets/${id}/`);
  }

  // Revalue asset
  static async revalueAsset(id: number, data: RevaluationData): Promise<any> {
    const response = await api.post(`/assets/${id}/revalue/`, data);
    return response.data;
  }

  // Dispose asset
  static async disposeAsset(id: number, data: DisposalData): Promise<any> {
    const response = await api.post(`/assets/${id}/dispose/`, data);
    return response.data;
  }

  // Get depreciation schedule
  static async getDepreciationSchedule(id: number): Promise<DepreciationScheduleItem[]> {
    const response = await api.get(`/assets/${id}/depreciation_schedule/`);
    return response.data;
  }

  // Get depreciation report
  static async getDepreciationReport(): Promise<any[]> {
    const response = await api.get('/assets/depreciation_report/');
    return response.data;
  }

  // Update depreciation for all assets
  static async updateDepreciation(): Promise<void> {
    const assets = await this.getAssets();
    for (const asset of assets.results) {
      await api.post(`/assets/${asset.id}/update_depreciation/`);
    }
  }

  // Get assets by status
  static async getAssetsByStatus(status: string): Promise<Asset[]> {
    const response = await api.get('/assets/', { params: { status } });
    return response.data.results || response.data;
  }

  // Get assets expiring warranty soon
  static async getWarrantyExpiringSoon(days: number = 30): Promise<Asset[]> {
    const assets = await this.getAssets();
    const today = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(today.getDate() + days);
    
    return assets.results.filter(asset => {
      if (!asset.warranty_expiry) return false;
      const warrantyDate = new Date(asset.warranty_expiry);
      return warrantyDate <= expiryDate && warrantyDate >= today;
    });
  }

  // Get assets by depreciation method
  static async getAssetsByDepreciationMethod(method: string): Promise<Asset[]> {
    const response = await api.get('/assets/', { params: { depreciation_method: method } });
    return response.data.results || response.data;
  }

  // Get revaluation history
  static async getRevaluationHistory(assetId: number): Promise<AssetRevaluation[]> {
    const asset = await this.getAsset(assetId);
    return asset.revaluations;
  }

  // Get disposal history
  static async getDisposalHistory(assetId: number): Promise<AssetDisposal[]> {
    const asset = await this.getAsset(assetId);
    return asset.disposals;
  }

  // Calculate depreciation for an asset
  static calculateDepreciation(asset: Asset, asOfDate?: Date): number {
    if (asset.depreciation_method === 'NONE') {
      return 0;
    }

    const purchaseDate = new Date(asset.purchase_date);
    const targetDate = asOfDate || new Date();
    const yearsElapsed = (targetDate.getTime() - purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

    if (yearsElapsed <= 0) {
      return 0;
    }

    if (asset.depreciation_method === 'STRAIGHT_LINE') {
      const annualDepreciation = (asset.purchase_cost - asset.salvage_value) / asset.useful_life_years;
      const totalDepreciation = annualDepreciation * Math.min(yearsElapsed, asset.useful_life_years);
      return Math.min(totalDepreciation, asset.purchase_cost - asset.salvage_value);
    }

    if (asset.depreciation_method === 'REDUCING_BALANCE') {
      const rate = (asset.depreciation_rate || 20) / 100;
      let remainingValue = asset.purchase_cost;
      let totalDepreciation = 0;

      for (let year = 0; year < Math.floor(yearsElapsed) + 1; year++) {
        if (year >= asset.useful_life_years) break;
        
        const yearDepreciation = remainingValue * rate;
        if (remainingValue - yearDepreciation < asset.salvage_value) {
          const finalDepreciation = remainingValue - asset.salvage_value;
          totalDepreciation += finalDepreciation;
          break;
        }
        
        totalDepreciation += yearDepreciation;
        remainingValue -= yearDepreciation;
      }

      // Add partial year depreciation
      const partialYear = yearsElapsed - Math.floor(yearsElapsed);
      if (partialYear > 0 && remainingValue > asset.salvage_value) {
        const partialDepreciation = remainingValue * rate * partialYear;
        if (remainingValue - partialDepreciation < asset.salvage_value) {
          const finalPartialDepreciation = remainingValue - asset.salvage_value;
          totalDepreciation += finalPartialDepreciation;
        } else {
          totalDepreciation += partialDepreciation;
        }
      }

      return totalDepreciation;
    }

    return 0;
  }
}

export default AssetService; 