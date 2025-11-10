import { api } from './api';

// ==================== AGRICULTURE INTERFACES ====================

export interface Crop {
  id: number;
  name: string;
  scientific_name: string;
  category: string;
  growing_season: string;
  average_yield_per_hectare: number;
  created_at: string;
}

export interface Farm {
  id: number;
  business: number;
  business_name: string;
  name: string;
  location: string;
  total_area: number;
  area_unit: string;
  manager: number | null;
  manager_name: string;
  is_active: boolean;
  created_at: string;
}

export interface CropSeason {
  id: number;
  farm: number;
  farm_name: string;
  crop: number;
  crop_name: string;
  season_name: string;
  area_planted: number;
  planting_date: string;
  expected_harvest_date: string;
  actual_harvest_date: string | null;
  expected_yield: number;
  actual_yield: number;
  status: 'PLANNED' | 'PLANTED' | 'GROWING' | 'HARVESTED' | 'FAILED';
  created_at: string;
}

export interface AgriculturalExpense {
  id: number;
  crop_season: number;
  crop_season_name: string;
  category: 'SEEDS' | 'FERTILIZER' | 'PESTICIDE' | 'FUEL' | 'LABOR' | 'EQUIPMENT' | 'IRRIGATION' | 'OTHER';
  description: string;
  amount: number;
  currency: number;
  currency_code: string;
  expense_date: string;
  supplier: string;
  created_at: string;
}

export interface FarmAnalytics {
  total_farms: number;
  total_area: number;
  active_seasons: number;
  total_expenses: number;
  expected_yield: number;
  actual_yield: number;
  profitability: number;
  crop_distribution: Array<{ crop: string; area: number; percentage: number }>;
  seasonal_expenses: Array<{ month: string; amount: number }>;
  yield_comparison: Array<{ crop: string; expected: number; actual: number }>;
}

// ==================== AGRICULTURE SERVICE ====================

class AgricultureService {
  // Crop Management
  async getCrops(): Promise<Crop[]> {
    const response = await api.get('/crops/');
    return response.data.results || response.data;
  }

  async getCrop(id: number): Promise<Crop> {
    const response = await api.get(`/crops/${id}/`);
    return response.data;
  }

  async createCrop(data: Partial<Crop>): Promise<Crop> {
    const response = await api.post('/crops/', data);
    return response.data;
  }

  async updateCrop(id: number, data: Partial<Crop>): Promise<Crop> {
    const response = await api.patch(`/crops/${id}/`, data);
    return response.data;
  }

  async deleteCrop(id: number): Promise<void> {
    await api.delete(`/crops/${id}/`);
  }

  // Farm Management
  async getFarms(): Promise<Farm[]> {
    const response = await api.get('/farms/');
    return response.data.results || response.data;
  }

  async getFarm(id: number): Promise<Farm> {
    const response = await api.get(`/farms/${id}/`);
    return response.data;
  }

  async createFarm(data: Partial<Farm>): Promise<Farm> {
    const response = await api.post('/farms/', data);
    return response.data;
  }

  async updateFarm(id: number, data: Partial<Farm>): Promise<Farm> {
    const response = await api.patch(`/farms/${id}/`, data);
    return response.data;
  }

  async deleteFarm(id: number): Promise<void> {
    await api.delete(`/farms/${id}/`);
  }

  // Crop Season Management
  async getCropSeasons(): Promise<CropSeason[]> {
    const response = await api.get('/crop-seasons/');
    return response.data.results || response.data;
  }

  async getCropSeason(id: number): Promise<CropSeason> {
    const response = await api.get(`/crop-seasons/${id}/`);
    return response.data;
  }

  async createCropSeason(data: Partial<CropSeason>): Promise<CropSeason> {
    const response = await api.post('/crop-seasons/', data);
    return response.data;
  }

  async updateCropSeason(id: number, data: Partial<CropSeason>): Promise<CropSeason> {
    const response = await api.patch(`/crop-seasons/${id}/`, data);
    return response.data;
  }

  async deleteCropSeason(id: number): Promise<void> {
    await api.delete(`/crop-seasons/${id}/`);
  }

  // Agricultural Expense Management
  async getAgriculturalExpenses(): Promise<AgriculturalExpense[]> {
    const response = await api.get('/agricultural-expenses/');
    return response.data.results || response.data;
  }

  async getAgriculturalExpense(id: number): Promise<AgriculturalExpense> {
    const response = await api.get(`/agricultural-expenses/${id}/`);
    return response.data;
  }

  async createAgriculturalExpense(data: Partial<AgriculturalExpense>): Promise<AgriculturalExpense> {
    const response = await api.post('/agricultural-expenses/', data);
    return response.data;
  }

  async updateAgriculturalExpense(id: number, data: Partial<AgriculturalExpense>): Promise<AgriculturalExpense> {
    const response = await api.patch(`/agricultural-expenses/${id}/`, data);
    return response.data;
  }

  async deleteAgriculturalExpense(id: number): Promise<void> {
    await api.delete(`/agricultural-expenses/${id}/`);
  }

  // Analytics and Reporting
  async getFarmAnalytics(): Promise<FarmAnalytics> {
    // This would be implemented as a backend endpoint
    // For now, return mock data structure
    const farms = await this.getFarms();
    const seasons = await this.getCropSeasons();
    const expenses = await this.getAgriculturalExpenses();

    const totalArea = farms.reduce((sum, farm) => sum + farm.total_area, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const expectedYield = seasons.reduce((sum, season) => sum + season.expected_yield, 0);
    const actualYield = seasons.reduce((sum, season) => sum + season.actual_yield, 0);

    return {
      total_farms: farms.length,
      total_area: totalArea,
      active_seasons: seasons.filter(s => ['PLANTED', 'GROWING'].includes(s.status)).length,
      total_expenses: totalExpenses,
      expected_yield: expectedYield,
      actual_yield: actualYield,
      profitability: actualYield - totalExpenses,
      crop_distribution: [],
      seasonal_expenses: [],
      yield_comparison: []
    };
  }

  // Utility Functions
  calculateYieldPerHectare(totalYield: number, area: number): number {
    return area > 0 ? totalYield / area : 0;
  }

  calculateProfitability(yield: number, expenses: number, pricePerUnit: number): number {
    const revenue = yield * pricePerUnit;
    return revenue - expenses;
  }

  getDaysToHarvest(expectedHarvestDate: string): number {
    const today = new Date();
    const harvestDate = new Date(expectedHarvestDate);
    const diffTime = harvestDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getSeasonStatus(season: CropSeason): {
    status: string;
    color: string;
    description: string;
  } {
    const statusMap = {
      PLANNED: { color: 'text-blue-600', description: 'Planning phase' },
      PLANTED: { color: 'text-green-600', description: 'Recently planted' },
      GROWING: { color: 'text-yellow-600', description: 'Growing season' },
      HARVESTED: { color: 'text-purple-600', description: 'Harvest completed' },
      FAILED: { color: 'text-red-600', description: 'Season failed' }
    };

    return {
      status: season.status,
      ...statusMap[season.status],
    };
  }

  getCropCategories(): string[] {
    return [
      'Cereal Crops',
      'Legumes',
      'Root Crops',
      'Vegetables',
      'Fruits',
      'Cash Crops',
      'Fodder Crops',
      'Fiber Crops'
    ];
  }

  getGrowingSeasons(): string[] {
    return [
      'Summer',
      'Winter',
      'All Year',
      'Rainy Season',
      'Dry Season'
    ];
  }

  getExpenseCategories(): Array<{ value: string; label: string }> {
    return [
      { value: 'SEEDS', label: 'Seeds & Seedlings' },
      { value: 'FERTILIZER', label: 'Fertilizers' },
      { value: 'PESTICIDE', label: 'Pesticides & Herbicides' },
      { value: 'FUEL', label: 'Fuel & Energy' },
      { value: 'LABOR', label: 'Labor Costs' },
      { value: 'EQUIPMENT', label: 'Equipment & Machinery' },
      { value: 'IRRIGATION', label: 'Irrigation & Water' },
      { value: 'OTHER', label: 'Other Expenses' }
    ];
  }

  // Weather and Climate Utilities
  calculateGrowingDegreeDays(minTemp: number, maxTemp: number, baseTemp: number = 10): number {
    const avgTemp = (minTemp + maxTemp) / 2;
    return Math.max(0, avgTemp - baseTemp);
  }

  estimateWaterRequirement(cropType: string, area: number, stage: string): number {
    // Simplified water requirement calculation
    const baseRequirement = {
      'Maize': 500,
      'Wheat': 400,
      'Rice': 1200,
      'Soybean': 450,
      'Tomato': 600,
      'Potato': 350
    };

    const stageMultiplier = {
      'PLANTED': 0.3,
      'GROWING': 1.0,
      'FLOWERING': 1.2,
      'MATURITY': 0.8
    };

    const base = baseRequirement[cropType as keyof typeof baseRequirement] || 500;
    const multiplier = stageMultiplier[stage as keyof typeof stageMultiplier] || 1.0;

    return base * area * multiplier;
  }

  // Crop Rotation Recommendations
  getCropRotationRecommendations(previousCrop: string): string[] {
    const rotationMap: { [key: string]: string[] } = {
      'Maize': ['Soybean', 'Groundnuts', 'Beans'],
      'Soybean': ['Maize', 'Wheat', 'Sorghum'],
      'Wheat': ['Maize', 'Sunflower', 'Barley'],
      'Cotton': ['Maize', 'Soybean', 'Sorghum'],
      'Tobacco': ['Maize', 'Beans', 'Groundnuts']
    };

    return rotationMap[previousCrop] || ['Maize', 'Soybean', 'Wheat'];
  }

  // Financial Calculations
  calculateBreakEvenYield(totalCosts: number, pricePerUnit: number): number {
    return totalCosts / pricePerUnit;
  }

  calculateROI(revenue: number, investment: number): number {
    return investment > 0 ? ((revenue - investment) / investment) * 100 : 0;
  }

  // Export Functions
  async exportFarmData(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const response = await api.get(`/farms/export/?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportCropSeasonData(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const response = await api.get(`/crop-seasons/export/?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportExpenseData(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const response = await api.get(`/agricultural-expenses/export/?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export const agricultureService = new AgricultureService();
export default agricultureService;
