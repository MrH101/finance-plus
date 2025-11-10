import api from './api';

export type Currency = 'ZWL' | 'USD';

export interface ExchangeRate {
  base: Currency;
  quote: Currency;
  rate: number;
  asOf: string; // ISO date
}

// Placeholder in-memory service. In production, fetch from backend which integrates RBZ source.
export class RatesService {
  private static latest: ExchangeRate = {
    base: 'USD',
    quote: 'ZWL',
    rate: 1000, // example rate
    asOf: new Date().toISOString(),
  };

  static async getLatest(): Promise<ExchangeRate> {
    return this.latest;
  }

  static async convert(amount: number, from: Currency, to: Currency): Promise<number> {
    const { base, quote, rate } = this.latest;
    if (from === to) return amount;
    if (from === base && to === quote) {
      return amount * rate;
    }
    if (from === quote && to === base) {
      return amount / rate;
    }
    // If we get here, we don't know how to convert; return as-is
    return amount;
  }
}

// Analytics Types (keep minimal to satisfy UI needs)
export interface AnalyticsParams {
  timeRange?: string;
}

export interface AnalyticsData {
  revenue: { current: number; growth: number; monthly: any };
  sales: { total: number; growth: number; daily: any; byCategory: any };
  customers: { total: number; growth: number; retention: any };
  inventory: { value: number; turnover: any };
  employees: { active: number; performance: any };
  projects: { inProgress: number };
}

export interface KPIMetric {
  id: string;
  title: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  currency?: string;
  icon?: string;
  color?: string;
}

export interface ZimbabweAnalytics {
  kpis?: {
    revenue?: number | null;
    expenses?: number | null;
    profit?: number | null;
    cash_balance?: number | null;
  };
  recent_activity?: Array<{
    id: number | string;
    type: string;
    description?: string;
    created_at?: string;
  }>;
  currencies?: Array<{
    id: number;
    code: string;
    name: string;
    symbol: string;
    exchange_rate_to_usd: number;
    is_base_currency: boolean;
    is_active: boolean;
    last_updated?: string;
  }>;
  zimra_compliance?: {
    configured: boolean;
    vat_registered: boolean;
    recent_returns?: any[];
  };
}

class AnalyticsService {
  async getAnalyticsData(params: AnalyticsParams = {}): Promise<AnalyticsData> {
    try {
      const response = await api.get('/analytics/', { params });
      return response.data;
    } catch (error) {
      // Provide a fallback shape so UI can render even without backend data
      return {
        revenue: { current: 0, growth: 0, monthly: [] },
        sales: { total: 0, growth: 0, daily: [], byCategory: [] },
        customers: { total: 0, growth: 0, retention: [] },
        inventory: { value: 0, turnover: [] },
        employees: { active: 0, performance: [] },
        projects: { inProgress: 0 },
      };
    }
  }

  async exportAnalytics(format: 'pdf' | 'excel' | 'csv', params: AnalyticsParams = {}): Promise<Blob> {
    try {
      const response = await api.get(`/analytics/export/${format}/`, {
        params,
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      // Return empty blob as fallback
      return new Blob([], { type: 'application/octet-stream' });
    }
  }
}

export async function getZimbabweAnalytics(signal?: AbortSignal) {
  const res = await api.get<ZimbabweAnalytics>('/zimbabwe-analytics/', { signal });
  return res.data;
}

const analyticsService = new AnalyticsService();
export default analyticsService; 