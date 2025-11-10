import { api } from './api';

// ==================== ZIMBABWE-SPECIFIC INTERFACES ====================

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_usd: number;
  is_base_currency: boolean;
  is_active: boolean;
  last_updated: string;
}

export interface ExchangeRate {
  id: number;
  from_currency: number;
  from_currency_name: string;
  to_currency: number;
  to_currency_name: string;
  rate: number;
  date: string;
  source: string;
}

export interface ZIMRAConfiguration {
  id: number;
  business: number;
  business_name: string;
  vat_registration_number: string;
  paye_number: string;
  corporate_tax_number: string;
  vat_rate: number;
  vat_threshold: number;
  is_vat_registered: boolean;
  vat_period: 'MONTHLY' | 'QUARTERLY';
  fiscal_year_start: string;
  created_at: string;
  updated_at: string;
}

export interface VATReturn {
  id: number;
  business: number;
  business_name: string;
  period_start: string;
  period_end: string;
  total_sales: number;
  vat_on_sales: number;
  total_purchases: number;
  vat_on_purchases: number;
  net_vat_payable: number;
  status: 'DRAFT' | 'SUBMITTED' | 'PAID' | 'OVERDUE';
  submission_date: string | null;
  payment_date: string | null;
  due_date: string;
  penalty_amount: number;
  interest_amount: number;
  created_at: string;
  updated_at: string;
}

export interface PAYECalculation {
  id: number;
  employee: number;
  employee_name: string;
  payroll: number;
  gross_salary: number;
  taxable_income: number;
  tax_free_threshold: number;
  paye_amount: number;
  created_at: string;
}

export interface NSSAContribution {
  id: number;
  employee: number;
  employee_name: string;
  payroll: number;
  nssa_number: string;
  gross_salary: number;
  employee_contribution: number;
  employer_contribution: number;
  total_contribution: number;
  contribution_rate: number;
  created_at: string;
}

export interface MobileMoneyIntegration {
  id: number;
  business: number;
  business_name: string;
  provider: 'ECOCASH' | 'ONEMONEY' | 'TELECASH' | 'MUKURU';
  merchant_code: string;
  is_active: boolean;
  test_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface MobileMoneyPayment {
  id: number;
  integration: number;
  provider: string;
  transaction_type: 'PAYMENT' | 'REFUND' | 'WITHDRAWAL';
  amount: number;
  currency: number;
  currency_code: string;
  phone_number: string;
  reference: string;
  external_reference: string;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED';
  status_message: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface ZimbabweAnalytics {
  business: string;
  currencies: Currency[];
  zimra_compliance: {
    configured: boolean;
    vat_registered: boolean;
    recent_returns: VATReturn[];
  };
  mobile_money: {
    integrations_count: number;
    payment_stats: Array<{ status: string; count: number }>;
  };
  inventory: {
    total_items: number;
    low_stock_alerts: number;
  };
  agriculture: {
    farms_count: number;
    active_seasons: number;
  };
}

// ==================== ZIMBABWE SERVICE ====================

class ZimbabweService {
  // Currency Management
  async getCurrencies(): Promise<Currency[]> {
    const response = await api.get('/currencies/');
    return response.data.results || response.data;
  }

  async getActiveCurrencies(): Promise<Currency[]> {
    const response = await api.get('/currencies/active_currencies/');
    return response.data;
  }

  async createCurrency(data: Partial<Currency>): Promise<Currency> {
    const response = await api.post('/currencies/', data);
    return response.data;
  }

  async updateCurrency(id: number, data: Partial<Currency>): Promise<Currency> {
    const response = await api.patch(`/currencies/${id}/`, data);
    return response.data;
  }

  async deleteCurrency(id: number): Promise<void> {
    await api.delete(`/currencies/${id}/`);
  }

  async updateExchangeRates(): Promise<{ message: string; timestamp: string }> {
    const response = await api.post('/currencies/update_exchange_rates/');
    return response.data;
  }

  // Exchange Rates
  async getExchangeRates(params?: { date_from?: string; date_to?: string }): Promise<ExchangeRate[]> {
    const response = await api.get('/exchange-rates/', { params });
    return response.data.results || response.data;
  }

  async createExchangeRate(data: Partial<ExchangeRate>): Promise<ExchangeRate> {
    const response = await api.post('/exchange-rates/', data);
    return response.data;
  }

  // ZIMRA Configuration
  async getZIMRAConfig(): Promise<ZIMRAConfiguration[]> {
    const response = await api.get('/zimra-config/');
    return response.data.results || response.data;
  }

  async createZIMRAConfig(data: Partial<ZIMRAConfiguration>): Promise<ZIMRAConfiguration> {
    const response = await api.post('/zimra-config/', data);
    return response.data;
  }

  async updateZIMRAConfig(id: number, data: Partial<ZIMRAConfiguration>): Promise<ZIMRAConfiguration> {
    const response = await api.patch(`/zimra-config/${id}/`, data);
    return response.data;
  }

  // VAT Returns
  async getVATReturns(): Promise<VATReturn[]> {
    const response = await api.get('/vat-returns/');
    return response.data.results || response.data;
  }

  async createVATReturn(data: Partial<VATReturn>): Promise<VATReturn> {
    const response = await api.post('/vat-returns/', data);
    return response.data;
  }

  async updateVATReturn(id: number, data: Partial<VATReturn>): Promise<VATReturn> {
    const response = await api.patch(`/vat-returns/${id}/`, data);
    return response.data;
  }

  async calculateVAT(id: number): Promise<VATReturn> {
    const response = await api.post(`/vat-returns/${id}/calculate_vat/`);
    return response.data;
  }

  async submitVATReturn(id: number): Promise<{ message: string; submission_date: string }> {
    const response = await api.post(`/vat-returns/${id}/submit_return/`);
    return response.data;
  }

  // PAYE Calculations
  async getPAYECalculations(): Promise<PAYECalculation[]> {
    const response = await api.get('/paye-calculations/');
    return response.data.results || response.data;
  }

  async createPAYECalculation(data: Partial<PAYECalculation>): Promise<PAYECalculation> {
    const response = await api.post('/paye-calculations/', data);
    return response.data;
  }

  // NSSA Contributions
  async getNSSAContributions(): Promise<NSSAContribution[]> {
    const response = await api.get('/nssa-contributions/');
    return response.data.results || response.data;
  }

  async createNSSAContribution(data: Partial<NSSAContribution>): Promise<NSSAContribution> {
    const response = await api.post('/nssa-contributions/', data);
    return response.data;
  }

  // Mobile Money Integration
  async getMobileMoneyIntegrations(): Promise<MobileMoneyIntegration[]> {
    const response = await api.get('/mobile-money-integrations/');
    return response.data.results || response.data;
  }

  async createMobileMoneyIntegration(data: Partial<MobileMoneyIntegration>): Promise<MobileMoneyIntegration> {
    const response = await api.post('/mobile-money-integrations/', data);
    return response.data;
  }

  async updateMobileMoneyIntegration(id: number, data: Partial<MobileMoneyIntegration>): Promise<MobileMoneyIntegration> {
    const response = await api.patch(`/mobile-money-integrations/${id}/`, data);
    return response.data;
  }

  async testMobileMoneyConnection(id: number): Promise<{ success: boolean; message: string; test_mode: boolean }> {
    const response = await api.post(`/mobile-money-integrations/${id}/test_connection/`);
    return response.data;
  }

  // Mobile Money Payments
  async getMobileMoneyPayments(): Promise<MobileMoneyPayment[]> {
    // Try legacy first to avoid initial 404s
    try {
      const res = await api.get('/mobile-money-transactions/');
      return res.data.results || res.data;
    } catch (legacyErr: any) {
      if (legacyErr?.response?.status !== 404) throw legacyErr;
    }
    const response = await api.get('/mobile-money-payments/');
    return response.data.results || response.data;
  }

  async createMobileMoneyPayment(data: Partial<MobileMoneyPayment>): Promise<MobileMoneyPayment> {
    // Try legacy first
    const mapped: any = {
      amount: data.amount,
      currency: (data as any).currency || (data as any).currency_code,
      phone_number: data.phone_number,
      description: (data as any).description || data.reference,
      customer_name: (data as any).customer_name,
      invoice_number: (data as any).invoice_number,
      payment_method: (data as any).provider || (data as any).payment_method,
    };
    try {
      const res = await api.post('/mobile-money-transactions/', mapped);
      return res.data;
    } catch (legacyErr: any) {
      if (legacyErr?.response?.status !== 404) throw legacyErr;
    }
    const response = await api.post('/mobile-money-payments/', data);
    return response.data;
  }

  async processMobileMoneyPayment(id: number): Promise<{ message: string; external_reference: string }> {
    try {
      const response = await api.post(`/mobile-money-payments/${id}/process_payment/`);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // Legacy endpoint may not support process action; best-effort no-op
        return { message: 'Process not supported on legacy endpoint', external_reference: '' } as any;
      }
      throw err;
    }
  }

  // Analytics
  async getZimbabweAnalytics(): Promise<ZimbabweAnalytics> {
    const response = await api.get('/zimbabwe-analytics/');
    return response.data;
  }

  // Utility Functions
  convertCurrency(amount: number, fromRate: number, toRate: number): number {
    return (amount / fromRate) * toRate;
  }

  formatCurrency(amount: number, currencyCode: string): string {
    const formatters: { [key: string]: Intl.NumberFormat } = {
      USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      ZWL: new Intl.NumberFormat('en-ZW', { style: 'currency', currency: 'ZWL' }),
    };

    const formatter = formatters[currencyCode] || formatters.USD;
    return formatter.format(amount);
  }

  calculateVATAmount(amount: number, vatRate: number = 15): number {
    return (amount * vatRate) / 100;
  }

  calculatePAYE(grossSalary: number, taxFreeThreshold: number = 700): number {
    if (grossSalary <= taxFreeThreshold) {
      return 0;
    }

    const taxable = grossSalary - taxFreeThreshold;
    
    if (taxable <= 1200) {
      return taxable * 0.20; // 20%
    } else if (taxable <= 3600) {
      return (1200 * 0.20) + ((taxable - 1200) * 0.25); // 25%
    } else {
      return (1200 * 0.20) + (2400 * 0.25) + ((taxable - 3600) * 0.30); // 30%
    }
  }

  calculateNSSA(grossSalary: number, rate: number = 3): number {
    const contributionRate = rate / 100;
    return {
      employee: grossSalary * contributionRate,
      employer: grossSalary * contributionRate,
      total: grossSalary * contributionRate * 2
    };
  }
}

export const zimbabweService = new ZimbabweService();
export default zimbabweService;
